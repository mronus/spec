import type { IRType } from '../../types/spec.types';
import type { FeedbackEntry, AgentContext } from '../../types/agent.types';

export function buildReviewerPrompt(
  artifactType: IRType,
  artifactContent: string,
  context: AgentContext,
  feedbackHistory: FeedbackEntry[]
): string {
  const parts: string[] = [];

  parts.push(`## Artifact to Review`);
  parts.push(`Type: ${artifactType}.spec`);
  parts.push(`Module: ${context.moduleName}`);
  parts.push('');
  parts.push(`### Content:`);
  parts.push('```spec');
  parts.push(artifactContent);
  parts.push('```');
  parts.push('');

  // Context from user requirements
  parts.push(`## Original Requirements`);
  parts.push(context.userPrompt);
  parts.push('');

  // Previous artifacts for consistency check
  if (context.previousArtifacts.size > 0) {
    parts.push(`## Previous Artifacts (check for consistency)`);
    for (const [irType, artifact] of context.previousArtifacts) {
      if (irType !== artifactType) {
        parts.push(`### ${irType}.spec`);
        parts.push('```spec');
        // Truncate if too long
        const content = artifact.content.length > 2000
          ? artifact.content.substring(0, 2000) + '\n... [truncated]'
          : artifact.content;
        parts.push(content);
        parts.push('```');
        parts.push('');
      }
    }
  }

  // Previous feedback in this cycle
  if (feedbackHistory.length > 0) {
    parts.push(`## Previous Feedback Given (check if addressed)`);
    for (const entry of feedbackHistory) {
      if (entry.artifactType === artifactType) {
        parts.push(`### Cycle ${entry.cycle}:`);
        parts.push(entry.reviewerFeedback);
        parts.push('');
      }
    }
  }

  // Review instructions
  parts.push(`## Review Instructions`);
  parts.push(`Evaluate this ${artifactType}.spec artifact for:`);
  parts.push(`1. **Format Correctness**: Does it follow the Spec IR format?`);
  parts.push(`2. **Completeness**: Are all required sections present?`);
  parts.push(`3. **Consistency**: Does it align with previous artifacts and requirements?`);
  parts.push(`4. **Quality**: Is it well-structured with clear descriptions?`);
  parts.push('');

  if (feedbackHistory.length > 0) {
    parts.push(`5. **Feedback Addressed**: Were previous feedback items addressed?`);
    parts.push('');
  }

  parts.push(`## Response Format`);
  parts.push(`If acceptable, respond with exactly: APPROVED`);
  parts.push('');
  parts.push(`If changes needed, respond with: NEEDS_REVISION`);
  parts.push(`Then provide specific, actionable feedback.`);

  return parts.join('\n');
}

export function parseReviewResult(response: string): {
  approved: boolean;
  feedback: string;
} {
  const trimmed = response.trim();

  // Check for APPROVED
  if (trimmed.startsWith('APPROVED')) {
    return {
      approved: true,
      feedback: '',
    };
  }

  // Check for NEEDS_REVISION
  if (trimmed.startsWith('NEEDS_REVISION')) {
    // Extract the feedback after NEEDS_REVISION
    const feedback = trimmed.replace('NEEDS_REVISION', '').trim();
    return {
      approved: false,
      feedback: feedback || 'Reviewer requested changes but did not provide specific feedback.',
    };
  }

  // If neither pattern matched, assume it needs revision and use the whole response as feedback
  return {
    approved: false,
    feedback: trimmed || 'Unable to parse reviewer response.',
  };
}
