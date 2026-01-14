import type { ModelType, APIKeys } from './llm.types';
import type { AgentType, IRType } from './spec.types';

export type OrchestrationState =
  | 'idle'
  | 'running'
  | 'paused'
  | 'complete'
  | 'error';

export interface OrchestrationConfig {
  prompt: string;
  executorModel: ModelType;
  reviewerModel: ModelType;
  apiKeys: APIKeys;
  maxFeedbackCycles: number;
}

export interface OrchestrationProgress {
  state: OrchestrationState;
  currentStage: number;
  totalStages: number;
  currentAgent: AgentType | null;
  currentArtifact: IRType | null;
  currentFeedbackCycle: number;
  maxFeedbackCycles: number;
  completedArtifacts: string[];
  statusMessage: string;
  error?: string;
}

export type AgentCategory = 'spec' | 'execution';

export interface StageInfo {
  stage: number;
  agent: AgentType;
  name: string;
  category: AgentCategory;
  outputs: IRType[];
  status: 'pending' | 'running' | 'complete' | 'error';
}

export const AGENT_CATEGORY_LABELS: Record<AgentCategory, string> = {
  spec: 'Spec Agents',
  execution: 'Execution Agents',
};

export const PIPELINE_STAGES: StageInfo[] = [
  { stage: 1, agent: 'product', name: 'Product Agent', category: 'spec', outputs: ['contract'], status: 'pending' },
  { stage: 2, agent: 'architect', name: 'Architect Agent', category: 'spec', outputs: ['module', 'infrastructure', 'data', 'decisions'], status: 'pending' },
  { stage: 3, agent: 'scrum', name: 'Scrum Agent', category: 'spec', outputs: ['tasks'], status: 'pending' },
  { stage: 4, agent: 'developer', name: 'Developer Agent', category: 'execution', outputs: ['types', 'events', 'interface', 'function'], status: 'pending' },
  { stage: 5, agent: 'tester', name: 'Tester Agent', category: 'execution', outputs: ['tests'], status: 'pending' },
  { stage: 6, agent: 'devops', name: 'DevOps Agent', category: 'execution', outputs: ['pipeline'], status: 'pending' },
];

export function createInitialProgress(): OrchestrationProgress {
  return {
    state: 'idle',
    currentStage: 0,
    totalStages: PIPELINE_STAGES.length,
    currentAgent: null,
    currentArtifact: null,
    currentFeedbackCycle: 0,
    maxFeedbackCycles: 3,
    completedArtifacts: [],
    statusMessage: 'Ready to start',
  };
}
