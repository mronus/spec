import type { ModelType, LLMRequest, LLMResponse } from '../types/llm.types';
import {
  isRateLimitError,
  parseRateLimitHeaders,
  calculateBackoffDelay,
  sleep,
  type RateLimitInfo,
} from './rate-limiter';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const RATE_LIMIT_CONFIG = {
  maxRetries: 5,
  baseDelayMs: 2000,
  maxDelayMs: 120000, // 2 minutes max
};

function getOpenAIModelId(model: ModelType): string {
  switch (model) {
    case 'chatgpt-5-2':
      return 'gpt-5.2';
    default:
      throw new Error(`Unsupported OpenAI model: ${model}`);
  }
}

export interface OpenAICallOptions {
  onRateLimitWait?: (info: { delayMs: number; attempt: number; rateLimitInfo?: RateLimitInfo }) => void;
}

export async function callOpenAI(
  request: LLMRequest,
  apiKey: string,
  options: OpenAICallOptions = {}
): Promise<LLMResponse> {
  const modelId = getOpenAIModelId(request.model);
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= RATE_LIMIT_CONFIG.maxRetries; attempt++) {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelId,
        max_tokens: request.maxTokens || 8192,
        temperature: request.temperature ?? 0.7,
        messages: [
          {
            role: 'system',
            content: request.systemPrompt,
          },
          {
            role: 'user',
            content: request.userMessage,
          },
        ],
      }),
    });

    // Check for rate limit
    if (isRateLimitError(response.status)) {
      const rateLimitInfo = parseRateLimitHeaders(response.headers, 'openai');

      // Try to extract retry-after from error body
      let retryAfterMs = rateLimitInfo.retryAfterMs;
      try {
        const errorData = await response.clone().json();
        if (errorData.error?.message) {
          const match = errorData.error.message.match(/(\d+)\s*seconds?/i);
          if (match) {
            retryAfterMs = parseInt(match[1], 10) * 1000;
          }
        }
      } catch {
        // Ignore parse errors
      }

      if (attempt < RATE_LIMIT_CONFIG.maxRetries) {
        const delayMs = calculateBackoffDelay(
          attempt,
          RATE_LIMIT_CONFIG.baseDelayMs,
          RATE_LIMIT_CONFIG.maxDelayMs,
          retryAfterMs
        );

        options.onRateLimitWait?.({
          delayMs,
          attempt,
          rateLimitInfo: { ...rateLimitInfo, retryAfterMs },
        });

        await sleep(delayMs);
        continue;
      }

      // Max retries exhausted
      throw new Error(
        `OpenAI rate limit exceeded after ${attempt} attempts. Please wait and try again.`
      );
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || response.statusText;

      // For non-rate-limit errors, throw immediately for auth issues
      if (response.status === 401 || response.status === 403) {
        throw new Error(`OpenAI API error: ${response.status} - ${errorMessage}`);
      }

      // For server errors (5xx), retry
      if (response.status >= 500 && attempt < RATE_LIMIT_CONFIG.maxRetries) {
        const delayMs = calculateBackoffDelay(
          attempt,
          RATE_LIMIT_CONFIG.baseDelayMs,
          RATE_LIMIT_CONFIG.maxDelayMs
        );
        await sleep(delayMs);
        continue;
      }

      throw new Error(`OpenAI API error: ${response.status} - ${errorMessage}`);
    }

    const data = await response.json();

    const content = data.choices?.[0]?.message?.content || '';

    return {
      content,
      model: request.model,
      usage: {
        inputTokens: data.usage?.prompt_tokens || 0,
        outputTokens: data.usage?.completion_tokens || 0,
      },
    };
  }

  throw lastError || new Error('Max retries exceeded for OpenAI API call');
}
