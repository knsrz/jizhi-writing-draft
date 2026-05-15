import {
  type MarkdownBlock,
  type MarkdownInline,
  markdownInlineToText,
  parseMarkdown,
  type SectionOutput,
} from '@app/core';
import { Bot, CheckCircle2, CircleDashed, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export function WritingOutput({
  sections,
  currentSectionIndex,
  progress,
  fullText,
}: {
  sections: SectionOutput[];
  currentSectionIndex: number;
  progress: number;
  fullText: string;
}) {
  if (fullText) {
    return (
      <article className="rounded-2xl border border-slate-200/80 bg-white shadow-lg shadow-slate-200/60">
        <header className="flex items-center gap-3 border-b border-slate-100 px-5 py-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">最终成稿</h2>
            <p className="text-xs text-slate-400">Markdown</p>
          </div>
        </header>
        <div className="px-5 py-4">
          <MarkdownPreview content={fullText} />
        </div>
      </article>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-blue-200 bg-white/80 shadow-sm shadow-slate-200/60">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <Sparkles className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm text-slate-500">等待生成内容</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {sections.map((section) => {
        const isActive = section.sectionIndex === currentSectionIndex && !fullText;
        const isComplete = Boolean(fullText) || section.sectionIndex < currentSectionIndex;

        return (
          <article
            key={section.sectionIndex}
            className={cn(
              'rounded-lg border bg-white shadow-sm',
              isActive ? 'border-blue-200 ring-2 ring-blue-50' : 'border-slate-200',
            )}
          >
            <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                    isComplete ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700',
                  )}
                >
                  {isComplete ? <CheckCircle2 className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold text-slate-900">
                    {section.title}
                  </h2>
                  <p className="text-xs text-slate-400">Section {section.sectionIndex + 1}</p>
                </div>
              </div>
              {isActive && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs text-blue-700">
                  <CircleDashed className="h-3.5 w-3.5 animate-spin" />
                  写作中
                </span>
              )}
            </header>
            <div className="px-5 py-4">
              <div className="whitespace-pre-wrap text-[15px] leading-8 text-slate-700">
                {section.content}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function MarkdownPreview({ content }: { content: string }) {
  const blocks = parseMarkdown(content);

  return (
    <div className="space-y-4 text-[15px] leading-8 text-slate-700">
      {withStableKeys(blocks, markdownBlockKey).map(({ key, value }) =>
        renderMarkdownBlock(value, key),
      )}
    </div>
  );
}

function renderMarkdownBlock(block: MarkdownBlock, key: string): ReactNode {
  switch (block.type) {
    case 'heading': {
      const HeadingTag = `h${block.level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
      const headingClassName = cn(
        'font-semibold text-slate-950',
        block.level === 1 && 'mt-1 text-2xl leading-9',
        block.level === 2 && 'mt-1 text-xl leading-8',
        block.level === 3 && 'text-lg leading-7',
        block.level >= 4 && 'text-base leading-7',
      );

      return (
        <HeadingTag key={key} className={headingClassName}>
          {renderMarkdownInline(block.children, key)}
        </HeadingTag>
      );
    }
    case 'paragraph':
      return (
        <p key={key} className="text-slate-700">
          {renderMarkdownInline(block.children, key)}
        </p>
      );
    case 'unorderedList':
      return (
        <ul key={key} className="list-disc space-y-1 pl-6">
          {withStableKeys(block.items, (item) => `${key}-item-${markdownInlineToText(item)}`).map(
            ({ key: itemKey, value: item }) => (
              <li key={itemKey}>{renderMarkdownInline(item, itemKey)}</li>
            ),
          )}
        </ul>
      );
    case 'orderedList':
      return (
        <ol key={key} className="list-decimal space-y-1 pl-6">
          {withStableKeys(block.items, (item) => `${key}-item-${markdownInlineToText(item)}`).map(
            ({ key: itemKey, value: item }) => (
              <li key={itemKey}>{renderMarkdownInline(item, itemKey)}</li>
            ),
          )}
        </ol>
      );
    case 'blockquote':
      return (
        <blockquote
          key={key}
          className="border-l-4 border-slate-300 bg-slate-50 px-4 py-2 text-slate-600"
        >
          <p className="whitespace-pre-wrap">{renderMarkdownInline(block.children, key)}</p>
        </blockquote>
      );
    case 'codeBlock':
      return (
        <pre
          key={key}
          className="overflow-x-auto rounded-md bg-slate-950 px-4 py-3 font-mono text-sm leading-6 text-slate-100"
        >
          <code>{block.value}</code>
        </pre>
      );
    case 'table':
      return (
        <div key={key} className="overflow-x-auto rounded-md border border-slate-200">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-slate-900">
              <tr>
                {withStableKeys(
                  block.headers,
                  (header) => `${key}-header-${markdownInlineToText(header)}`,
                ).map(({ key: headerKey, value: header }) => (
                  <th key={headerKey} className="border-b border-slate-200 px-3 py-2 font-semibold">
                    {renderMarkdownInline(header, headerKey)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {withStableKeys(
                block.rows,
                (row) => `${key}-row-${row.map(markdownInlineToText).join('|')}`,
              ).map(({ key: rowKey, value: row }) => (
                <tr key={rowKey} className="border-t border-slate-100">
                  {withStableKeys(
                    row,
                    (cell) => `${rowKey}-cell-${markdownInlineToText(cell)}`,
                  ).map(({ key: cellKey, value: cell }) => (
                    <td key={cellKey} className="px-3 py-2">
                      {renderMarkdownInline(cell, cellKey)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'thematicBreak':
      return <hr key={key} className="border-slate-200" />;
  }
}

function renderMarkdownInline(inlines: MarkdownInline[], keyPrefix: string): ReactNode[] {
  return inlines.map((inline, index) => {
    const key = `${keyPrefix}-inline-${index}`;

    switch (inline.type) {
      case 'text':
        return inline.value;
      case 'strong':
        return (
          <strong key={key} className="font-semibold text-slate-900">
            {renderMarkdownInline(inline.children, key)}
          </strong>
        );
      case 'emphasis':
        return (
          <em key={key} className="text-slate-800">
            {renderMarkdownInline(inline.children, key)}
          </em>
        );
      case 'code':
        return (
          <code
            key={key}
            className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[0.9em] text-slate-900"
          >
            {inline.value}
          </code>
        );
      case 'link':
        return (
          <a
            key={key}
            href={inline.href}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-blue-700 underline decoration-blue-300 underline-offset-4"
          >
            {renderMarkdownInline(inline.children, key)}
          </a>
        );
    }
    return null;
  });
}

function markdownBlockKey(block: MarkdownBlock): string {
  switch (block.type) {
    case 'heading':
    case 'paragraph':
    case 'blockquote':
      return `${block.type}-${markdownInlineToText(block.children)}`;
    case 'unorderedList':
    case 'orderedList':
      return `${block.type}-${block.items.map(markdownInlineToText).join('|')}`;
    case 'codeBlock':
      return `${block.type}-${block.language ?? 'plain'}-${block.value}`;
    case 'table':
      return `${block.type}-${block.headers.map(markdownInlineToText).join('|')}`;
    case 'thematicBreak':
      return block.type;
  }
}

function withStableKeys<T>(
  values: T[],
  getBaseKey: (value: T) => string,
): Array<{ key: string; value: T }> {
  const seen = new Map<string, number>();
  return values.map((value) => {
    const baseKey = getBaseKey(value);
    const count = seen.get(baseKey) ?? 0;
    seen.set(baseKey, count + 1);
    return {
      key: count === 0 ? baseKey : `${baseKey}-${count}`,
      value,
    };
  });
}
