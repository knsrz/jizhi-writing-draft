import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import type { PipelineCallbacks } from '@app/agent';
import { runPipeline } from '@app/agent';
import { createOpenAICompatible, getEmbeddingModel, getWritingModel, tokenCounter } from '@app/ai';
import type { WritingPlan, WritingRequest } from '@app/core';
import { IpcChannel } from '@app/core';
import { Retriever, VectorStore } from '@app/knowledge';
import { desc, eq } from 'drizzle-orm';
import { app, BrowserWindow, ipcMain } from 'electron';
import { getDb } from '../db/index.js';
import { writingProjects, writingVersions } from '../db/schema.js';
import { keychain } from '../services/keychain.js';
import { hasUsableApiConfig } from './writing-config.js';

let currentWritingAbort: AbortController | null = null;

export function registerWritingIpc(): void {
  ipcMain.handle(IpcChannel.WRITING_START, async (event, request: WritingRequest) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) throw new Error('No window');
    currentWritingAbort?.abort();
    const abortController = new AbortController();
    currentWritingAbort = abortController;

    const writingConfig = await keychain.getWritingApiConfig();
    if (!hasUsableApiConfig(writingConfig)) {
      win.webContents.send(IpcChannel.WRITING_ERROR, '请先配置写作模型 API Key');
      return;
    }

    const db = getDb();
    const projectId = randomUUID();
    const now = new Date().toISOString();

    await db.insert(writingProjects).values({
      id: projectId,
      title: request.topic,
      writingType: request.type,
      targetWords: request.targetWords,
      style: request.style,
      knowledgeBaseId: request.knowledgeBaseId || null,
      status: 'planning',
      createdAt: now,
      updatedAt: now,
    });

    const provider = createOpenAICompatible({
      baseUrl: writingConfig.baseUrl,
      apiKey: writingConfig.apiKey,
    });
    const writingModel = getWritingModel(provider, writingConfig.model);

    let retriever: Retriever | null = null;
    if (request.knowledgeBaseId) {
      const embeddingConfig = await keychain.getEmbeddingApiConfig();
      if (!hasUsableApiConfig(embeddingConfig)) {
        win.webContents.send(IpcChannel.WRITING_ERROR, '请先配置嵌入模型 API Key');
        return;
      }
      const embeddingProvider = createOpenAICompatible({
        baseUrl: embeddingConfig.baseUrl,
        apiKey: embeddingConfig.apiKey,
      });
      const embedModel = getEmbeddingModel(embeddingProvider, embeddingConfig.model);
      const storePath = join(app.getPath('userData'), 'writing-app', 'lancedb');
      const store = new VectorStore(storePath);
      await store.connect();
      retriever = new Retriever(store, embedModel);
    }

    const callbacks: PipelineCallbacks = {
      onPlanReady: async (plan: WritingPlan) => {
        await db
          .update(writingProjects)
          .set({
            plan: JSON.stringify(plan),
            status: 'writing',
            updatedAt: new Date().toISOString(),
          })
          .where(eq(writingProjects.id, projectId));
        win.webContents.send(IpcChannel.WRITING_PLAN, plan);
      },
      onSectionStart: (_index, title) => {
        win.webContents.send(IpcChannel.WRITING_PROGRESS, {
          sectionIndex: _index,
          title,
          status: 'writing',
        });
      },
      onSectionWriting: (section) => {
        win.webContents.send(IpcChannel.WRITING_SECTION, section);
      },
      onSectionFactCheck: (_index) => {
        win.webContents.send(IpcChannel.WRITING_PROGRESS, {
          sectionIndex: _index,
          status: 'fact-checking',
        });
      },
      onSectionPolish: (_index) => {
        win.webContents.send(IpcChannel.WRITING_PROGRESS, {
          sectionIndex: _index,
          status: 'polishing',
        });
      },
      onProgress: (percent) => {
        win.webContents.send(IpcChannel.WRITING_PROGRESS, { percent });
      },
      onError: (error) => {
        if (abortController.signal.aborted) return;
        win.webContents.send(IpcChannel.WRITING_ERROR, error.message);
      },
    };

    try {
      const fullText = await runPipeline(request, writingModel, retriever, callbacks, {
        signal: abortController.signal,
      });

      const versions = await db
        .select()
        .from(writingVersions)
        .where(eq(writingVersions.projectId, projectId))
        .all();
      const versionNumber = versions.length + 1;
      const wordCount = tokenCounter.countWords(fullText);

      await db.insert(writingVersions).values({
        id: randomUUID(),
        projectId,
        versionNumber,
        content: fullText,
        wordCount,
        changeSummary: '初稿',
        createdAt: new Date().toISOString(),
      });

      await db
        .update(writingProjects)
        .set({
          status: 'done',
          updatedAt: new Date().toISOString(),
        })
        .where(eq(writingProjects.id, projectId));

      win.webContents.send(IpcChannel.WRITING_DONE, { projectId, content: fullText, wordCount });
    } catch (e) {
      if (abortController.signal.aborted) {
        await db
          .update(writingProjects)
          .set({
            status: 'draft',
            updatedAt: new Date().toISOString(),
          })
          .where(eq(writingProjects.id, projectId));
        return;
      }
      const msg = e instanceof Error ? e.message : String(e);
      win.webContents.send(IpcChannel.WRITING_ERROR, msg);
      await db
        .update(writingProjects)
        .set({
          status: 'error',
          updatedAt: new Date().toISOString(),
        })
        .where(eq(writingProjects.id, projectId));
    } finally {
      if (currentWritingAbort === abortController) currentWritingAbort = null;
    }
  });

  ipcMain.handle(IpcChannel.WRITING_CANCEL, async () => {
    currentWritingAbort?.abort();
    currentWritingAbort = null;
    return { cancelled: true };
  });

  ipcMain.handle('project:list', async () => {
    const db = getDb();
    return db.select().from(writingProjects).orderBy(desc(writingProjects.createdAt)).all();
  });

  ipcMain.handle(IpcChannel.VERSION_LIST, async (_, projectId: string) => {
    const db = getDb();
    return db
      .select()
      .from(writingVersions)
      .where(eq(writingVersions.projectId, projectId))
      .orderBy(desc(writingVersions.versionNumber))
      .all();
  });

  ipcMain.handle(IpcChannel.VERSION_GET, async (_, versionId: string) => {
    const db = getDb();
    return db.select().from(writingVersions).where(eq(writingVersions.id, versionId)).get();
  });
}
