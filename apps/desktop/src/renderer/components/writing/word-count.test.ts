import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CUSTOM_WORD_COUNT,
  getWordCountSelectValue,
  inferTargetWordsFromText,
  resolveWordCountSelection,
  sanitizeTargetWords,
} from './word-count';

describe('word count selection', () => {
  it('keeps preset word counts selected by their numeric value', () => {
    expect(getWordCountSelectValue(800)).toBe('800');
    expect(getWordCountSelectValue(2000)).toBe('2000');
    expect(getWordCountSelectValue(5000)).toBe('5000');
  });

  it('shows custom for positive non-preset word counts', () => {
    expect(getWordCountSelectValue(1600)).toBe('custom');
  });

  it('never returns the sentinel -1 as a writing target', () => {
    expect(resolveWordCountSelection('custom', -1)).toBe(DEFAULT_CUSTOM_WORD_COUNT);
    expect(resolveWordCountSelection('-1', 2000)).toBe(DEFAULT_CUSTOM_WORD_COUNT);
  });

  it('bounds custom word counts to a practical positive range', () => {
    expect(sanitizeTargetWords(30)).toBe(100);
    expect(sanitizeTargetWords(1200)).toBe(1200);
    expect(sanitizeTargetWords(100000)).toBe(50000);
  });

  it('infers explicit word limits from the writing request text', () => {
    expect(inferTargetWordsFromText('请写一份 200 字以内的通知', 2000)).toBe(200);
    expect(inferTargetWordsFromText('控制在300字左右，语气正式', 2000)).toBe(300);
    expect(inferTargetWordsFromText('2026 年季度总结', 2000)).toBe(2000);
  });
});
