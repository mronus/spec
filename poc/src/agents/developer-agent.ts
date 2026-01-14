import type { IRType } from '../types/spec.types';
import { BaseAgent } from './base-agent';

export class DeveloperAgent extends BaseAgent {
  getOutputIRTypes(): IRType[] {
    return ['types', 'events', 'interface', 'function'];
  }
}
