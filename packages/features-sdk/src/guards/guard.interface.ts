import type { GuardContext } from '../types';

export interface Guard {
  canActivate(context: GuardContext): boolean | Promise<boolean>;
  onFail?(context: GuardContext): void | Promise<void>;
}
