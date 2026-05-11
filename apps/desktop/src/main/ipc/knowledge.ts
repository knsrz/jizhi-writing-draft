import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { createOpenAICompatible, getEmbeddingModel } from '@app/ai';
import { embedTexts } from '@app/ai/embedding';
import { IpcChannel } from '@app/core';
import { chunkText, parseDocument, VectorStore } from '@app/knowledge';
import { eq } from 'drizzle-orm';
import { app, BrowserWindow, ipcMain } from 'electron';
import { getDb } from '../db/index.js';
import { documentChunks, documents, knowledgeBases } from '../db/schema.js';
import { selectAndCopyDocs } from '../services/file-service.js';
import { keychain } from '../services/keychain.js';

const vectorStores = new Map<string, VectorStore>();

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
    const store = await getVectorStore();
    await store.createTable(id);
    return db.select().from(knowledgeBases).where(eq(knowledgeBases.id, id)).get();
  });

  ipcMain.handle(IpcChannel.KB_DELETE, async (_, id: string) => {
    const db = getDb();
    const store = await getVectorStore();
    await store.deleteTable(id);
    await db.delete(documents).where(eq(documents.knowledgeBaseId, id));
    await db.delete(knowledgeBases).where(eq(knowledgeBases.id, id));
  });

  ipcMain.handle(IpcChannel.KB_DOC_LIST, async (_, kbId: string) => {
    const db = getDb();
    return db.select().from(documents).where(eq(documents.knowledgeBaseId, kbId)).all();
  });

  ipcMain.handle(IpcChannel.KB_DOC_DELETE, async (_, docId: string) => {
    const db = getDb();
    await db.delete(documentChunks).where(eq(documentChunks.documentId, docId));
    await db.delete(documents).where(eq(documents.id, docId));
  });

  ipcMain.handle(IpcChannel.KB_UPLOAD, async (event, kbId: string) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) throw new Error('No window');

    const fileInfo = await selectAndCopyDocs(kbId);
    if (!fileInfo) return null;

    const db = getDb();
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

    win.webContents.send(IpcChannel.KB_UPLOAD_PROGRESS, {
      documentId: docId,
      fileName: fileInfo.fileName,
      stage: 'chunking',
      progress: 30,
      totalChunks: 0,
      completedChunks: 0,
    });

    const chunks = chunkText({ content: text, metadata: { heading: fileInfo.fileName } });

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
          vector: embeddings[j],
          content: chunk.text,
          metadata: JSON.stringify(chunk.metadata),
        });
      }

      win.webContents.send(IpcChannel.KB_UPLOAD_PROGRESS, {
        documentId: docId,
        fileName: fileInfo.fileName,
        stage: 'embedding',
        progress: 50 + Math.round(((i + batch.length) / chunks.length) * 50),
        totalChunks: chunks.length,
        completedChunks: i + batch.length,
      });
    }

    await store.insert(kbId, vectors);

    await db
      .update(documents)
      .set({
        status: 'ready',
        chunkCount: chunks.length,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(documents.id, docId));

    await db
      .update(knowledgeBases)
      .set({
        documentCount: chunks.length,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(knowledgeBases.id, kbId));

    return db.select().from(documents).where(eq(documents.id, docId)).get();
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
