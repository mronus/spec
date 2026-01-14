import type { IRType } from '../types/spec.types';
import { BaseAgent } from './base-agent';

export class ScrumAgent extends BaseAgent {
  getOutputIRTypes(): IRType[] {
    return ['tasks'];
  }
}
