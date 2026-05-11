export const WORD_COUNT_PRESETS = [800, 2000, 5000] as const;
export const DEFAULT_CUSTOM_WORD_COUNT = 1200;
export const MIN_TARGET_WORDS = 100;
export const MAX_TARGET_WORDS = 50000;

export function sanitizeTargetWords(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return DEFAULT_CUSTOM_WORD_COUNT;
  return Math.min(MAX_TARGET_WORDS, Math.max(MIN_TARGET_WORDS, Math.round(value)));
}

export function getWordCountSelectValue(targetWords: number): string {
  return WORD_COUNT_PRESETS.includes(targetWords as (typeof WORD_COUNT_PRESETS)[number])
    ? String(targetWords)
    : 'custom';
}

export function resolveWordCountSelection(value: string, currentTargetWords: number): number {
  if (value === 'custom') {
    return currentTargetWords > 0
      ? sanitizeTargetWords(currentTargetWords)
      : DEFAULT_CUSTOM_WORD_COUNT;
  }

  return sanitizeTargetWords(Number(value));
}
