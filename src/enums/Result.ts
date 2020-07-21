import {EnumLiteralsOf} from './EnumLiteralsOf';

export type Result = EnumLiteralsOf<typeof Result>;

export const Result = Object.freeze({
  Passed: 'PASSED' as 'Passed',
  Failed: 'FAILED' as 'Failed',
  Skipped: 'SKIPPED' as 'Skipped',
});
