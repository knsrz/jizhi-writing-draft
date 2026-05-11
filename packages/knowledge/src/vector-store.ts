export interface VectorRecord {
  id: string;
  chunk_id: string;
  vector: number[];
  content: string;
  metadata: string;
}

interface LanceSearchBuilder {
  limit(limit: number): { toArray(): Promise<unknown[]> };
}

interface LanceTable {
  add(records: VectorRecord[]): Promise<void>;
  search(vector: number[]): LanceSearchBuilder;
}

interface LanceDb {
  createTable(
    tableName: string,
    records: VectorRecord[],
    options: { existOk: boolean },
  ): Promise<LanceTable>;
  openTable(tableName: string): Promise<LanceTable>;
  dropTable(tableName: string): Promise<void>;
}

export class VectorStore {
  private db: LanceDb | null = null;
  private tables = new Map<string, LanceTable>();

  constructor(
    private dbPath: string,
    db?: LanceDb,
  ) {
    this.db = db ?? null;
  }

  async connect(): Promise<void> {
    const { connect } = await import('@lancedb/lancedb');
    this.db = (await connect(this.dbPath)) as unknown as LanceDb;
  }

  async createTable(kbId: string): Promise<void> {
    if (!this.db) throw new Error('Not connected');
    const tableName = `kb_${kbId}`;
    const table = await this.db.createTable(tableName, [] as VectorRecord[], {
      existOk: true,
    });
    this.tables.set(kbId, table);
  }

  private async getTable(kbId: string): Promise<LanceTable> {
    const cached = this.tables.get(kbId);
    if (cached) return cached;
    if (!this.db) throw new Error('Not connected');

    const tableName = `kb_${kbId}`;
    const table = await this.db.openTable(tableName);
    this.tables.set(kbId, table);
    return table;
  }

  async insert(kbId: string, records: VectorRecord[]): Promise<void> {
    const table = await this.getTable(kbId);
    await table.add(records);
  }

  async search(kbId: string, vector: number[], limit = 10): Promise<VectorRecord[]> {
    const table = await this.getTable(kbId);
    const results = await table.search(vector).limit(limit).toArray();
    return results as VectorRecord[];
  }

  async deleteTable(kbId: string): Promise<void> {
    if (!this.db) throw new Error('Not connected');
    const tableName = `kb_${kbId}`;
    await this.db.dropTable(tableName);
    this.tables.delete(kbId);
  }

  async disconnect(): Promise<void> {
    this.tables.clear();
    this.db = null;
  }
}
