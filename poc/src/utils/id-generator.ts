export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function generateSessionId(): string {
  return `session-${generateId()}`;
}
