import { describe, expect, it } from 'vitest';
import { chunkText } from './chunker';

describe('chunkText', () => {
  it('does not emit empty chunks for a first paragraph longer than the max chunk size', () => {
    const chunks = chunkText({ content: '长'.repeat(1200) });

    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks.every((chunk) => chunk.text.trim().length > 0)).toBe(true);
  });
});
