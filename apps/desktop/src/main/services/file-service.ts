import { app, dialog } from 'electron';
import { join } from 'node:path';
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

export async function selectAndCopyDocs(kbId: string): Promise<{
  fileName: string;
  filePath: string;
  fileType: string;
  fileHash: string;
} | null> {
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: '文档', extensions: ['pdf', 'docx', 'txt', 'md'] },
    ],
  });

  if (result.canceled || result.filePaths.length === 0) return null;

  const sourcePath = result.filePaths[0];
  const fileName = sourcePath.split(/[/\\]/).pop() || 'untitled';
  const ext = fileName.split('.').pop()?.toLowerCase() || 'txt';
  const fileType = ['pdf', 'docx', 'txt', 'md'].includes(ext) ? ext : 'txt';

  const buffer = readFileSync(sourcePath);
  const hash = createHash('sha256').update(buffer).digest('hex');

  const userDataPath = app.getPath('userData');
  const destDir = join(userDataPath, 'writing-app', 'documents', kbId);
  mkdirSync(destDir, { recursive: true });
  const destPath = join(destDir, `${hash}.${ext}`);
  if (!existsSync(destPath)) {
    copyFileSync(sourcePath, destPath);
  }

  return { fileName, filePath: destPath, fileType, fileHash: hash };
}
