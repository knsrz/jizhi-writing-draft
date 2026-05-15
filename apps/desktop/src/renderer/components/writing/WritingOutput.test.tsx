import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { WritingOutput } from './WritingOutput';

describe('WritingOutput', () => {
  it('renders final draft Markdown as semantic HTML instead of raw Markdown text', () => {
    const html = renderToStaticMarkup(
      <WritingOutput
        sections={[]}
        currentSectionIndex={-1}
        progress={100}
        fullText={'## 关键成果\n\n这是一段 **重点**。\n\n- 第一项\n- 第二项'}
      />,
    );

    expect(html).toContain('<h2');
    expect(html).toContain('<strong');
    expect(html).toContain('<ul');
    expect(html).not.toContain('## 关键成果');
    expect(html).not.toContain('**重点**');
  });
});
