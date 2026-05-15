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

export function inferTargetWordsFromText(text: string, fallbackTargetWords: number): number {
  const candidates = [
    ...text.matchAll(/([1-9]\d{1,4})\s*(?:个)?\s*字\s*(?:以内|内|以下|左右|上下)?/gu),
  ];
  if (candidates.length === 0) return sanitizeTargetWords(fallbackTargetWords);

  const value = Number(candidates[0][1]);
  return sanitizeTargetWords(value);
}
