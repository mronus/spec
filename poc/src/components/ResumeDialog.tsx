import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Play } from 'lucide-react';
import type { ModelType, APIKeys } from '../types/llm.types';
import { getModelProvider } from '../types/llm.types';

interface ResumeDialogProps {
  open: boolean;
  onClose: () => void;
  onResume: (apiKeys: APIKeys) => void;
  executorModel: ModelType;
  reviewerModel: ModelType;
}

export function ResumeDialog({
  open,
  onClose,
  onResume,
  executorModel,
  reviewerModel,
}: ResumeDialogProps) {
  const [anthropicKey, setAnthropicKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [error, setError] = useState<string | null>(null);

  const needsAnthropicKey =
    getModelProvider(executorModel) === 'anthropic' ||
    getModelProvider(reviewerModel) === 'anthropic';

  const needsOpenAIKey =
    getModelProvider(executorModel) === 'openai' ||
    getModelProvider(reviewerModel) === 'openai';

  const handleResume = () => {
    const errors: string[] = [];

    if (needsAnthropicKey && !anthropicKey.trim()) {
      errors.push('Anthropic API key is required for Claude models');
    }

    if (needsOpenAIKey && !openaiKey.trim()) {
      errors.push('OpenAI API key is required for ChatGPT models');
    }

    if (errors.length > 0) {
      setError(errors.join('. '));
      return;
    }

    setError(null);
    onResume({
      anthropic: anthropicKey.trim() || undefined,
      openai: openaiKey.trim() || undefined,
    });
  };

  const handleClose = () => {
    setAnthropicKey('');
    setOpenaiKey('');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Resume Generation
          </DialogTitle>
          <DialogDescription>
            Enter your API keys to resume the previous session. Keys are stored only in memory and never saved.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {needsAnthropicKey && (
            <div className="space-y-2">
              <Label htmlFor="resume-anthropic-key">Anthropic API Key</Label>
              <Input
                id="resume-anthropic-key"
                type="password"
                placeholder="sk-ant-..."
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Required for {executorModel === 'claude-sonnet-4-5' || executorModel === 'claude-opus-4-5' ? 'executor' : ''}
                {(executorModel === 'claude-sonnet-4-5' || executorModel === 'claude-opus-4-5') &&
                 (reviewerModel === 'claude-sonnet-4-5' || reviewerModel === 'claude-opus-4-5') ? ' and ' : ''}
                {reviewerModel === 'claude-sonnet-4-5' || reviewerModel === 'claude-opus-4-5' ? 'reviewer' : ''} model
              </p>
            </div>
          )}

          {needsOpenAIKey && (
            <div className="space-y-2">
              <Label htmlFor="resume-openai-key">OpenAI API Key</Label>
              <Input
                id="resume-openai-key"
                type="password"
                placeholder="sk-..."
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Required for ChatGPT model
              </p>
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleResume}>
            <Play className="mr-2 h-4 w-4" />
            Resume
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
