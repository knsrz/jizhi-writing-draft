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

  it('creates a table with the first records when inserting into a new knowledge base', async () => {
    const table = {
      add: vi.fn(),
      search: vi.fn(),
    };
    const records = [
      {
        id: 'row-1',
        chunk_id: 'chunk-1',
        document_id: 'doc-1',
        vector: [0.1, 0.2],
        content: 'hello',
        metadata: '{}',
      },
    ];
    const db = {
      createTable: vi.fn(async () => table),
      openTable: vi.fn(async () => {
        throw new Error('Table does not exist');
      }),
      dropTable: vi.fn(),
    };

    const store = new VectorStore('/tmp/vector-store-test', db);

    await store.insert('new-kb', records);

    expect(db.createTable).toHaveBeenCalledWith('kb_new-kb', records, { existOk: true });
    expect(table.add).not.toHaveBeenCalled();
  });

  it('returns no search results when a knowledge base has no vector table yet', async () => {
    const db = {
      createTable: vi.fn(),
      openTable: vi.fn(async () => {
        throw new Error('Table does not exist');
      }),
      dropTable: vi.fn(),
    };
    const store = new VectorStore('/tmp/vector-store-test', db);

    await expect(store.search('empty-kb', [0.1, 0.2])).resolves.toEqual([]);
  });

  it('treats deleting a missing table as a successful cleanup', async () => {
    const db = {
      createTable: vi.fn(),
      openTable: vi.fn(),
      dropTable: vi.fn(async () => {
        throw new Error('Table does not exist');
      }),
    };
    const store = new VectorStore('/tmp/vector-store-test', db);

    await expect(store.deleteTable('missing-kb')).resolves.toBeUndefined();
  });

  it('deletes vectors for one document by document id', async () => {
    const table = {
      add: vi.fn(),
      delete: vi.fn(),
      search: vi.fn(),
    };
    const db = {
      createTable: vi.fn(),
      openTable: vi.fn(async () => table),
      dropTable: vi.fn(),
    };
    const store = new VectorStore('/tmp/vector-store-test', db);

    await store.deleteDocument('kb-1', "doc-'1");

    expect(table.delete).toHaveBeenCalledWith("document_id = 'doc-''1'");
  });
});
