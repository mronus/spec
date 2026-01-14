import { useState } from 'react';
import { ConfigForm } from './components/ConfigForm';
import { PipelineProgress } from './components/PipelineProgress';
import { OutputPanel } from './components/OutputPanel';
import { QuestionDialog } from './components/QuestionDialog';
import { ErrorDialog } from './components/ErrorDialog';
import { ClearConfirmDialog } from './components/ClearConfirmDialog';
import { ResumeDialog } from './components/ResumeDialog';
import { useOrchestration } from './hooks/useOrchestration';
import type { OrchestrationConfig } from './types/orchestration.types';
import type { SpecArtifact } from './types/spec.types';
import type { ResumeState } from './orchestration/orchestrator';
import type { APIKeys } from './types/llm.types';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { RefreshCw, Play } from 'lucide-react';

function App() {
  const [artifacts, setArtifacts] = useState<SpecArtifact[]>([]);
  const [showResumeDialog, setShowResumeDialog] = useState(false);

  const {
    state,
    progress,
    currentQuestion,
    zipBlob,
    errorMessage,
    persistedState,
    hasResumableState,
    startOrchestration,
    answerQuestion,
    downloadResults,
    reset,
    clearPersistedState,
    dismissError,
  } = useOrchestration({
    onArtifactsComplete: setArtifacts,
  });

  const handleStart = (config: OrchestrationConfig) => {
    setArtifacts([]);
    startOrchestration(config);
  };

  const handleResumeClick = () => {
    setShowResumeDialog(true);
  };

  const handleResumeWithKeys = (apiKeys: APIKeys) => {
    if (!persistedState) return;

    setShowResumeDialog(false);

    // Build resume state from persisted data
    const resumeState: ResumeState = {
      artifacts: persistedState.artifacts,
      startFromStage: persistedState.progress.currentStage,
      moduleName: persistedState.moduleName,
    };

    // Build config with provided API keys
    const config: OrchestrationConfig = {
      ...persistedState.config,
      apiKeys,
      maxFeedbackCycles: persistedState.config.maxFeedbackCycles ?? 3,
    };

    setArtifacts(persistedState.artifacts);
    startOrchestration(config, resumeState);
  };

  const handleAnswerQuestion = (answer: string) => {
    answerQuestion(answer);
  };

  const handleReset = () => {
    setArtifacts([]);
    reset();
  };

  const handleClearStorage = () => {
    clearPersistedState();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src="favicon.svg" alt="Spec Logo" className="w-12 h-12" />
              <div>
                <h1 className="text-3xl font-bold">Spec - LLM-Native Programming Language</h1>
                <p className="text-muted-foreground mt-1">
                  Generate IR specifications from requirements
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasResumableState && state === 'idle' && (
                <ClearConfirmDialog
                  onConfirm={handleClearStorage}
                  disabled={state !== 'idle'}
                />
              )}
              {state !== 'idle' && (
                <Button variant="outline" onClick={handleReset}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Start Over
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-grow">
        {state === 'idle' && hasResumableState && persistedState && (
          <div className="max-w-3xl mx-auto mb-6">
            <Card className="border-primary/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Resume Previous Session
                </CardTitle>
                <CardDescription>
                  You have a previous session that was interrupted. You can resume from where you left off.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Stage:</span>{' '}
                      <span className="font-medium">
                        {persistedState.progress.currentStage + 1} of 6
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Artifacts:</span>{' '}
                      <span className="font-medium">
                        {persistedState.artifacts.length} completed
                      </span>
                    </div>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Prompt:</span>{' '}
                    <span className="italic line-clamp-2">
                      {persistedState.config.prompt}
                    </span>
                  </div>
                  {persistedState.progress.error && (
                    <div className="text-sm text-destructive">
                      <span className="font-medium">Last error:</span>{' '}
                      {persistedState.progress.error}
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleResumeClick}>
                      <Play className="mr-2 h-4 w-4" />
                      Resume Generation
                    </Button>
                    <Button variant="outline" onClick={handleClearStorage}>
                      Start Fresh
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {state === 'idle' && (
          <ConfigForm
            onStart={handleStart}
            initialPrompt={persistedState?.config.prompt}
            initialExecutorModel={persistedState?.config.executorModel}
            initialReviewerModel={persistedState?.config.reviewerModel}
            initialMaxFeedbackCycles={persistedState?.config.maxFeedbackCycles}
          />
        )}

        {(state === 'running' || state === 'paused') && (
          <PipelineProgress progress={progress} />
        )}

        {state === 'complete' && (
          <OutputPanel
            artifacts={artifacts}
            onDownload={downloadResults}
            canDownload={!!zipBlob}
          />
        )}

        {state === 'error' && (
          <div className="max-w-3xl mx-auto">
            <div className="text-center py-12 bg-destructive/10 rounded-lg border border-destructive/20">
              <h2 className="text-2xl font-semibold text-destructive mb-4">
                An error occurred
              </h2>
              <p className="text-muted-foreground mb-6 px-4">
                {progress.error || 'Unknown error occurred during generation.'}
              </p>
              <div className="flex gap-2 justify-center">
                {hasResumableState && (
                  <Button onClick={handleResumeClick}>
                    <Play className="mr-2 h-4 w-4" />
                    Resume
                  </Button>
                )}
                <Button onClick={handleReset} variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Start Over
                </Button>
              </div>
            </div>
          </div>
        )}

        <QuestionDialog
          open={!!currentQuestion}
          question={currentQuestion || ''}
          onAnswer={handleAnswerQuestion}
        />

        <ErrorDialog
          open={!!errorMessage && state === 'error'}
          error={errorMessage || ''}
          onClose={dismissError}
          onRetry={hasResumableState ? handleResumeClick : undefined}
          canResume={hasResumableState}
        />

        {persistedState && (
          <ResumeDialog
            open={showResumeDialog}
            onClose={() => setShowResumeDialog(false)}
            onResume={handleResumeWithKeys}
            executorModel={persistedState.config.executorModel}
            reviewerModel={persistedState.config.reviewerModel}
          />
        )}
      </main>

      <footer className="border-t">
        <div className="container mx-auto px-4 py-4">
          <p className="text-center text-sm text-muted-foreground">
            Spec - LLM-Native Programming Language | POC for autonomous agent-driven software specification
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
