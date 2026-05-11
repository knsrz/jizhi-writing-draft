import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createOpenAICompatible, getEmbeddingModel } from '@app/ai';
import { embedTexts } from '@app/ai/embedding';
import type { Document } from '@app/core';
import { describe, expect, it } from 'vitest';
import { chunkText } from './chunker';
import { parseDocument } from './parser';
import { VectorStore } from './vector-store';

const runLive = process.env.OPENROUTER_API_KEY ? describe : describe.skip;

runLive('knowledge import live flow', () => {
  it('imports a txt document with OpenRouter qwen embeddings and stores searchable vectors', async () => {
    const root = await mkdtemp(join(tmpdir(), 'jizhi-knowledge-flow-'));
    const filePath = join(root, 'source.txt');
    await writeFile(
      filePath,
      '这是一个知识库导入端到端测试文档。它用于验证 OpenRouter embedding、文本切片、LanceDB 写入和搜索流程。',
      'utf-8',
    );

    try {
      const doc: Document = {
        id: 'doc-live',
        knowledgeBaseId: 'kb-live',
        fileName: 'source.txt',
        fileType: 'txt',
        filePath,
        fileHash: 'hash-live',
        status: 'parsing',
        chunkCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const text = await parseDocument(doc);
      const chunks = chunkText({ content: text, metadata: { heading: doc.fileName } });

      const provider = createOpenAICompatible({
        baseUrl: 'https://openrouter.ai/api/v1',
        apiKey: process.env.OPENROUTER_API_KEY ?? '',
      });
      const model = getEmbeddingModel(provider, 'qwen/qwen3-embedding-4b');
      const embeddings = await embedTexts(
        model,
        chunks.map((chunk) => chunk.text),
      );

      const store = new VectorStore(join(root, 'lancedb'));
      await store.connect();
      await store.insert(
        doc.knowledgeBaseId,
        chunks.map((chunk, index) => ({
          id: `chunk-${index}`,
          chunk_id: `chunk-${index}`,
          document_id: doc.id,
          vector: embeddings[index],
          content: chunk.text,
          metadata: JSON.stringify(chunk.metadata),
        })),
      );

      const results = await store.search(doc.knowledgeBaseId, embeddings[0], 1);
      expect(results[0]?.content).toContain('知识库导入端到端测试文档');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }, 30_000);
});
