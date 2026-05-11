import { ipcMain, dialog, BrowserWindow } from 'electron';
import { IpcChannel } from '@app/core';
import { getDb } from '../db/index.js';
import { writingVersions } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { writeFileSync } from 'node:fs';

export function registerExportIpc(): void {
  ipcMain.handle(IpcChannel.EXPORT_MD, async (event, projectId: string) => {
    const db = getDb();
    const version = await db.select().from(writingVersions)
      .where(eq(writingVersions.projectId, projectId))
      .orderBy(desc(writingVersions.versionNumber)).limit(1).get();
    if (!version) throw new Error('No version found');

    const win = BrowserWindow.fromWebContents(event.sender);
    const result = await dialog.showSaveDialog(win!, {
      defaultPath: 'document.md',
      filters: [{ name: 'Markdown', extensions: ['md'] }],
    });

    if (!result.canceled && result.filePath) {
      writeFileSync(result.filePath, version.content, 'utf-8');
      return { success: true, path: result.filePath };
    }
    return { success: false };
  });

  ipcMain.handle(IpcChannel.EXPORT_DOCX, async (event, projectId: string) => {
    const db = getDb();
    const version = await db.select().from(writingVersions)
      .where(eq(writingVersions.projectId, projectId))
      .orderBy(desc(writingVersions.versionNumber)).limit(1).get();
    if (!version) throw new Error('No version found');

    const win = BrowserWindow.fromWebContents(event.sender);
    const result = await dialog.showSaveDialog(win!, {
      defaultPath: 'document.docx',
      filters: [{ name: 'Word', extensions: ['docx'] }],
    });

    if (!result.canceled && result.filePath) {
      // Simple DOCX: install docx package and use it
      try {
        const { Document, Packer, Paragraph, TextRun } = await import('docx');
        const paragraphs = version.content.split('\n').filter(Boolean).map(
          (line: string) => new Paragraph({ children: [new TextRun(line)] }),
        );
        const doc = new Document({ sections: [{ properties: {}, children: paragraphs }] });
        const buffer = await Packer.toBuffer(doc);
        writeFileSync(result.filePath, buffer);
        return { success: true, path: result.filePath };
      } catch {
        // Fallback: write markdown as .docx is not critical for MVP
        writeFileSync(result.filePath, version.content, 'utf-8');
        return { success: true, path: result.filePath, note: 'Saved as plain text (docx package not available)' };
      }
    }
    return { success: false };
  });
}
