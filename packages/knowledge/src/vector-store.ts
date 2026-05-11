export interface VectorRecord {
  id: string;
  chunk_id: string;
  document_id?: string;
  vector: number[];
  content: string;
  metadata: string;
}

interface LanceSearchBuilder {
  limit(limit: number): { toArray(): Promise<unknown[]> };
}

interface LanceTable {
  add(records: VectorRecord[]): Promise<void>;
  delete?(filter: string): Promise<void>;
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
    if (this.tables.has(kbId)) return;
    try {
      const table = await this.openTable(kbId);
      this.tables.set(kbId, table);
    } catch (error) {
      if (!isMissingTableError(error)) throw error;
    }
  }

  private async getTable(kbId: string): Promise<LanceTable> {
    const cached = this.tables.get(kbId);
    if (cached) return cached;
    if (!this.db) throw new Error('Not connected');

    const table = await this.openTable(kbId);
    this.tables.set(kbId, table);
    return table;
  }

  private async openTable(kbId: string): Promise<LanceTable> {
    if (!this.db) throw new Error('Not connected');
    const tableName = `kb_${kbId}`;
    return this.db.openTable(tableName);
  }

  private async createTableWithRecords(kbId: string, records: VectorRecord[]): Promise<LanceTable> {
    if (!this.db) throw new Error('Not connected');
    const tableName = `kb_${kbId}`;
    const table = await this.db.createTable(tableName, records, {
      existOk: true,
    });
    this.tables.set(kbId, table);
    return table;
  }

  async insert(kbId: string, records: VectorRecord[]): Promise<void> {
    if (records.length === 0) return;
    let table: LanceTable;
    try {
      table = await this.getTable(kbId);
    } catch (error) {
      if (!isMissingTableError(error)) throw error;
      await this.createTableWithRecords(kbId, records);
      return;
    }
    await table.add(records);
  }

  async search(kbId: string, vector: number[], limit = 10): Promise<VectorRecord[]> {
    let table: LanceTable;
    try {
      table = await this.getTable(kbId);
    } catch (error) {
      if (isMissingTableError(error)) return [];
      throw error;
    }
    const results = await table.search(vector).limit(limit).toArray();
    return results as VectorRecord[];
  }

  async deleteDocument(kbId: string, documentId: string): Promise<void> {
    let table: LanceTable;
    try {
      table = await this.getTable(kbId);
    } catch (error) {
      if (isMissingTableError(error)) return;
      throw error;
    }
    if (!table.delete) return;
    await table.delete(`document_id = '${escapeLanceSqlString(documentId)}'`);
  }

  async deleteTable(kbId: string): Promise<void> {
    if (!this.db) throw new Error('Not connected');
    const tableName = `kb_${kbId}`;
    try {
      await this.db.dropTable(tableName);
    } catch (error) {
      if (!isMissingTableError(error)) throw error;
    }
    this.tables.delete(kbId);
  }

  async disconnect(): Promise<void> {
    this.tables.clear();
    this.db = null;
  }
}

function isMissingTableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /not\s*found|not\s*exist|does\s*not\s*exist|no\s*such\s*table/i.test(message);
}

function escapeLanceSqlString(value: string): string {
  return value.replaceAll("'", "''");
}
