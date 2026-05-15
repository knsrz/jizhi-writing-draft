import { Packer } from 'docx';
import mammoth from 'mammoth';
import { describe, expect, it } from 'vitest';
import { createMarkdownDocx, markdownToDocxBlocks } from './markdown-docx.js';

describe('markdownToDocxBlocks', () => {
  it('maps Markdown structure to Word layout intents', () => {
    const blocks = markdownToDocxBlocks(`## 关键成果

这是一段 **重点**。

1. 第一项
2. 第二项

> 重要提示
`);

    expect(blocks).toMatchObject([
      { type: 'heading', level: 2, text: '关键成果' },
      {
        type: 'paragraph',
        runs: [{ text: '这是一段 ' }, { text: '重点', bold: true }, { text: '。' }],
      },
      { type: 'orderedListItem', runs: [{ text: '第一项' }] },
      { type: 'orderedListItem', runs: [{ text: '第二项' }] },
      { type: 'quote', runs: [{ text: '重要提示' }] },
    ]);
  });

  it('creates a valid Word document from Markdown content', async () => {
    const doc = createMarkdownDocx('## 关键成果\n\n这是一段 **重点**。\n\n- 第一项');

    const buffer = await Packer.toBuffer(doc);
    const extracted = await mammoth.extractRawText({ buffer });

    expect(buffer.subarray(0, 2).toString()).toBe('PK');
    expect(extracted.value).toContain('关键成果');
    expect(extracted.value).toContain('这是一段 重点');
    expect(extracted.value).toContain('第一项');
  });
});
