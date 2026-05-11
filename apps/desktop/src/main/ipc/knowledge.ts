import { randomUUID } from 'node:crypto';
import { rm, stat, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { createOpenAICompatible, getEmbeddingModel } from '@app/ai';
import { embedTexts } from '@app/ai/embedding';
import { type Document, IpcChannel } from '@app/core';
import { chunkText, parseDocument, VectorStore } from '@app/knowledge';
import { and, eq } from 'drizzle-orm';
import { app, BrowserWindow, ipcMain } from 'electron';
import { getDb } from '../db/index.js';
import { documentChunks, documents, knowledgeBases } from '../db/schema.js';
import { selectAndCopyDocs } from '../services/file-service.js';
import { keychain } from '../services/keychain.js';

const vectorStores = new Map<string, VectorStore>();

type FileInfo = NonNullable<Awaited<ReturnType<typeof selectAndCopyDocs>>>[number];

async function getVectorStore(): Promise<VectorStore> {
  const storePath = join(app.getPath('userData'), 'writing-app', 'lancedb');
  if (!vectorStores.has(storePath)) {
    const store = new VectorStore(storePath);
    await store.connect();
    vectorStores.set(storePath, store);
  }
  const store = vectorStores.get(storePath);
  if (!store) throw new Error('Vector store failed to initialize');
  return store;
}

export function registerKnowledgeIpc(): void {
  ipcMain.handle(IpcChannel.KB_LIST, async () => {
    const db = getDb();
    return db.select().from(knowledgeBases).all();
  });

  ipcMain.handle(IpcChannel.KB_CREATE, async (_, name: string, description: string) => {
    const db = getDb();
    const id = randomUUID();
    const now = new Date().toISOString();
    await db
      .insert(knowledgeBases)
      .values({ id, name, description, createdAt: now, updatedAt: now });
    return db.select().from(knowledgeBases).where(eq(knowledgeBases.id, id)).get();
  });

  ipcMain.handle(IpcChannel.KB_DELETE, async (_, id: string) => {
    const db = getDb();
    try {
      const store = await getVectorStore();
      await store.deleteTable(id);
    } catch {
      // Metadata deletion should still succeed if vector cleanup is already done or locked.
    }
    await db.delete(documentChunks).where(eq(documentChunks.knowledgeBaseId, id));
    await db.delete(documents).where(eq(documents.knowledgeBaseId, id));
    await db.delete(knowledgeBases).where(eq(knowledgeBases.id, id));
    await rm(join(app.getPath('userData'), 'writing-app', 'documents', id), {
      recursive: true,
      force: true,
    });
  });

  ipcMain.handle(IpcChannel.KB_DOC_LIST, async (_, kbId: string) => {
    const db = getDb();
    return db.select().from(documents).where(eq(documents.knowledgeBaseId, kbId)).all();
  });

  ipcMain.handle(IpcChannel.KB_DOC_DELETE, async (_, docId: string) => {
    const db = getDb();
    const doc = await db.select().from(documents).where(eq(documents.id, docId)).get();
    if (!doc) return;

    try {
      const store = await getVectorStore();
      await store.deleteDocument(doc.knowledgeBaseId, docId);
    } catch {
      // Keep document deletion usable even if vector rows are already absent or locked.
    }
    await db.delete(documentChunks).where(eq(documentChunks.documentId, docId));
    await db.delete(documents).where(eq(documents.id, docId));
    await deleteCopiedFileIfUnused(doc.filePath);
    await updateKnowledgeBaseStats(doc.knowledgeBaseId);
  });

  ipcMain.handle(IpcChannel.KB_UPLOAD, async (event, kbId: string) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) throw new Error('No window');

    const db = getDb();
    const kb = await db.select().from(knowledgeBases).where(eq(knowledgeBases.id, kbId)).get();
    if (!kb) throw new Error('Knowledge base not found');

    const fileInfos = await selectAndCopyDocs(kbId);
    if (!fileInfos) return null;

    const uploaded: Document[] = [];
    for (const fileInfo of fileInfos) {
      uploaded.push(await processUploadedDocument(win, kbId, fileInfo));
    }
    await updateKnowledgeBaseStats(kbId);
    return uploaded.length === 1 ? uploaded[0] : uploaded;
  });

  ipcMain.handle(IpcChannel.KB_SEARCH, async (_, kbId: string, query: string) => {
    const apiConfig = await keychain.getEmbeddingApiConfig();
    if (!apiConfig?.apiKey) throw new Error('Embedding API Key not configured');
    const provider = createOpenAICompatible({
      baseUrl: apiConfig.baseUrl,
      apiKey: apiConfig.apiKey,
    });
    const embedModel = getEmbeddingModel(provider, apiConfig.model);
    const store = await getVectorStore();
    const { Retriever } = await import('@app/knowledge');
    const retriever = new Retriever(store, embedModel);
    return retriever.search(kbId, query, 5);
  });
}

async function processUploadedDocument(
  win: BrowserWindow,
  kbId: string,
  fileInfo: FileInfo,
): Promise<Document> {
  const db = getDb();
  const existing = await db
    .select()
    .from(documents)
    .where(and(eq(documents.knowledgeBaseId, kbId), eq(documents.fileHash, fileInfo.fileHash)))
    .get();
  if (existing) return existing as Document;

  const docId = randomUUID();
  const now = new Date().toISOString();

  await db.insert(documents).values({
    id: docId,
    knowledgeBaseId: kbId,
    fileName: fileInfo.fileName,
    fileType: fileInfo.fileType,
    filePath: fileInfo.filePath,
    fileHash: fileInfo.fileHash,
    status: 'parsing',
    createdAt: now,
    updatedAt: now,
  });

  try {
    win.webContents.send(IpcChannel.KB_UPLOAD_PROGRESS, {
      documentId: docId,
      fileName: fileInfo.fileName,
      stage: 'parsing',
      progress: 10,
      totalChunks: 0,
      completedChunks: 0,
    });

    const text = await parseDocument({
      id: docId,
      knowledgeBaseId: kbId,
      fileName: fileInfo.fileName,
      fileType: fileInfo.fileType as 'pdf' | 'docx' | 'txt' | 'md',
      filePath: fileInfo.filePath,
      fileHash: fileInfo.fileHash,
      status: 'parsing',
      chunkCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    await db
      .update(documents)
      .set({ status: 'chunking', errorMessage: null, updatedAt: new Date().toISOString() })
      .where(eq(documents.id, docId));

    win.webContents.send(IpcChannel.KB_UPLOAD_PROGRESS, {
      documentId: docId,
      fileName: fileInfo.fileName,
      stage: 'chunking',
      progress: 30,
      totalChunks: 0,
      completedChunks: 0,
    });

    const chunks = chunkText({ content: text, metadata: { heading: fileInfo.fileName } });

    await db
      .update(documents)
      .set({ status: 'embedding', errorMessage: null, updatedAt: new Date().toISOString() })
      .where(eq(documents.id, docId));

    win.webContents.send(IpcChannel.KB_UPLOAD_PROGRESS, {
      documentId: docId,
      fileName: fileInfo.fileName,
      stage: 'embedding',
      progress: 50,
      totalChunks: chunks.length,
      completedChunks: 0,
    });

    const apiConfig = await keychain.getEmbeddingApiConfig();
    if (!apiConfig?.apiKey) throw new Error('Embedding API Key not configured');

    const provider = createOpenAICompatible({
      baseUrl: apiConfig.baseUrl,
      apiKey: apiConfig.apiKey,
    });
    const embedModel = getEmbeddingModel(provider, apiConfig.model);

    const store = await getVectorStore();
    const vectors: {
      id: string;
      chunk_id: string;
      document_id: string;
      vector: number[];
      content: string;
      metadata: string;
    }[] = [];

    for (let i = 0; i < chunks.length; i += 20) {
      const batch = chunks.slice(i, i + 20);
      const texts = batch.map((c) => c.text);
      const embeddings = await embedTexts(embedModel, texts);

      for (let j = 0; j < batch.length; j++) {
        const chunk = batch[j];
        const chunkId = randomUUID();

        await db.insert(documentChunks).values({
          id: chunkId,
          documentId: docId,
          knowledgeBaseId: kbId,
          chunkIndex: i + j,
          content: chunk.text,
          tokenCount: Math.ceil(chunk.text.length / 3.5),
          metadata: JSON.stringify(chunk.metadata),
          lanceRowId: chunkId,
          createdAt: new Date().toISOString(),
        });

        vectors.push({
          id: chunkId,
          chunk_id: chunkId,
          document_id: docId,
          vector: embeddings[j],
          content: chunk.text,
          metadata: JSON.stringify({
            ...chunk.metadata,
            documentId: docId,
            fileName: fileInfo.fileName,
          }),
        });
      }

      win.webContents.send(IpcChannel.KB_UPLOAD_PROGRESS, {
        documentId: docId,
        fileName: fileInfo.fileName,
        stage: 'embedding',
        progress: 50 + Math.round(((i + batch.length) / Math.max(chunks.length, 1)) * 50),
        totalChunks: chunks.length,
        completedChunks: i + batch.length,
      });
    }

    await store.insert(kbId, vectors);

    await db
      .update(documents)
      .set({
        status: 'ready',
        errorMessage: null,
        chunkCount: chunks.length,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(documents.id, docId));

    return (await db.select().from(documents).where(eq(documents.id, docId)).get()) as Document;
  } catch (error) {
    await db
      .update(documents)
      .set({
        status: 'error',
        errorMessage: toUserFacingError(error),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(documents.id, docId));
    return (await db.select().from(documents).where(eq(documents.id, docId)).get()) as Document;
  }
}

function toUserFacingError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/sk-[A-Za-z0-9_-]+/g, '[REDACTED]');
}

async function updateKnowledgeBaseStats(kbId: string): Promise<void> {
  const db = getDb();
  const docs = await db.select().from(documents).where(eq(documents.knowledgeBaseId, kbId)).all();
  let storageSize = 0;
  const countedPaths = new Set<string>();

  for (const doc of docs) {
    if (countedPaths.has(doc.filePath)) continue;
    countedPaths.add(doc.filePath);
    try {
      storageSize += (await stat(doc.filePath)).size;
    } catch {
      // Missing copied files should not block metadata refresh.
    }
  }

  await db
    .update(knowledgeBases)
    .set({
      documentCount: docs.length,
      storageSize,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(knowledgeBases.id, kbId));
}

async function deleteCopiedFileIfUnused(filePath: string): Promise<void> {
  const db = getDb();
  const remaining = await db.select().from(documents).where(eq(documents.filePath, filePath)).get();
  if (remaining) return;

  try {
    await unlink(filePath);
  } catch {
    // The file may already have been removed outside the app.
  }
}
