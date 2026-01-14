import type { IRType } from '../types/spec.types';
import { BaseAgent } from './base-agent';

export class DevOpsAgent extends BaseAgent {
  getOutputIRTypes(): IRType[] {
    return ['pipeline'];
  }
}
