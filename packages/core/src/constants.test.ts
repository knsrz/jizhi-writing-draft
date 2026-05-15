import { describe, expect, it } from 'vitest';
import { WRITING_STATUS_LABELS } from './constants';

describe('WRITING_STATUS_LABELS', () => {
  it('localizes persisted writing statuses for the renderer', () => {
    expect(WRITING_STATUS_LABELS.done).toBe('已完成');
    expect(WRITING_STATUS_LABELS.error).toBe('出错');
  });
});
