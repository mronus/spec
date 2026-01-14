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
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';

interface QuestionDialogProps {
  open: boolean;
  question: string;
  onAnswer: (answer: string) => void;
}

export function QuestionDialog({ open, question, onAnswer }: QuestionDialogProps) {
  const [answer, setAnswer] = useState('');

  const handleSubmit = () => {
    if (answer.trim()) {
      onAnswer(answer.trim());
      setAnswer('');
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Clarification Needed</DialogTitle>
          <DialogDescription>
            The agent needs additional information to proceed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-sm font-medium mb-2">Question:</div>
            <div className="text-sm">{question}</div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="answer">Your Answer</Label>
            <Textarea
              id="answer"
              placeholder="Enter your response..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!answer.trim()}>
            Submit Answer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
