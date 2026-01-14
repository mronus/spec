import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import type { OrchestrationConfig } from '../types/orchestration.types';
import type { ModelType } from '../types/llm.types';
import { AVAILABLE_MODELS } from '../types/llm.types';
import { useApiKeys } from '../hooks/useApiKeys';

interface ConfigFormProps {
  onStart: (config: OrchestrationConfig) => void;
  initialPrompt?: string;
  initialExecutorModel?: ModelType;
  initialReviewerModel?: ModelType;
  initialMaxFeedbackCycles?: number;
}

export function ConfigForm({
  onStart,
  initialPrompt = '',
  initialExecutorModel = 'claude-sonnet-4-5',
  initialReviewerModel = 'claude-sonnet-4-5',
  initialMaxFeedbackCycles = 3,
}: ConfigFormProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [executorModel, setExecutorModel] = useState<ModelType>(initialExecutorModel);
  const [reviewerModel, setReviewerModel] = useState<ModelType>(initialReviewerModel);
  const [maxFeedbackCycles, setMaxFeedbackCycles] = useState(initialMaxFeedbackCycles);
  const [errors, setErrors] = useState<string[]>([]);

  const {
    apiKeys,
    setAnthropicKey,
    setOpenAIKey,
    validateKeys,
    needsAnthropicKey,
    needsOpenAIKey,
  } = useApiKeys();

  const showAnthropicKey = needsAnthropicKey(executorModel, reviewerModel);
  const showOpenAIKey = needsOpenAIKey(executorModel, reviewerModel);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors: string[] = [];

    if (!prompt.trim()) {
      validationErrors.push('Please enter your requirements');
    }

    const keyErrors = validateKeys(executorModel, reviewerModel);
    validationErrors.push(...keyErrors);

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    onStart({
      prompt: prompt.trim(),
      executorModel,
      reviewerModel,
      apiKeys,
      maxFeedbackCycles,
    });
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Generate Spec IR</CardTitle>
        <CardDescription>
          Enter your system requirements and select the AI models for execution and review.
          Each artifact will go through a configurable number of feedback cycles.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Requirements Prompt */}
          <div className="space-y-2">
            <Label htmlFor="prompt">System Requirements</Label>
            <Textarea
              id="prompt"
              placeholder="Describe your system requirements... e.g., 'Build a user authentication system with email/password login, session management, and password reset functionality.'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[150px]"
            />
          </div>

          {/* Model Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="executor-model">Executor Model</Label>
              <Select
                value={executorModel}
                onValueChange={(value) => setExecutorModel(value as ModelType)}
              >
                <SelectTrigger id="executor-model">
                  <SelectValue placeholder="Select executor model" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_MODELS.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Generates the spec artifacts
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reviewer-model">Reviewer Model</Label>
              <Select
                value={reviewerModel}
                onValueChange={(value) => setReviewerModel(value as ModelType)}
              >
                <SelectTrigger id="reviewer-model">
                  <SelectValue placeholder="Select reviewer model" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_MODELS.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Reviews and provides feedback
              </p>
            </div>
          </div>

          {/* Feedback Cycles */}
          <div className="space-y-2">
            <Label htmlFor="feedback-cycles">Max Feedback Cycles</Label>
            <Select
              value={String(maxFeedbackCycles)}
              onValueChange={(value) => setMaxFeedbackCycles(Number(value))}
            >
              <SelectTrigger id="feedback-cycles" className="w-[180px]">
                <SelectValue placeholder="Select cycles" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} {n === 1 ? 'cycle' : 'cycles'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Maximum number of executor/reviewer feedback iterations per artifact
            </p>
          </div>

          {/* API Keys */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">API Keys</h3>
            <p className="text-xs text-muted-foreground">
              Your API keys are stored only in browser memory and are never persisted.
            </p>

            {showAnthropicKey && (
              <div className="space-y-2">
                <Label htmlFor="anthropic-key">Anthropic API Key</Label>
                <Input
                  id="anthropic-key"
                  type="password"
                  placeholder="sk-ant-..."
                  value={apiKeys.anthropic || ''}
                  onChange={(e) => setAnthropicKey(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Required for Claude models. Get one at{' '}
                  <a
                    href="https://console.anthropic.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    console.anthropic.com
                  </a>
                </p>
              </div>
            )}

            {showOpenAIKey && (
              <div className="space-y-2">
                <Label htmlFor="openai-key">OpenAI API Key</Label>
                <Input
                  id="openai-key"
                  type="password"
                  placeholder="sk-..."
                  value={apiKeys.openai || ''}
                  onChange={(e) => setOpenAIKey(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Required for ChatGPT models. Get one at{' '}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    platform.openai.com
                  </a>
                </p>
              </div>
            )}
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Submit */}
          <Button type="submit" className="w-full" size="lg">
            Start Generation
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
