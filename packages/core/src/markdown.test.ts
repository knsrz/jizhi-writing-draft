import { describe, expect, it } from 'vitest';
import { parseMarkdown } from './markdown.js';

describe('parseMarkdown', () => {
  it('preserves common Markdown structure for preview and export', () => {
    const blocks = parseMarkdown(`# 标题

这是一段 **重点** 和 \`代码\`。

- 第一项
- 第二项

> 引用内容

| 指标 | 结果 |
| --- | --- |
| 成本 | 降低 |
`);

    expect(blocks).toMatchObject([
      {
        type: 'heading',
        level: 1,
        children: [{ type: 'text', value: '标题' }],
      },
      {
        type: 'paragraph',
        children: [
          { type: 'text', value: '这是一段 ' },
          { type: 'strong', children: [{ type: 'text', value: '重点' }] },
          { type: 'text', value: ' 和 ' },
          { type: 'code', value: '代码' },
          { type: 'text', value: '。' },
        ],
      },
      {
        type: 'unorderedList',
        items: [[{ type: 'text', value: '第一项' }], [{ type: 'text', value: '第二项' }]],
      },
      {
        type: 'blockquote',
        children: [{ type: 'text', value: '引用内容' }],
      },
      {
        type: 'table',
        headers: [[{ type: 'text', value: '指标' }], [{ type: 'text', value: '结果' }]],
        rows: [[[{ type: 'text', value: '成本' }], [{ type: 'text', value: '降低' }]]],
      },
    ]);
  });

  it('keeps fenced code blocks intact', () => {
    const blocks = parseMarkdown('```ts\nconst ok = true;\n```');

    expect(blocks).toEqual([{ type: 'codeBlock', language: 'ts', value: 'const ok = true;' }]);
  });
});
