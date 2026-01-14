import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { AlertCircle } from 'lucide-react';

interface ErrorDialogProps {
  open: boolean;
  error: string;
  onClose: () => void;
  onRetry?: () => void;
  canResume?: boolean;
}

export function ErrorDialog({
  open,
  error,
  onClose,
  onRetry,
  canResume = false,
}: ErrorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            An Error Occurred
          </DialogTitle>
          <DialogDescription className="pt-2">
            The generation process encountered an error and could not continue.
          </DialogDescription>
        </DialogHeader>
        <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4 my-2">
          <p className="text-sm text-foreground break-words">{error}</p>
        </div>
        {canResume && (
          <p className="text-sm text-muted-foreground">
            Your progress has been saved. You can resume from where you left off.
          </p>
        )}
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {onRetry && canResume && (
            <Button onClick={onRetry}>
              Resume Generation
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
