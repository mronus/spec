import type { SpecArtifact, IRType } from '../types/spec.types';
import type { OrchestrationConfig, OrchestrationProgress } from '../types/orchestration.types';
import { createInitialProgress, PIPELINE_STAGES } from '../types/orchestration.types';
import { LLMClient } from '../llm/llm-client';
import { Pipeline, type PipelineCallbacks } from './pipeline';
import { generateZip } from '../utils/zip-generator';
import { saveState } from '../utils/storage';
import { formatDuration } from '../llm/rate-limiter';

export interface OrchestratorCallbacks {
  onProgressUpdate: (progress: OrchestrationProgress) => void;
  onArtifactsComplete: (artifacts: SpecArtifact[]) => void;
  onQuestion: (question: string) => Promise<string>;
  onZipReady: (zipBlob: Blob) => void;
  onError: (error: string) => void;
  onRateLimitWait?: (info: { delayMs: number; attempt: number; provider: string }) => void;
}

export interface ResumeState {
  artifacts: SpecArtifact[];
  startFromStage: number;
  moduleName: string;
}

export class Orchestrator {
  private config: OrchestrationConfig;
  private callbacks: OrchestratorCallbacks;
  private progress: OrchestrationProgress;
  private artifacts: SpecArtifact[];
  private moduleName: string;

  constructor(
    config: OrchestrationConfig,
    callbacks: OrchestratorCallbacks,
    resumeState?: ResumeState
  ) {
    this.config = config;
    this.callbacks = callbacks;
    this.progress = createInitialProgress();
    this.progress.maxFeedbackCycles = config.maxFeedbackCycles;

    if (resumeState) {
      this.artifacts = resumeState.artifacts;
      this.moduleName = resumeState.moduleName;
      this.progress.currentStage = resumeState.startFromStage;
      this.progress.completedArtifacts = resumeState.artifacts.map(a => a.fileName);
    } else {
      this.artifacts = [];
      this.moduleName = this.extractModuleName(config.prompt);
    }
  }

  async run(): Promise<void> {
    // Validate API keys
    const llmClient = new LLMClient(this.config.apiKeys, {
      onRateLimitWait: (info) => {
        // Update status message to show rate limit wait
        this.updateProgress({
          statusMessage: `Rate limited by ${info.provider}. Waiting ${formatDuration(info.delayMs)} (attempt ${info.attempt}/5)...`,
        });
        // Also call the callback if provided
        this.callbacks.onRateLimitWait?.(info);
      },
    });
    const keyErrors = llmClient.validateApiKeys(
      this.config.executorModel,
      this.config.reviewerModel
    );

    if (keyErrors.length > 0) {
      this.updateProgress({
        state: 'error',
        error: keyErrors.join(', '),
      });
      this.callbacks.onError(keyErrors.join(', '));
      return;
    }

    // Update progress to running
    this.updateProgress({
      state: 'running',
      statusMessage: this.progress.currentStage > 0
        ? `Resuming from stage ${this.progress.currentStage + 1}...`
        : 'Starting orchestration...',
    });

    // Create pipeline callbacks
    const pipelineCallbacks: PipelineCallbacks = {
      onStageStart: (stage, agent) => {
        this.updateProgress({
          currentStage: stage,
          currentAgent: agent,
          statusMessage: `Starting stage ${stage}: ${agent}`,
        });
        this.persistState();
      },
      onStageComplete: (stage, agent, artifacts) => {
        const completedArtifacts = [
          ...this.progress.completedArtifacts,
          ...artifacts.map((a) => a.fileName),
        ];
        this.updateProgress({
          completedArtifacts,
          statusMessage: `Completed stage ${stage}: ${agent}`,
        });
        this.persistState();
      },
      onProgress: (message) => {
        this.updateProgress({ statusMessage: message });
      },
      onArtifactStart: (irType) => {
        this.updateProgress({
          currentArtifact: irType,
          currentFeedbackCycle: 0,
          statusMessage: `Generating ${irType}.spec`,
        });
      },
      onArtifactComplete: (artifact) => {
        this.artifacts.push(artifact);
        this.updateProgress({
          statusMessage: `Completed ${artifact.fileName}`,
        });
        this.persistState();
      },
      onFeedbackCycle: (cycle, maxCycles) => {
        this.updateProgress({
          currentFeedbackCycle: cycle,
          maxFeedbackCycles: maxCycles,
          statusMessage: `Feedback cycle ${cycle}/${maxCycles}`,
        });
      },
      onQuestion: this.callbacks.onQuestion,
      onError: (error) => {
        this.updateProgress({
          state: 'error',
          error: error.message,
        });
        this.persistState();
        this.callbacks.onError(error.message);
      },
    };

    // Create and run pipeline
    const pipeline = new Pipeline(
      {
        llmClient,
        executorModel: this.config.executorModel,
        reviewerModel: this.config.reviewerModel,
        maxFeedbackCycles: this.config.maxFeedbackCycles,
      },
      pipelineCallbacks
    );

    // Build previous artifacts map for resume
    const previousArtifacts = new Map<IRType, SpecArtifact>();
    for (const artifact of this.artifacts) {
      previousArtifacts.set(artifact.irType, artifact);
    }

    const result = await pipeline.execute(
      this.config.prompt,
      this.moduleName,
      this.progress.currentStage,
      previousArtifacts
    );

    if (result.success) {
      // Generate ZIP
      this.updateProgress({
        statusMessage: 'Generating ZIP file...',
      });

      const zipBlob = await generateZip(result.artifacts, this.moduleName);

      this.updateProgress({
        state: 'complete',
        currentStage: PIPELINE_STAGES.length,
        statusMessage: 'Generation complete!',
      });

      this.callbacks.onArtifactsComplete(result.artifacts);
      this.callbacks.onZipReady(zipBlob);
    } else {
      this.updateProgress({
        state: 'error',
        error: result.error || 'Unknown error',
      });
      this.persistState();
      this.callbacks.onError(result.error || 'Unknown error');
    }
  }

  private updateProgress(update: Partial<OrchestrationProgress>): void {
    this.progress = { ...this.progress, ...update };
    this.callbacks.onProgressUpdate(this.progress);
  }

  private persistState(): void {
    saveState(this.config, this.progress, this.artifacts, this.moduleName);
  }

  private extractModuleName(prompt: string): string {
    const patterns = [
      /(?:build|create|implement|develop)\s+(?:a|an|the)?\s*(.+?)\s+(?:system|service|module|application|app)/i,
      /(.+?)\s+(?:system|service|module|application|app)/i,
    ];

    for (const pattern of patterns) {
      const match = prompt.match(pattern);
      if (match && match[1]) {
        return match[1]
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 30);
      }
    }

    return 'generated-module';
  }
}
