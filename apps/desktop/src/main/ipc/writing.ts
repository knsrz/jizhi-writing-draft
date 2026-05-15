import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import type { PipelineCallbacks } from '@app/agent';
import { generatePlan, reviseDocument, runPipeline } from '@app/agent';
import { createOpenAICompatible, getEmbeddingModel, getWritingModel, tokenCounter } from '@app/ai';
import type {
  WritingPlan,
  WritingProject,
  WritingRequest,
  WritingRevisionRequest,
  WritingRevisionResult,
} from '@app/core';
import { IpcChannel } from '@app/core';
import { Retriever, VectorStore } from '@app/knowledge';
import { desc, eq } from 'drizzle-orm';
import type { IpcMainInvokeEvent } from 'electron';
import { app, BrowserWindow, ipcMain } from 'electron';
import { getDb } from '../db/index.js';
import { writingProjects, writingVersions } from '../db/schema.js';
import { keychain } from '../services/keychain.js';
import { hasUsableApiConfig } from './writing-config.js';

let currentWritingAbort: AbortController | null = null;

export function registerWritingIpc(): void {
  ipcMain.handle(IpcChannel.WRITING_CREATE_PLAN, async (event, request: WritingRequest) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) throw new Error('No window');
    currentWritingAbort?.abort();
    const abortController = new AbortController();
    currentWritingAbort = abortController;

    try {
      const writingModel = await createWritingModel(request);
      win.webContents.send(IpcChannel.WRITING_PROGRESS, { percent: 5, status: 'planning' });
      const plan = await generatePlan(
        writingModel,
        request,
        undefined,
        request.knowledgeBaseId ?? undefined,
        { signal: abortController.signal },
      );
      win.webContents.send(IpcChannel.WRITING_PROGRESS, { percent: 10, status: 'reviewing' });
      return plan;
    } catch (e) {
      if (!abortController.signal.aborted) {
        const msg = e instanceof Error ? e.message : String(e);
        win.webContents.send(IpcChannel.WRITING_ERROR, msg);
      }
      throw e;
    } finally {
      if (currentWritingAbort === abortController) currentWritingAbort = null;
    }
  });

  ipcMain.handle(IpcChannel.WRITING_START, executeWritingRequest);
  ipcMain.handle(IpcChannel.WRITING_EXECUTE, async (event, request: WritingRequest) => {
    if (!request.plan) throw new Error('请先确认写作规划');
    return executeWritingRequest(event, request);
  });

  ipcMain.handle(IpcChannel.WRITING_CANCEL, async () => {
    currentWritingAbort?.abort();
    currentWritingAbort = null;
    return { cancelled: true };
  });

  ipcMain.handle(IpcChannel.PROJECT_LIST, async () => {
    const db = getDb();
    return db
      .select()
      .from(writingProjects)
      .orderBy(desc(writingProjects.createdAt))
      .all()
      .map(hydrateProject);
  });

  ipcMain.handle(IpcChannel.PROJECT_GET, async (_, projectId: string) => {
    const db = getDb();
    const project = await db
      .select()
      .from(writingProjects)
      .where(eq(writingProjects.id, projectId))
      .get();
    return project ? hydrateProject(project) : null;
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

  ipcMain.handle(IpcChannel.VERSION_LATEST, async (_, projectId: string) => {
    const db = getDb();
    return db
      .select()
      .from(writingVersions)
      .where(eq(writingVersions.projectId, projectId))
      .orderBy(desc(writingVersions.versionNumber))
      .limit(1)
      .get();
  });

  ipcMain.handle(IpcChannel.VERSION_GET, async (_, versionId: string) => {
    const db = getDb();
    return db.select().from(writingVersions).where(eq(writingVersions.id, versionId)).get();
  });

  ipcMain.handle(IpcChannel.WRITING_REVISE, reviseWritingRequest);
}

async function executeWritingRequest(
  event: IpcMainInvokeEvent,
  request: WritingRequest,
): Promise<void> {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) throw new Error('No window');
  currentWritingAbort?.abort();
  const abortController = new AbortController();
  currentWritingAbort = abortController;

  const writingModel = await createWritingModel(request);
  const retriever = await createRetriever(request);

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
    plan: request.plan ? JSON.stringify(request.plan) : null,
    createdAt: now,
    updatedAt: now,
  });

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
}

async function reviseWritingRequest(
  _event: IpcMainInvokeEvent,
  request: WritingRevisionRequest,
): Promise<WritingRevisionResult> {
  const instruction = request.instruction.trim();
  if (!instruction) throw new Error('请输入修改要求');

  currentWritingAbort?.abort();
  const abortController = new AbortController();
  currentWritingAbort = abortController;

  try {
    const db = getDb();
    const projectRow = await db
      .select()
      .from(writingProjects)
      .where(eq(writingProjects.id, request.projectId))
      .get();
    if (!projectRow) throw new Error('未找到写作项目');

    const latestVersion = await db
      .select()
      .from(writingVersions)
      .where(eq(writingVersions.projectId, request.projectId))
      .orderBy(desc(writingVersions.versionNumber))
      .limit(1)
      .get();
    if (!latestVersion) throw new Error('未找到可修改的写作版本');

    const project = hydrateProject(projectRow);
    const writingModel = await createWritingModel({
      type: project.writingType,
      topic: project.title,
      targetWords: project.targetWords,
      style: project.style,
      knowledgeBaseId: project.knowledgeBaseId ?? undefined,
      modelConfigId: request.modelConfigId,
      plan: project.plan ?? undefined,
    });
    const content = await reviseDocument(writingModel, latestVersion.content, instruction, {
      signal: abortController.signal,
    });
    const wordCount = tokenCounter.countWords(content);
    const versionId = randomUUID();
    const versionNumber = latestVersion.versionNumber + 1;
    const now = new Date().toISOString();

    await db.insert(writingVersions).values({
      id: versionId,
      projectId: request.projectId,
      versionNumber,
      content,
      wordCount,
      changeSummary: instruction,
      createdAt: now,
    });

    await db
      .update(writingProjects)
      .set({
        status: 'done',
        updatedAt: now,
      })
      .where(eq(writingProjects.id, request.projectId));

    return {
      projectId: request.projectId,
      content,
      wordCount,
      versionId,
      versionNumber,
    };
  } finally {
    if (currentWritingAbort === abortController) currentWritingAbort = null;
  }
}

async function createWritingModel(request: WritingRequest) {
  const writingConfig = await keychain.getWritingApiConfig(request.modelConfigId);
  if (!hasUsableApiConfig(writingConfig)) {
    throw new Error('请先配置写作模型 API Key');
  }

  const provider = createOpenAICompatible({
    baseUrl: writingConfig.baseUrl,
    apiKey: writingConfig.apiKey,
  });
  return getWritingModel(provider, writingConfig.model);
}

async function createRetriever(request: WritingRequest): Promise<Retriever | null> {
  if (!request.knowledgeBaseId) return null;

  const embeddingConfig = await keychain.getEmbeddingApiConfig();
  if (!hasUsableApiConfig(embeddingConfig)) {
    throw new Error('请先配置嵌入模型 API Key');
  }

  const embeddingProvider = createOpenAICompatible({
    baseUrl: embeddingConfig.baseUrl,
    apiKey: embeddingConfig.apiKey,
  });
  const embedModel = getEmbeddingModel(embeddingProvider, embeddingConfig.model);
  const storePath = join(app.getPath('userData'), 'writing-app', 'lancedb');
  const store = new VectorStore(storePath);
  await store.connect();
  return new Retriever(store, embedModel);
}

function hydrateProject(project: typeof writingProjects.$inferSelect): WritingProject {
  return {
    id: project.id,
    title: project.title,
    writingType: project.writingType as WritingProject['writingType'],
    targetWords: project.targetWords ?? 2000,
    style: (project.style ?? 'formal') as WritingProject['style'],
    knowledgeBaseId: project.knowledgeBaseId,
    status: (project.status ?? 'draft') as WritingProject['status'],
    plan: parsePlan(project.plan),
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

function parsePlan(value: string | null): WritingPlan | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as WritingPlan;
  } catch {
    return null;
  }
}
