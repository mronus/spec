import type { SpecArtifact } from '../types/spec.types';
import type { OrchestrationConfig, OrchestrationProgress } from '../types/orchestration.types';

const STORAGE_KEYS = {
  CONFIG: 'spec-ir-generator-config',
  PROGRESS: 'spec-ir-generator-progress',
  ARTIFACTS: 'spec-ir-generator-artifacts',
  MODULE_NAME: 'spec-ir-generator-module-name',
} as const;

export interface PersistedState {
  config: Omit<OrchestrationConfig, 'apiKeys'>; // Never persist API keys
  progress: OrchestrationProgress;
  artifacts: SpecArtifact[];
  moduleName: string;
  timestamp: number;
}

export function saveState(
  config: OrchestrationConfig,
  progress: OrchestrationProgress,
  artifacts: SpecArtifact[],
  moduleName: string
): void {
  try {
    // Don't save API keys to localStorage for security
    const configWithoutKeys: Omit<OrchestrationConfig, 'apiKeys'> = {
      prompt: config.prompt,
      executorModel: config.executorModel,
      reviewerModel: config.reviewerModel,
      maxFeedbackCycles: config.maxFeedbackCycles,
    };

    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(configWithoutKeys));
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progress));
    localStorage.setItem(STORAGE_KEYS.ARTIFACTS, JSON.stringify(artifacts));
    localStorage.setItem(STORAGE_KEYS.MODULE_NAME, moduleName);
  } catch (error) {
    console.error('Failed to save state to localStorage:', error);
  }
}

export function loadState(): PersistedState | null {
  try {
    const configStr = localStorage.getItem(STORAGE_KEYS.CONFIG);
    const progressStr = localStorage.getItem(STORAGE_KEYS.PROGRESS);
    const artifactsStr = localStorage.getItem(STORAGE_KEYS.ARTIFACTS);
    const moduleName = localStorage.getItem(STORAGE_KEYS.MODULE_NAME);

    if (!configStr || !progressStr || !artifactsStr || !moduleName) {
      return null;
    }

    const config = JSON.parse(configStr);
    const progress = JSON.parse(progressStr);
    const artifacts = JSON.parse(artifactsStr);

    // Restore Date objects for artifacts
    for (const artifact of artifacts) {
      artifact.createdAt = new Date(artifact.createdAt);
    }

    return {
      config,
      progress,
      artifacts,
      moduleName,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('Failed to load state from localStorage:', error);
    return null;
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.CONFIG);
    localStorage.removeItem(STORAGE_KEYS.PROGRESS);
    localStorage.removeItem(STORAGE_KEYS.ARTIFACTS);
    localStorage.removeItem(STORAGE_KEYS.MODULE_NAME);
  } catch (error) {
    console.error('Failed to clear state from localStorage:', error);
  }
}

export function hasPersistedState(): boolean {
  return (
    localStorage.getItem(STORAGE_KEYS.CONFIG) !== null &&
    localStorage.getItem(STORAGE_KEYS.PROGRESS) !== null
  );
}
