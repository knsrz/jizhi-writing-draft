export type MarkdownInline =
  | MarkdownText
  | MarkdownStrong
  | MarkdownEmphasis
  | MarkdownCode
  | MarkdownLink;

export interface MarkdownText {
  type: 'text';
  value: string;
}

export interface MarkdownStrong {
  type: 'strong';
  children: MarkdownInline[];
}

export interface MarkdownEmphasis {
  type: 'emphasis';
  children: MarkdownInline[];
}

export interface MarkdownCode {
  type: 'code';
  value: string;
}

export interface MarkdownLink {
  type: 'link';
  href: string;
  children: MarkdownInline[];
}

export type MarkdownBlock =
  | MarkdownHeading
  | MarkdownParagraph
  | MarkdownUnorderedList
  | MarkdownOrderedList
  | MarkdownBlockquote
  | MarkdownCodeBlock
  | MarkdownTable
  | MarkdownThematicBreak;

export interface MarkdownHeading {
  type: 'heading';
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: MarkdownInline[];
}

export interface MarkdownParagraph {
  type: 'paragraph';
  children: MarkdownInline[];
}

export interface MarkdownUnorderedList {
  type: 'unorderedList';
  items: MarkdownInline[][];
}

export interface MarkdownOrderedList {
  type: 'orderedList';
  items: MarkdownInline[][];
}

export interface MarkdownBlockquote {
  type: 'blockquote';
  children: MarkdownInline[];
}

export interface MarkdownCodeBlock {
  type: 'codeBlock';
  language?: string;
  value: string;
}

export interface MarkdownTable {
  type: 'table';
  headers: MarkdownInline[][];
  rows: MarkdownInline[][][];
}

export interface MarkdownThematicBreak {
  type: 'thematicBreak';
}

const fencedCodePattern = /^\s*(`{3,}|~{3,})\s*([A-Za-z0-9_-]+)?\s*$/;
const headingPattern = /^(#{1,6})\s+(.+?)\s*$/;
const unorderedListPattern = /^\s*[-*+]\s+(.+)$/;
const orderedListPattern = /^\s*\d+[.)]\s+(.+)$/;
const blockquotePattern = /^\s*>\s?(.*)$/;
const thematicBreakPattern = /^\s{0,3}([-*_])(?:\s*\1){2,}\s*$/;
const tableSeparatorPattern = /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/;

export function parseMarkdown(markdown: string): MarkdownBlock[] {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const blocks: MarkdownBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    const fence = line.match(fencedCodePattern);
    if (fence) {
      const fenceMarker = fence[1];
      const language = fence[2];
      const codeLines: string[] = [];
      index += 1;

      while (index < lines.length && !isClosingFence(lines[index], fenceMarker)) {
        codeLines.push(lines[index]);
        index += 1;
      }

      if (index < lines.length) index += 1;
      blocks.push({
        type: 'codeBlock',
        language,
        value: codeLines.join('\n'),
      });
      continue;
    }

    if (isTableStart(lines, index)) {
      const headers = splitTableRow(line).map(parseMarkdownInline);
      const rows: MarkdownInline[][][] = [];
      index += 2;

      while (index < lines.length && lines[index].trim() && looksLikeTableRow(lines[index])) {
        rows.push(splitTableRow(lines[index]).map(parseMarkdownInline));
        index += 1;
      }

      blocks.push({ type: 'table', headers, rows });
      continue;
    }

    const heading = line.match(headingPattern);
    if (heading) {
      blocks.push({
        type: 'heading',
        level: heading[1].length as MarkdownHeading['level'],
        children: parseMarkdownInline(stripClosingHeadingHashes(heading[2])),
      });
      index += 1;
      continue;
    }

    if (thematicBreakPattern.test(line)) {
      blocks.push({ type: 'thematicBreak' });
      index += 1;
      continue;
    }

    const quote = line.match(blockquotePattern);
    if (quote) {
      const quoteLines: string[] = [];
      while (index < lines.length) {
        const quoteLine = lines[index].match(blockquotePattern);
        if (!quoteLine) break;
        quoteLines.push(quoteLine[1]);
        index += 1;
      }
      blocks.push({
        type: 'blockquote',
        children: parseMarkdownInline(quoteLines.join('\n').trim()),
      });
      continue;
    }

    if (unorderedListPattern.test(line)) {
      const items: MarkdownInline[][] = [];
      while (index < lines.length) {
        const item = lines[index].match(unorderedListPattern);
        if (!item) break;
        items.push(parseMarkdownInline(item[1].trim()));
        index += 1;
      }
      blocks.push({ type: 'unorderedList', items });
      continue;
    }

    if (orderedListPattern.test(line)) {
      const items: MarkdownInline[][] = [];
      while (index < lines.length) {
        const item = lines[index].match(orderedListPattern);
        if (!item) break;
        items.push(parseMarkdownInline(item[1].trim()));
        index += 1;
      }
      blocks.push({ type: 'orderedList', items });
      continue;
    }

    const paragraphLines = [line.trim()];
    index += 1;
    while (index < lines.length && lines[index].trim() && !isSpecialBlockStart(lines, index)) {
      paragraphLines.push(lines[index].trim());
      index += 1;
    }
    blocks.push({
      type: 'paragraph',
      children: parseMarkdownInline(paragraphLines.join(' ')),
    });
  }

  return blocks;
}

export function parseMarkdownInline(text: string): MarkdownInline[] {
  const nodes: MarkdownInline[] = [];
  let index = 0;

  while (index < text.length) {
    if (text.startsWith('`', index)) {
      const end = text.indexOf('`', index + 1);
      if (end > index + 1) {
        nodes.push({ type: 'code', value: text.slice(index + 1, end) });
        index = end + 1;
        continue;
      }
    }

    if (text.startsWith('**', index) || text.startsWith('__', index)) {
      const delimiter = text.slice(index, index + 2);
      const end = text.indexOf(delimiter, index + 2);
      if (end > index + 2) {
        nodes.push({
          type: 'strong',
          children: parseMarkdownInline(text.slice(index + 2, end)),
        });
        index = end + 2;
        continue;
      }
    }

    if (text[index] === '[') {
      const labelEnd = text.indexOf(']', index + 1);
      const hrefStart = labelEnd + 1;
      if (labelEnd > index && text[hrefStart] === '(') {
        const hrefEnd = text.indexOf(')', hrefStart + 1);
        if (hrefEnd > hrefStart + 1) {
          nodes.push({
            type: 'link',
            href: text.slice(hrefStart + 1, hrefEnd).trim(),
            children: parseMarkdownInline(text.slice(index + 1, labelEnd)),
          });
          index = hrefEnd + 1;
          continue;
        }
      }
    }

    if (text[index] === '*' || text[index] === '_') {
      const delimiter = text[index];
      const end = text.indexOf(delimiter, index + 1);
      if (end > index + 1 && !text.startsWith(delimiter.repeat(2), index)) {
        nodes.push({
          type: 'emphasis',
          children: parseMarkdownInline(text.slice(index + 1, end)),
        });
        index = end + 1;
        continue;
      }
    }

    const next = findNextInlineMarker(text, index + 1);
    pushText(nodes, text.slice(index, next));
    index = next;
  }

  return nodes;
}

export function markdownInlineToText(inlines: MarkdownInline[]): string {
  return inlines
    .map((inline) => {
      switch (inline.type) {
        case 'text':
        case 'code':
          return inline.value;
        case 'strong':
        case 'emphasis':
        case 'link':
          return markdownInlineToText(inline.children);
      }
      return '';
    })
    .join('');
}

function isSpecialBlockStart(lines: string[], index: number): boolean {
  const line = lines[index];
  return (
    fencedCodePattern.test(line) ||
    headingPattern.test(line) ||
    thematicBreakPattern.test(line) ||
    blockquotePattern.test(line) ||
    unorderedListPattern.test(line) ||
    orderedListPattern.test(line) ||
    isTableStart(lines, index)
  );
}

function isClosingFence(line: string, openingFence: string): boolean {
  return line.trim().startsWith(openingFence);
}

function isTableStart(lines: string[], index: number): boolean {
  return (
    index + 1 < lines.length &&
    looksLikeTableRow(lines[index]) &&
    tableSeparatorPattern.test(lines[index + 1])
  );
}

function looksLikeTableRow(line: string): boolean {
  return line.includes('|') && splitTableRow(line).length > 1;
}

function splitTableRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  return trimmed.split('|').map((cell) => cell.trim());
}

function stripClosingHeadingHashes(text: string): string {
  return text.replace(/\s+#+\s*$/, '').trim();
}

function findNextInlineMarker(text: string, start: number): number {
  const markers = ['`', '**', '__', '[', '*', '_'];
  const positions = markers
    .map((marker) => text.indexOf(marker, start))
    .filter((position) => position >= 0);
  return positions.length > 0 ? Math.min(...positions) : text.length;
}

function pushText(nodes: MarkdownInline[], value: string): void {
  if (!value) return;
  const previous = nodes[nodes.length - 1];
  if (previous?.type === 'text') {
    previous.value += value;
    return;
  }
  nodes.push({ type: 'text', value });
}
