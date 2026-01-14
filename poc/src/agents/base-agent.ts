import type { AgentType, IRType, SpecArtifact } from '../types/spec.types';
import type {
  AgentContext,
  AgentResult,
  AgentCallbacks,
  FeedbackEntry,
  FeedbackCycleResult,
} from '../types/agent.types';
import type { ModelType } from '../types/llm.types';
import { LLMClient } from '../llm/llm-client';
import { getSystemPrompt, getReviewerPrompt } from '../llm/prompts/system-prompts';
import { buildExecutorPrompt } from '../llm/prompts/executor-prompts';
import { buildReviewerPrompt, parseReviewResult } from '../llm/prompts/reviewer-prompts';
import { getIRTypeFilePath } from '../types/spec.types';

export abstract class BaseAgent {
  protected agentType: AgentType;
  protected llmClient: LLMClient;
  protected executorModel: ModelType;
  protected reviewerModel: ModelType;
  protected maxFeedbackCycles: number;
  protected callbacks: AgentCallbacks;

  constructor(
    agentType: AgentType,
    llmClient: LLMClient,
    executorModel: ModelType,
    reviewerModel: ModelType,
    callbacks: AgentCallbacks,
    maxFeedbackCycles: number = 3
  ) {
    this.agentType = agentType;
    this.llmClient = llmClient;
    this.executorModel = executorModel;
    this.reviewerModel = reviewerModel;
    this.callbacks = callbacks;
    this.maxFeedbackCycles = maxFeedbackCycles;
  }

  abstract getOutputIRTypes(): IRType[];

  async execute(context: AgentContext): Promise<AgentResult> {
    const artifacts: SpecArtifact[] = [];
    const irTypes = this.getOutputIRTypes();

    try {
      for (const irType of irTypes) {
        this.callbacks.onArtifactStart(irType);
        this.callbacks.onProgress(`Generating ${irType}.spec.ir...`);

        const result = await this.generateWithFeedbackCycle(context, irType);

        artifacts.push(result.artifact);
        this.callbacks.onArtifactComplete(result.artifact);

        // Add to context for subsequent artifacts
        context.previousArtifacts.set(irType, result.artifact);
      }

      return {
        artifacts,
        success: true,
      };
    } catch (error) {
      return {
        artifacts,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  protected async generateWithFeedbackCycle(
    context: AgentContext,
    irType: IRType
  ): Promise<FeedbackCycleResult> {
    const feedbackHistory: FeedbackEntry[] = [];
    let artifact: SpecArtifact | null = null;

    for (let cycle = 1; cycle <= this.maxFeedbackCycles; cycle++) {
      this.callbacks.onFeedbackCycle(cycle, this.maxFeedbackCycles);
      this.callbacks.onProgress(`${irType}.spec.ir - Cycle ${cycle}/${this.maxFeedbackCycles}: Generating...`);

      // Generate artifact
      const executorPrompt = buildExecutorPrompt(
        this.agentType,
        context,
        irType,
        feedbackHistory
      );

      const executorResponse = await this.llmClient.generate({
        systemPrompt: getSystemPrompt(this.agentType),
        userMessage: executorPrompt,
        model: this.executorModel,
        maxTokens: 8192,
        temperature: 0.7,
      });

      const content = this.cleanSpecContent(executorResponse.content);

      artifact = {
        irType,
        fileName: `${irType}.spec.ir`,
        filePath: getIRTypeFilePath(irType),
        content,
        version: '1.0.0',
        createdBy: this.agentType,
        createdAt: new Date(),
      };

      // Review artifact
      this.callbacks.onProgress(`${irType}.spec.ir - Cycle ${cycle}/${this.maxFeedbackCycles}: Reviewing...`);

      const reviewerPrompt = buildReviewerPrompt(
        irType,
        content,
        context,
        feedbackHistory
      );

      const reviewerResponse = await this.llmClient.generate({
        systemPrompt: getReviewerPrompt(),
        userMessage: reviewerPrompt,
        model: this.reviewerModel,
        maxTokens: 2048,
        temperature: 0.3,
      });

      const reviewResult = parseReviewResult(reviewerResponse.content);

      if (reviewResult.approved) {
        this.callbacks.onProgress(`${irType}.spec.ir - Approved on cycle ${cycle}`);
        return {
          artifact,
          cyclesUsed: cycle,
          approved: true,
          feedbackHistory,
        };
      }

      // Add feedback to history for next cycle
      feedbackHistory.push({
        cycle,
        artifactType: irType,
        reviewerFeedback: reviewResult.feedback,
        executorResponse: content,
        timestamp: new Date(),
      });

      this.callbacks.onProgress(`${irType}.spec.ir - Cycle ${cycle}/${this.maxFeedbackCycles}: Revision needed`);
    }

    // Max cycles reached, return best effort
    this.callbacks.onProgress(`${irType}.spec.ir - Max cycles reached, using best effort`);

    return {
      artifact: artifact!,
      cyclesUsed: this.maxFeedbackCycles,
      approved: false,
      feedbackHistory,
    };
  }

  protected cleanSpecContent(content: string): string {
    // Remove markdown code fences if present
    let cleaned = content.trim();

    // Remove opening fence
    if (cleaned.startsWith('```spec')) {
      cleaned = cleaned.replace(/^```spec\n?/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\w*\n?/, '');
    }

    // Remove closing fence
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.replace(/\n?```$/, '');
    }

    return cleaned.trim();
  }
}
