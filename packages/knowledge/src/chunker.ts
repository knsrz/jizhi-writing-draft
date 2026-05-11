import type { ChunkMetadata } from '@app/core';

const MAX_CHUNK_CHARS = 1000;
const OVERLAP_CHARS = 100;

interface ChunkInput {
  content: string;
  metadata?: Partial<ChunkMetadata>;
}

export function chunkText(input: ChunkInput): { text: string; metadata: ChunkMetadata }[] {
  const { content, metadata = {} } = input;
  const paragraphs = content.split(/\n\s*\n/);
  const chunks: { text: string; metadata: ChunkMetadata }[] = [];

  let currentText = '';
  let heading = metadata.heading || '';

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    const headingMatch = trimmed.match(
      /^(#{1,4}\s|Chapter\s|[第][一二三四五六七八九十\d]+[章节篇部分])/,
    );
    if (headingMatch) {
      heading = trimmed.replace(/^#+\s*/, '');
      if (currentText) {
        chunks.push({ text: currentText.trim(), metadata: { ...metadata, heading } });
        currentText = '';
      }
    }

    if (currentText && currentText.length + trimmed.length > MAX_CHUNK_CHARS) {
      chunks.push({ text: currentText.trim(), metadata: { ...metadata, heading } });
      currentText = `${currentText.slice(-OVERLAP_CHARS)}\n\n${trimmed}`;
    } else {
      currentText = currentText ? `${currentText}\n\n${trimmed}` : trimmed;
    }
  }

  if (currentText.trim()) {
    chunks.push({ text: currentText.trim(), metadata: { ...metadata, heading } });
  }

  return chunks;
}
