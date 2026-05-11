import fs from 'node:fs';

export function parseTxt(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8');
}

export function parseMarkdown(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8');
}
