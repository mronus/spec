import type { AgentType, SpecArtifact, IRType } from '../types/spec.types';
import type { AgentContext, AgentCallbacks } from '../types/agent.types';
import type { ModelType } from '../types/llm.types';
import { AGENT_ORDER, AGENT_DISPLAY_NAMES } from '../types/spec.types';
import { LLMClient } from '../llm/llm-client';
import { createAgent } from '../agents';

export interface PipelineConfig {
  llmClient: LLMClient;
  executorModel: ModelType;
  reviewerModel: ModelType;
  maxFeedbackCycles: number;
}

export interface PipelineCallbacks {
  onStageStart: (stage: number, agent: AgentType) => void;
  onStageComplete: (stage: number, agent: AgentType, artifacts: SpecArtifact[]) => void;
  onProgress: (message: string) => void;
  onArtifactStart: (irType: IRType) => void;
  onArtifactComplete: (artifact: SpecArtifact) => void;
  onFeedbackCycle: (cycle: number, maxCycles: number) => void;
  onQuestion: (question: string) => Promise<string>;
  onError: (error: Error) => void;
}

export interface PipelineResult {
  success: boolean;
  artifacts: SpecArtifact[];
  error?: string;
}

export class Pipeline {
  private config: PipelineConfig;
  private callbacks: PipelineCallbacks;

  constructor(config: PipelineConfig, callbacks: PipelineCallbacks) {
    this.config = config;
    this.callbacks = callbacks;
  }

  async execute(
    userPrompt: string,
    moduleName: string,
    startFromStage: number = 0,
    existingArtifacts?: Map<IRType, SpecArtifact>
  ): Promise<PipelineResult> {
    const allArtifacts: SpecArtifact[] = [];
    const previousArtifacts = existingArtifacts
      ? new Map(existingArtifacts)
      : new Map<IRType, SpecArtifact>();

    // Add existing artifacts to allArtifacts for the result
    if (existingArtifacts) {
      for (const artifact of existingArtifacts.values()) {
        allArtifacts.push(artifact);
      }
    }

    const context: AgentContext = {
      sessionId: this.generateSessionId(),
      moduleName,
      userPrompt,
      previousArtifacts,
      feedbackHistory: [],
    };

    for (let i = startFromStage; i < AGENT_ORDER.length; i++) {
      const agentType = AGENT_ORDER[i];
      const stage = i + 1;

      this.callbacks.onStageStart(stage, agentType);
      this.callbacks.onProgress(`Starting ${AGENT_DISPLAY_NAMES[agentType]}...`);

      const agentCallbacks: AgentCallbacks = {
        onProgress: this.callbacks.onProgress,
        onArtifactStart: this.callbacks.onArtifactStart,
        onArtifactComplete: this.callbacks.onArtifactComplete,
        onFeedbackCycle: this.callbacks.onFeedbackCycle,
        onQuestion: this.callbacks.onQuestion,
      };

      const agent = createAgent(
        agentType,
        this.config.llmClient,
        this.config.executorModel,
        this.config.reviewerModel,
        agentCallbacks,
        this.config.maxFeedbackCycles
      );

      try {
        const result = await agent.execute(context);

        if (!result.success) {
          this.callbacks.onError(new Error(result.error || 'Agent execution failed'));
          return {
            success: false,
            artifacts: allArtifacts,
            error: result.error,
          };
        }

        // Add artifacts to collections
        for (const artifact of result.artifacts) {
          allArtifacts.push(artifact);
          previousArtifacts.set(artifact.irType, artifact);
        }

        this.callbacks.onStageComplete(stage, agentType, result.artifacts);
        this.callbacks.onProgress(`Completed ${AGENT_DISPLAY_NAMES[agentType]}`);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        this.callbacks.onError(err);
        return {
          success: false,
          artifacts: allArtifacts,
          error: err.message,
        };
      }
    }

    return {
      success: true,
      artifacts: allArtifacts,
    };
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}
