const AVG_CHARS_PER_TOKEN = 3.5;

export const tokenCounter = {
  count(text: string): number {
    return Math.ceil(text.length / AVG_CHARS_PER_TOKEN);
  },

  countWords(text: string): number {
    const cleaned = text.replace(/[#*>`\-\s]+/g, ' ').trim();
    if (!cleaned) return 0;
    return cleaned.split(/\s+/).length;
  },

  estimateTokensFromWords(words: number): number {
    return Math.ceil(words * 1.3);
  },
};
