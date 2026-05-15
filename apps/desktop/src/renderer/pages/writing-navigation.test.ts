import { describe, expect, it } from 'vitest';
import { shouldLoadHistoryProject, shouldResetWritingNav } from './writing-navigation';

describe('writing navigation helpers', () => {
  it('does not reload the same history route after a local reset clears projectId', () => {
    expect(shouldLoadHistoryProject('project-1', null)).toBe(true);
    expect(shouldLoadHistoryProject('project-1', 'project-1')).toBe(false);
    expect(shouldLoadHistoryProject('project-2', 'project-1')).toBe(true);
  });

  it('starts fresh when the writing nav is used from a completed history detail', () => {
    expect(shouldResetWritingNav('done', '/history/project-1')).toBe(true);
    expect(shouldResetWritingNav('writing', '/settings')).toBe(false);
  });
});
