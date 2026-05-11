import { describe, expect, it, vi } from 'vitest';
import { VectorStore } from './vector-store';

describe('VectorStore', () => {
  it('lazily opens an existing table after reconnecting', async () => {
    const table = {
      add: vi.fn(),
      search: vi.fn(() => ({
        limit: vi.fn(() => ({
          toArray: vi.fn(async () => []),
        })),
      })),
    };
    const db = {
      createTable: vi.fn(),
      openTable: vi.fn(async () => table),
      dropTable: vi.fn(),
    };

    const store = new VectorStore('/tmp/vector-store-test', db);

    await store.insert('existing-kb', [
      {
        id: 'row-1',
        chunk_id: 'chunk-1',
        vector: [0.1, 0.2],
        content: 'hello',
        metadata: '{}',
      },
    ]);

    expect(db.openTable).toHaveBeenCalledWith('kb_existing-kb');
    expect(table.add).toHaveBeenCalledOnce();
  });
});
