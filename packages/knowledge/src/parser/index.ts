import type { Document } from '@app/core';

export async function parseDocument(doc: Document): Promise<string> {
  switch (doc.fileType) {
    case 'pdf': {
      const { parsePdf } = await import('./pdf.js');
      return parsePdf(doc.filePath);
    }
    case 'docx': {
      const { parseDocx } = await import('./docx.js');
      return parseDocx(doc.filePath);
    }
    case 'md': {
      const { parseMarkdown } = await import('./txt.js');
      return parseMarkdown(doc.filePath);
    }
    case 'txt': {
      const { parseTxt } = await import('./txt.js');
      return parseTxt(doc.filePath);
    }
    default:
      throw new Error(`Unsupported file type: ${doc.fileType}`);
  }
}
