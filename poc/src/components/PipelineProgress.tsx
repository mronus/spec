import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import type { OrchestrationProgress, AgentCategory } from '../types/orchestration.types';
import { PIPELINE_STAGES, AGENT_CATEGORY_LABELS } from '../types/orchestration.types';
import { AGENT_DISPLAY_NAMES } from '../types/spec.types';
import { CheckCircle, Circle, Loader2, AlertCircle } from 'lucide-react';

interface PipelineProgressProps {
  progress: OrchestrationProgress;
}

export function PipelineProgress({ progress }: PipelineProgressProps) {
  const overallProgress = (progress.currentStage / progress.totalStages) * 100;

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {progress.state === 'running' && (
            <Loader2 className="h-5 w-5 animate-spin" />
          )}
          {progress.state === 'error' && (
            <AlertCircle className="h-5 w-5 text-destructive" />
          )}
          Generation Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span>{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} />
        </div>

        {/* Pipeline Stages */}
        <div className="space-y-4">
          {(['spec', 'execution'] as AgentCategory[]).map((category) => {
            const categoryStages = PIPELINE_STAGES.filter((s) => s.category === category);

            return (
              <div key={category} className="space-y-2">
                {/* Category Header */}
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {AGENT_CATEGORY_LABELS[category]}
                  </h3>
                  <div className="flex-grow h-px bg-border" />
                </div>

                {/* Stages in this category */}
                <div className="space-y-2">
                  {categoryStages.map((stage) => {
                    const stageNumber = stage.stage;
                    const isComplete = stageNumber < progress.currentStage;
                    const isCurrent = stageNumber === progress.currentStage;
                    const isPending = stageNumber > progress.currentStage;

                    return (
                      <div
                        key={stage.agent}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                          isCurrent
                            ? 'bg-primary/10 border border-primary/20'
                            : isComplete
                            ? 'bg-green-50 dark:bg-green-950/20'
                            : 'bg-muted/50'
                        }`}
                      >
                        {/* Status Icon */}
                        <div className="flex-shrink-0">
                          {isComplete && (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          )}
                          {isCurrent && (
                            <Loader2 className="h-5 w-5 text-primary animate-spin" />
                          )}
                          {isPending && (
                            <Circle className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>

                        {/* Stage Info */}
                        <div className="flex-grow min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              Stage {stageNumber}: {AGENT_DISPLAY_NAMES[stage.agent]}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {stage.outputs.map((o) => `${o}.spec`).join(', ')}
                          </div>
                        </div>

                        {/* Feedback Cycle Indicator (only for current stage) */}
                        {isCurrent && progress.currentFeedbackCycle > 0 && (
                          <div className="flex-shrink-0 text-sm text-muted-foreground">
                            Cycle {progress.currentFeedbackCycle}/{progress.maxFeedbackCycles}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Current Status */}
        <div className="p-4 bg-muted rounded-lg">
          <div className="text-sm font-medium mb-1">Current Status</div>
          <div className="text-sm text-muted-foreground">
            {progress.statusMessage}
          </div>
          {progress.currentArtifact && (
            <div className="text-sm text-muted-foreground mt-1">
              Working on: <code className="bg-background px-1 rounded">{progress.currentArtifact}.spec</code>
            </div>
          )}
        </div>

        {/* Error Display */}
        {progress.error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="text-sm font-medium text-destructive mb-1">Error</div>
            <div className="text-sm text-destructive/80">{progress.error}</div>
          </div>
        )}

        {/* Completed Artifacts */}
        {progress.completedArtifacts.length > 0 && (
          <div>
            <div className="text-sm font-medium mb-2">Completed Artifacts</div>
            <div className="flex flex-wrap gap-2">
              {progress.completedArtifacts.map((artifact) => (
                <span
                  key={artifact}
                  className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs rounded"
                >
                  {artifact}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
