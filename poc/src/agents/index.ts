export { BaseAgent } from './base-agent';
export { ProductAgent } from './product-agent';
export { ArchitectAgent } from './architect-agent';
export { ScrumAgent } from './scrum-agent';
export { DeveloperAgent } from './developer-agent';
export { TesterAgent } from './tester-agent';
export { DevOpsAgent } from './devops-agent';

import type { AgentType } from '../types/spec.types';
import type { ModelType } from '../types/llm.types';
import type { AgentCallbacks } from '../types/agent.types';
import { LLMClient } from '../llm/llm-client';
import { BaseAgent } from './base-agent';
import { ProductAgent } from './product-agent';
import { ArchitectAgent } from './architect-agent';
import { ScrumAgent } from './scrum-agent';
import { DeveloperAgent } from './developer-agent';
import { TesterAgent } from './tester-agent';
import { DevOpsAgent } from './devops-agent';

export function createAgent(
  agentType: AgentType,
  llmClient: LLMClient,
  executorModel: ModelType,
  reviewerModel: ModelType,
  callbacks: AgentCallbacks,
  maxFeedbackCycles: number = 3
): BaseAgent {
  switch (agentType) {
    case 'product':
      return new ProductAgent(agentType, llmClient, executorModel, reviewerModel, callbacks, maxFeedbackCycles);
    case 'architect':
      return new ArchitectAgent(agentType, llmClient, executorModel, reviewerModel, callbacks, maxFeedbackCycles);
    case 'scrum':
      return new ScrumAgent(agentType, llmClient, executorModel, reviewerModel, callbacks, maxFeedbackCycles);
    case 'developer':
      return new DeveloperAgent(agentType, llmClient, executorModel, reviewerModel, callbacks, maxFeedbackCycles);
    case 'tester':
      return new TesterAgent(agentType, llmClient, executorModel, reviewerModel, callbacks, maxFeedbackCycles);
    case 'devops':
      return new DevOpsAgent(agentType, llmClient, executorModel, reviewerModel, callbacks, maxFeedbackCycles);
    default:
      throw new Error(`Unknown agent type: ${agentType}`);
  }
}
