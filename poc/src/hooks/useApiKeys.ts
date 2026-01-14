import { useState, useCallback, useMemo } from 'react';
import type { APIKeys, ModelType } from '../types/llm.types';
import { getModelProvider } from '../types/llm.types';

interface UseApiKeysReturn {
  apiKeys: APIKeys;
  setAnthropicKey: (key: string) => void;
  setOpenAIKey: (key: string) => void;
  validateKeys: (executorModel: ModelType, reviewerModel: ModelType) => string[];
  needsAnthropicKey: (executorModel: ModelType, reviewerModel: ModelType) => boolean;
  needsOpenAIKey: (executorModel: ModelType, reviewerModel: ModelType) => boolean;
}

export function useApiKeys(): UseApiKeysReturn {
  const [apiKeys, setApiKeys] = useState<APIKeys>({
    anthropic: '',
    openai: '',
  });

  const setAnthropicKey = useCallback((key: string) => {
    setApiKeys((prev) => ({ ...prev, anthropic: key }));
  }, []);

  const setOpenAIKey = useCallback((key: string) => {
    setApiKeys((prev) => ({ ...prev, openai: key }));
  }, []);

  const validateKeys = useCallback(
    (executorModel: ModelType, reviewerModel: ModelType): string[] => {
      const errors: string[] = [];

      const executorProvider = getModelProvider(executorModel);
      const reviewerProvider = getModelProvider(reviewerModel);

      const needsAnthropic =
        executorProvider === 'anthropic' || reviewerProvider === 'anthropic';
      const needsOpenAI =
        executorProvider === 'openai' || reviewerProvider === 'openai';

      if (needsAnthropic && !apiKeys.anthropic?.trim()) {
        errors.push('Anthropic API key is required for Claude models');
      }

      if (needsOpenAI && !apiKeys.openai?.trim()) {
        errors.push('OpenAI API key is required for ChatGPT models');
      }

      return errors;
    },
    [apiKeys]
  );

  const needsAnthropicKey = useCallback(
    (executorModel: ModelType, reviewerModel: ModelType): boolean => {
      return (
        getModelProvider(executorModel) === 'anthropic' ||
        getModelProvider(reviewerModel) === 'anthropic'
      );
    },
    []
  );

  const needsOpenAIKey = useCallback(
    (executorModel: ModelType, reviewerModel: ModelType): boolean => {
      return (
        getModelProvider(executorModel) === 'openai' ||
        getModelProvider(reviewerModel) === 'openai'
      );
    },
    []
  );

  return useMemo(
    () => ({
      apiKeys,
      setAnthropicKey,
      setOpenAIKey,
      validateKeys,
      needsAnthropicKey,
      needsOpenAIKey,
    }),
    [apiKeys, setAnthropicKey, setOpenAIKey, validateKeys, needsAnthropicKey, needsOpenAIKey]
  );
}
