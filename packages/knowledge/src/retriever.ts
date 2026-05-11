import type { EmbeddingModel } from 'ai';
import { embedTexts } from '@app/ai/embedding';
import { VectorStore } from './vector-store.js';

export class Retriever {
  constructor(
    private vectorStore: VectorStore,
    private embedModel: EmbeddingModel,
  ) {}

  async search(
    kbId: string,
    query: string,
    topK = 5,
  ): Promise<{ content: string; metadata: string; score: number }[]> {
    const [queryVec] = await embedTexts(this.embedModel, [query]);
    if (!queryVec || queryVec.length === 0) return [];

    const results = await this.vectorStore.search(kbId, queryVec, topK * 2);

    const scored = results.map((r) => ({
      content: r.content,
      metadata: r.metadata,
      score: this.cosineSimilarity(queryVec, r.vector),
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return normA === 0 || normB === 0 ? 0 : dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
