import type { MarkdownBlock, MarkdownInline } from '@app/core';
import { markdownInlineToText, parseMarkdown } from '@app/core';
import type { ParagraphChild } from 'docx';
import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  HeadingLevel,
  LevelFormat,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';

export type DocxRunIntent = {
  text: string;
  bold?: boolean;
  italics?: boolean;
  code?: boolean;
  link?: string;
};

export type DocxBlockIntent =
  | { type: 'heading'; level: number; text: string }
  | { type: 'paragraph'; runs: DocxRunIntent[] }
  | { type: 'unorderedListItem'; runs: DocxRunIntent[] }
  | { type: 'orderedListItem'; runs: DocxRunIntent[] }
  | { type: 'quote'; runs: DocxRunIntent[] }
  | { type: 'codeBlock'; language?: string; text: string }
  | { type: 'table'; headers: DocxRunIntent[][]; rows: DocxRunIntent[][][] }
  | { type: 'thematicBreak' };

const headingLevelByDepth = [
  HeadingLevel.HEADING_1,
  HeadingLevel.HEADING_1,
  HeadingLevel.HEADING_2,
  HeadingLevel.HEADING_3,
  HeadingLevel.HEADING_4,
  HeadingLevel.HEADING_5,
  HeadingLevel.HEADING_6,
] as const;

const defaultRun = {
  font: { ascii: 'Calibri', hAnsi: 'Calibri', eastAsia: 'Microsoft YaHei' },
  size: 22,
};

export function markdownToDocxBlocks(markdown: string): DocxBlockIntent[] {
  return parseMarkdown(markdown).flatMap(markdownBlockToDocxBlocks);
}

export function createMarkdownDocx(markdown: string): Document {
  const children = markdownToDocxBlocks(markdown).map(renderDocxBlock);

  return new Document({
    styles: {
      default: {
        document: {
          run: defaultRun,
          paragraph: {
            spacing: { line: 360, after: 160 },
          },
        },
      },
      paragraphStyles: [
        {
          id: 'Normal',
          name: 'Normal',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: defaultRun,
          paragraph: {
            spacing: { line: 360, after: 160 },
          },
        },
      ],
    },
    numbering: {
      config: [
        {
          reference: 'markdown-bullet',
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: '•',
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: { indent: { left: 720, hanging: 360 } },
                run: defaultRun,
              },
            },
          ],
        },
        {
          reference: 'markdown-numbering',
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: '%1.',
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: { indent: { left: 720, hanging: 360 } },
                run: defaultRun,
              },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });
}

function markdownBlockToDocxBlocks(block: MarkdownBlock): DocxBlockIntent[] {
  switch (block.type) {
    case 'heading':
      return [
        {
          type: 'heading',
          level: block.level,
          text: markdownInlineToText(block.children),
        },
      ];
    case 'paragraph':
      return [{ type: 'paragraph', runs: inlinesToDocxRuns(block.children) }];
    case 'unorderedList':
      return block.items.map((item) => ({
        type: 'unorderedListItem',
        runs: inlinesToDocxRuns(item),
      }));
    case 'orderedList':
      return block.items.map((item) => ({
        type: 'orderedListItem',
        runs: inlinesToDocxRuns(item),
      }));
    case 'blockquote':
      return [{ type: 'quote', runs: inlinesToDocxRuns(block.children) }];
    case 'codeBlock':
      return [{ type: 'codeBlock', language: block.language, text: block.value }];
    case 'table':
      return [
        {
          type: 'table',
          headers: block.headers.map((header) => inlinesToDocxRuns(header)),
          rows: block.rows.map((row) => row.map((cell) => inlinesToDocxRuns(cell))),
        },
      ];
    case 'thematicBreak':
      return [{ type: 'thematicBreak' }];
  }
}

function renderDocxBlock(block: DocxBlockIntent): Paragraph | Table {
  switch (block.type) {
    case 'heading':
      return new Paragraph({
        heading: headingLevelByDepth[Math.min(block.level, 6)],
        children: [
          new TextRun({
            text: block.text,
            bold: true,
            size: block.level === 1 ? 32 : block.level === 2 ? 28 : 24,
            font: defaultRun.font,
          }),
        ],
        spacing: { before: block.level === 1 ? 320 : 240, after: 160 },
        keepNext: true,
      });
    case 'paragraph':
      return new Paragraph({
        children: runsToParagraphChildren(block.runs),
        spacing: { line: 360, after: 160 },
        alignment: AlignmentType.JUSTIFIED,
      });
    case 'unorderedListItem':
      return new Paragraph({
        children: runsToParagraphChildren(block.runs),
        numbering: { reference: 'markdown-bullet', level: 0 },
        spacing: { line: 320, after: 80 },
      });
    case 'orderedListItem':
      return new Paragraph({
        children: runsToParagraphChildren(block.runs),
        numbering: { reference: 'markdown-numbering', level: 0 },
        spacing: { line: 320, after: 80 },
      });
    case 'quote':
      return new Paragraph({
        children: runsToParagraphChildren(block.runs),
        border: {
          left: { style: BorderStyle.SINGLE, color: '94A3B8', size: 12, space: 8 },
        },
        indent: { left: 360 },
        shading: { fill: 'F8FAFC' },
        spacing: { line: 320, before: 120, after: 160 },
      });
    case 'codeBlock':
      return new Paragraph({
        children: codeBlockToRuns(block.text),
        shading: { fill: 'F1F5F9' },
        spacing: { line: 280, before: 120, after: 160 },
      });
    case 'table':
      return renderTable(block);
    case 'thematicBreak':
      return new Paragraph({
        text: '',
        border: {
          bottom: { style: BorderStyle.SINGLE, color: 'CBD5E1', size: 8, space: 4 },
        },
        spacing: { before: 160, after: 160 },
      });
  }
}

function renderTable(block: Extract<DocxBlockIntent, { type: 'table' }>): Table {
  const rows = [
    new TableRow({
      children: block.headers.map((cell) => tableCell(cell, true)),
    }),
    ...block.rows.map(
      (row) =>
        new TableRow({
          children: row.map((cell) => tableCell(cell, false)),
        }),
    ),
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows,
  });
}

function tableCell(runs: DocxRunIntent[], isHeader: boolean): TableCell {
  return new TableCell({
    shading: isHeader ? { fill: 'EEF2FF' } : undefined,
    margins: { top: 120, bottom: 120, left: 160, right: 160 },
    children: [
      new Paragraph({
        children: runsToParagraphChildren(
          isHeader ? runs.map((run) => ({ ...run, bold: true })) : runs,
        ),
        spacing: { after: 0 },
      }),
    ],
  });
}

function inlinesToDocxRuns(
  inlines: MarkdownInline[],
  inherited: Omit<DocxRunIntent, 'text'> = {},
): DocxRunIntent[] {
  return inlines.flatMap((inline) => {
    switch (inline.type) {
      case 'text':
        return [{ ...inherited, text: inline.value }];
      case 'code':
        return [{ ...inherited, text: inline.value, code: true }];
      case 'strong':
        return inlinesToDocxRuns(inline.children, { ...inherited, bold: true });
      case 'emphasis':
        return inlinesToDocxRuns(inline.children, { ...inherited, italics: true });
      case 'link':
        return inlinesToDocxRuns(inline.children, { ...inherited, link: inline.href });
    }
    return [];
  });
}

function runsToParagraphChildren(runs: DocxRunIntent[]): ParagraphChild[] {
  if (runs.length === 0) return [new TextRun('')];

  return runs.map((run) => {
    const textRun = new TextRun({
      text: run.text,
      bold: run.bold,
      italics: run.italics,
      color: run.link ? '2563EB' : undefined,
      underline: run.link ? {} : undefined,
      font: run.code ? 'Consolas' : defaultRun.font,
      size: run.code ? 20 : defaultRun.size,
      shading: run.code ? { fill: 'E2E8F0' } : undefined,
    });

    if (!run.link) return textRun;

    return new ExternalHyperlink({
      link: run.link,
      children: [textRun],
    });
  });
}

function codeBlockToRuns(text: string): ParagraphChild[] {
  const lines = text.split('\n');
  if (lines.length === 0) return [new TextRun('')];

  return lines.map(
    (line, index) =>
      new TextRun({
        text: line || ' ',
        break: index === 0 ? undefined : 1,
        font: 'Consolas',
        size: 20,
      }),
  );
}
