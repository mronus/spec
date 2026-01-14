import type { IRType } from '../../types/spec.types';
import type { FeedbackEntry, AgentContext } from '../../types/agent.types';

export function buildExecutorPrompt(
  _agentType: string, // Reserved for future use
  context: AgentContext,
  artifactType: IRType,
  feedbackHistory: FeedbackEntry[]
): string {
  const parts: string[] = [];

  // Context header
  parts.push(`## Current Task`);
  parts.push(`Generate the ${artifactType}.spec artifact for module: ${context.moduleName}`);
  parts.push('');

  // User requirements
  parts.push(`## User Requirements`);
  parts.push(context.userPrompt);
  parts.push('');

  // Previous artifacts
  if (context.previousArtifacts.size > 0) {
    parts.push(`## Previous Artifacts (for context)`);
    for (const [irType, artifact] of context.previousArtifacts) {
      parts.push(`### ${irType}.spec`);
      parts.push('```spec');
      parts.push(artifact.content);
      parts.push('```');
      parts.push('');
    }
  }

  // Feedback history if this is a revision
  if (feedbackHistory.length > 0) {
    parts.push(`## Previous Feedback (MUST address all issues)`);
    parts.push(`You are on revision cycle ${feedbackHistory.length + 1} of 3.`);
    parts.push('');

    for (const entry of feedbackHistory) {
      parts.push(`### Cycle ${entry.cycle} Feedback:`);
      parts.push(entry.reviewerFeedback);
      parts.push('');
    }

    parts.push(`**IMPORTANT**: Address ALL the feedback above in your revised artifact.`);
    parts.push('');
  }

  // Instructions
  parts.push(`## Instructions`);
  parts.push(`1. Generate a complete, valid ${artifactType}.spec file`);
  parts.push(`2. Follow the exact Spec IR format specified in your system prompt`);
  parts.push(`3. Ensure consistency with previous artifacts`);
  parts.push(`4. Output ONLY the spec content - no explanations or markdown code fences around the entire output`);
  parts.push('');

  parts.push(`Generate the ${artifactType}.spec artifact now:`);

  return parts.join('\n');
}

export function buildMultiArtifactPrompt(
  _agentType: string, // Reserved for future use
  context: AgentContext,
  artifactTypes: IRType[],
  feedbackHistory: FeedbackEntry[]
): string {
  const parts: string[] = [];

  parts.push(`## Current Task`);
  parts.push(`Generate the following artifacts for module: ${context.moduleName}`);
  for (const type of artifactTypes) {
    parts.push(`- ${type}.spec`);
  }
  parts.push('');

  // User requirements
  parts.push(`## User Requirements`);
  parts.push(context.userPrompt);
  parts.push('');

  // Previous artifacts
  if (context.previousArtifacts.size > 0) {
    parts.push(`## Previous Artifacts (for context)`);
    for (const [irType, artifact] of context.previousArtifacts) {
      parts.push(`### ${irType}.spec`);
      parts.push('```spec');
      parts.push(artifact.content);
      parts.push('```');
      parts.push('');
    }
  }

  // Feedback history
  if (feedbackHistory.length > 0) {
    parts.push(`## Previous Feedback (MUST address all issues)`);
    for (const entry of feedbackHistory) {
      parts.push(`### Cycle ${entry.cycle} - ${entry.artifactType}:`);
      parts.push(entry.reviewerFeedback);
      parts.push('');
    }
  }

  // Instructions
  parts.push(`## Instructions`);
  parts.push(`Generate each artifact in sequence, clearly separated.`);
  parts.push(`Use this format for each artifact:`);
  parts.push('');
  parts.push(`=== BEGIN [artifact-type].spec ===`);
  parts.push(`[spec content]`);
  parts.push(`=== END [artifact-type].spec ===`);
  parts.push('');
  parts.push(`Generate all artifacts now:`);

  return parts.join('\n');
}
