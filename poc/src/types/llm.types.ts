export type ModelType =
  | 'claude-sonnet-4-5'
  | 'claude-opus-4-5'
  | 'chatgpt-5-2';

export type ModelProvider = 'anthropic' | 'openai';

export interface LLMRequest {
  systemPrompt: string;
  userMessage: string;
  model: ModelType;
  maxTokens?: number;
  temperature?: number;
}

export interface LLMResponse {
  content: string;
  model: ModelType;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface APIKeys {
  anthropic?: string;
  openai?: string;
}

export function getModelProvider(model: ModelType): ModelProvider {
  if (model.startsWith('claude')) {
    return 'anthropic';
  }
  return 'openai';
}

export function getModelDisplayName(model: ModelType): string {
  switch (model) {
    case 'claude-sonnet-4-5':
      return 'Claude Sonnet 4.5';
    case 'claude-opus-4-5':
      return 'Claude Opus 4.5';
    case 'chatgpt-5-2':
      return 'ChatGPT 5.2';
  }
}

export const AVAILABLE_MODELS: { value: ModelType; label: string }[] = [
  { value: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5' },
  { value: 'claude-opus-4-5', label: 'Claude Opus 4.5' },
  { value: 'chatgpt-5-2', label: 'ChatGPT 5.2' },
];
