export type IRType =
  | 'contract'
  | 'module'
  | 'infrastructure'
  | 'data'
  | 'decisions'
  | 'tasks'
  | 'types'
  | 'interface'
  | 'function'
  | 'events'
  | 'tests'
  | 'pipeline';

export interface SpecArtifact {
  irType: IRType;
  fileName: string;
  filePath: string;
  content: string;
  version: string;
  createdBy: AgentType;
  createdAt: Date;
}

export type AgentType =
  | 'product'
  | 'architect'
  | 'scrum'
  | 'developer'
  | 'tester'
  | 'devops';

export const AGENT_ORDER: AgentType[] = [
  'product',
  'architect',
  'scrum',
  'developer',
  'tester',
  'devops',
];

export const AGENT_DISPLAY_NAMES: Record<AgentType, string> = {
  product: 'Product Agent',
  architect: 'Architect Agent',
  scrum: 'Scrum Agent',
  developer: 'Developer Agent',
  tester: 'Tester Agent',
  devops: 'DevOps Agent',
};

export const AGENT_OUTPUTS: Record<AgentType, IRType[]> = {
  product: ['contract'],
  architect: ['module', 'infrastructure', 'data', 'decisions'],
  scrum: ['tasks'],
  developer: ['types', 'events', 'interface', 'function'],
  tester: ['tests'],
  devops: ['pipeline'],
};

export function getIRTypeFileName(irType: IRType, componentName?: string): string {
  if (irType === 'interface' || irType === 'function') {
    return componentName ? `${componentName}.spec` : `${irType}.spec`;
  }
  return `${irType}.spec`;
}

export function getIRTypeFilePath(irType: IRType, componentName?: string): string {
  if (irType === 'interface') {
    return `interfaces/${getIRTypeFileName(irType, componentName)}`;
  }
  if (irType === 'function') {
    return `functions/${getIRTypeFileName(irType, componentName)}`;
  }
  return getIRTypeFileName(irType);
}
