import { writeFileSync } from 'node:fs';
import { IpcChannel } from '@app/core';
import { Packer } from 'docx';
import { desc, eq } from 'drizzle-orm';
import { BrowserWindow, dialog, ipcMain } from 'electron';
import { getDb } from '../db/index.js';
import { writingVersions } from '../db/schema.js';
import { createMarkdownDocx } from '../services/markdown-docx.js';

export function registerExportIpc(): void {
  ipcMain.handle(IpcChannel.EXPORT_MD, async (event, projectId: string) => {
    const db = getDb();
    const version = await db
      .select()
      .from(writingVersions)
      .where(eq(writingVersions.projectId, projectId))
      .orderBy(desc(writingVersions.versionNumber))
      .limit(1)
      .get();
    if (!version) throw new Error('No version found');

    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) throw new Error('No window');
    const result = await dialog.showSaveDialog(win, {
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
    const version = await db
      .select()
      .from(writingVersions)
      .where(eq(writingVersions.projectId, projectId))
      .orderBy(desc(writingVersions.versionNumber))
      .limit(1)
      .get();
    if (!version) throw new Error('No version found');

    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) throw new Error('No window');
    const result = await dialog.showSaveDialog(win, {
      defaultPath: 'document.docx',
      filters: [{ name: 'Word', extensions: ['docx'] }],
    });

    if (!result.canceled && result.filePath) {
      const doc = createMarkdownDocx(version.content);
      const buffer = await Packer.toBuffer(doc);
      writeFileSync(result.filePath, buffer);
      return { success: true, path: result.filePath };
    }
    return { success: false };
  });
}
