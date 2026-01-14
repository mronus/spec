import { useState, useCallback, useRef, useEffect } from 'react';
import type { SpecArtifact } from '../types/spec.types';
import type { OrchestrationConfig, OrchestrationProgress, OrchestrationState } from '../types/orchestration.types';
import { createInitialProgress } from '../types/orchestration.types';
import { Orchestrator, type ResumeState } from '../orchestration/orchestrator';
import { downloadZip } from '../utils/zip-generator';
import { loadState, clearState, hasPersistedState, type PersistedState } from '../utils/storage';

interface UseOrchestrationOptions {
  onArtifactsComplete?: (artifacts: SpecArtifact[]) => void;
}

interface UseOrchestrationReturn {
  state: OrchestrationState;
  progress: OrchestrationProgress;
  currentQuestion: string | null;
  zipBlob: Blob | null;
  errorMessage: string | null;
  persistedState: PersistedState | null;
  hasResumableState: boolean;
  startOrchestration: (config: OrchestrationConfig, resumeState?: ResumeState) => void;
  answerQuestion: (answer: string) => void;
  downloadResults: () => void;
  reset: () => void;
  clearPersistedState: () => void;
  dismissError: () => void;
}

export function useOrchestration(
  options: UseOrchestrationOptions = {}
): UseOrchestrationReturn {
  const [state, setState] = useState<OrchestrationState>('idle');
  const [progress, setProgress] = useState<OrchestrationProgress>(createInitialProgress());
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);
  const [moduleName, setModuleName] = useState<string>('generated-module');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [persistedState, setPersistedState] = useState<PersistedState | null>(null);
  const [hasResumableState, setHasResumableState] = useState(false);

  // Refs for question handling
  const questionResolverRef = useRef<((answer: string) => void) | null>(null);

  // Check for persisted state on mount
  useEffect(() => {
    const checkPersistedState = () => {
      if (hasPersistedState()) {
        const saved = loadState();
        if (saved && saved.progress.state === 'error') {
          setPersistedState(saved);
          setHasResumableState(true);
        }
      }
    };
    checkPersistedState();
  }, []);

  const startOrchestration = useCallback(
    (config: OrchestrationConfig, resumeState?: ResumeState) => {
      setState('running');
      setCurrentQuestion(null);
      setZipBlob(null);
      setErrorMessage(null);

      // Use resume state module name if provided, otherwise extract
      let name: string;
      if (resumeState) {
        name = resumeState.moduleName;
        setProgress((prev) => ({
          ...prev,
          currentStage: resumeState.startFromStage,
          completedArtifacts: resumeState.artifacts.map(a => a.fileName),
        }));
      } else {
        setProgress(createInitialProgress());
        const nameMatch = config.prompt.match(
          /(?:build|create|implement)\s+(?:a|an|the)?\s*(.+?)\s+(?:system|service|module|app)/i
        );
        name = nameMatch
          ? nameMatch[1].toLowerCase().replace(/\s+/g, '-').substring(0, 30)
          : 'generated-module';
      }
      setModuleName(name);

      const orchestrator = new Orchestrator(
        config,
        {
          onProgressUpdate: (newProgress) => {
            setProgress(newProgress);
            setState(newProgress.state);
          },
          onArtifactsComplete: (artifacts) => {
            options.onArtifactsComplete?.(artifacts);
            // Clear persisted state on success
            setHasResumableState(false);
            setPersistedState(null);
          },
          onQuestion: (question) => {
            return new Promise<string>((resolve) => {
              setCurrentQuestion(question);
              setState('paused');
              questionResolverRef.current = resolve;
            });
          },
          onZipReady: (blob) => {
            setZipBlob(blob);
          },
          onError: (error) => {
            setErrorMessage(error);
            // Update persisted state check after error
            setTimeout(() => {
              if (hasPersistedState()) {
                const saved = loadState();
                if (saved) {
                  setPersistedState(saved);
                  setHasResumableState(true);
                }
              }
            }, 100);
          },
        },
        resumeState
      );

      orchestrator.run().catch((error) => {
        console.error('Orchestration error:', error);
        setState('error');
        setErrorMessage(error.message);
        setProgress((prev) => ({
          ...prev,
          state: 'error',
          error: error.message,
        }));
      });
    },
    [options]
  );

  const answerQuestion = useCallback((answer: string) => {
    if (questionResolverRef.current) {
      questionResolverRef.current(answer);
      questionResolverRef.current = null;
      setCurrentQuestion(null);
      setState('running');
    }
  }, []);

  const downloadResults = useCallback(() => {
    if (zipBlob) {
      downloadZip(zipBlob, moduleName);
    }
  }, [zipBlob, moduleName]);

  const reset = useCallback(() => {
    setState('idle');
    setProgress(createInitialProgress());
    setCurrentQuestion(null);
    setZipBlob(null);
    setErrorMessage(null);
  }, []);

  const clearPersistedState = useCallback(() => {
    clearState();
    setPersistedState(null);
    setHasResumableState(false);
  }, []);

  const dismissError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  return {
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
  };
}
