import { embedMany } from 'ai';
import type { EmbeddingModel } from 'ai';

export async function embedTexts(
  model: EmbeddingModel,
  texts: string[],
  _batchSize = 20,
): Promise<number[][]> {
  const result = await embedMany({
    model,
    values: texts,
  });
  return result.embeddings as number[][];
}
