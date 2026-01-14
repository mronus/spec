import type { AgentType, SpecArtifact, IRType } from './spec.types';
import type { ModelType } from './llm.types';

export interface AgentContext {
  sessionId: string;
  moduleName: string;
  userPrompt: string;
  previousArtifacts: Map<IRType, SpecArtifact>;
  feedbackHistory: FeedbackEntry[];
}

export interface AgentResult {
  artifacts: SpecArtifact[];
  success: boolean;
  error?: string;
}

export interface FeedbackEntry {
  cycle: number;
  artifactType: IRType;
  reviewerFeedback: string;
  executorResponse: string;
  timestamp: Date;
}

export interface FeedbackCycleResult {
  artifact: SpecArtifact;
  cyclesUsed: number;
  approved: boolean;
  feedbackHistory: FeedbackEntry[];
}

export interface AgentConfig {
  agentType: AgentType;
  executorModel: ModelType;
  reviewerModel: ModelType;
  maxFeedbackCycles: number;
}

export interface AgentCallbacks {
  onProgress: (message: string) => void;
  onArtifactStart: (irType: IRType) => void;
  onArtifactComplete: (artifact: SpecArtifact) => void;
  onFeedbackCycle: (cycle: number, maxCycles: number) => void;
  onQuestion: (question: string) => Promise<string>;
}

export interface ReviewResult {
  approved: boolean;
  feedback?: string;
  suggestions?: string[];
}
