import type { LLMRequest, LLMResponse, APIKeys, ModelType } from '../types/llm.types';
import { getModelProvider } from '../types/llm.types';
import { callAnthropic } from './anthropic';
import { callOpenAI } from './openai';
import { type RateLimitInfo } from './rate-limiter';

export interface RateLimitWaitInfo {
  delayMs: number;
  attempt: number;
  rateLimitInfo?: RateLimitInfo;
  provider: 'anthropic' | 'openai';
}

export interface LLMClientCallbacks {
  onRateLimitWait?: (info: RateLimitWaitInfo) => void;
}

export class LLMClient {
  private apiKeys: APIKeys;
  private callbacks: LLMClientCallbacks;

  constructor(apiKeys: APIKeys, callbacks: LLMClientCallbacks = {}) {
    this.apiKeys = apiKeys;
    this.callbacks = callbacks;
  }

  setCallbacks(callbacks: LLMClientCallbacks): void {
    this.callbacks = callbacks;
  }

  async generate(request: LLMRequest): Promise<LLMResponse> {
    const provider = getModelProvider(request.model);

    if (provider === 'anthropic') {
      const apiKey = this.apiKeys.anthropic;
      if (!apiKey) {
        throw new Error('Anthropic API key is required for Claude models');
      }
      return callAnthropic(request, apiKey, {
        onRateLimitWait: (info) => {
          this.callbacks.onRateLimitWait?.({
            ...info,
            provider: 'anthropic',
          });
        },
      });
    }

    if (provider === 'openai') {
      const apiKey = this.apiKeys.openai;
      if (!apiKey) {
        throw new Error('OpenAI API key is required for ChatGPT models');
      }
      return callOpenAI(request, apiKey, {
        onRateLimitWait: (info) => {
          this.callbacks.onRateLimitWait?.({
            ...info,
            provider: 'openai',
          });
        },
      });
    }

    throw new Error(`Unknown provider for model: ${request.model}`);
  }

  validateApiKeys(executorModel: ModelType, reviewerModel: ModelType): string[] {
    const errors: string[] = [];

    const executorProvider = getModelProvider(executorModel);
    const reviewerProvider = getModelProvider(reviewerModel);

    if (executorProvider === 'anthropic' || reviewerProvider === 'anthropic') {
      if (!this.apiKeys.anthropic) {
        errors.push('Anthropic API key is required for Claude models');
      }
    }

    if (executorProvider === 'openai' || reviewerProvider === 'openai') {
      if (!this.apiKeys.openai) {
        errors.push('OpenAI API key is required for ChatGPT models');
      }
    }

    return errors;
  }
}
