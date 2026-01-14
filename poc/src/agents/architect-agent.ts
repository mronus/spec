import type { IRType } from '../types/spec.types';
import { BaseAgent } from './base-agent';

export class ArchitectAgent extends BaseAgent {
  getOutputIRTypes(): IRType[] {
    return ['module', 'infrastructure', 'data', 'decisions'];
  }
}
