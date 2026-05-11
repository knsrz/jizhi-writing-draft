import { describe, expect, it, vi } from 'vitest';
import { attachWritingListeners } from './writing-listeners';

describe('attachWritingListeners', () => {
  it('returns one cleanup function that removes every IPC listener', () => {
    const cleanups = [vi.fn(), vi.fn(), vi.fn(), vi.fn(), vi.fn()];
    const api = {
      onWritingPlan: vi.fn(() => cleanups[0]),
      onWritingSection: vi.fn(() => cleanups[1]),
      onWritingProgress: vi.fn(() => cleanups[2]),
      onWritingDone: vi.fn(() => cleanups[3]),
      onWritingError: vi.fn(() => cleanups[4]),
    };

    const cleanup = attachWritingListeners(api, {
      onPlan: vi.fn(),
      onSection: vi.fn(),
      onProgress: vi.fn(),
      onDone: vi.fn(),
      onError: vi.fn(),
    });

    cleanup();

    expect(cleanups.every((fn) => fn.mock.calls.length === 1)).toBe(true);
  });
});
