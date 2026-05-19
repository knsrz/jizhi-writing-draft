# 极致写作 MVP 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 搭建面向办公人员的 AI 写作桌面客户端本地 MVP，打通"配置 API Key → 知识库 RAG → 写作计划 → 分段生成 → 子 Agent 润色 → 导出"完整链路。

**Architecture:** pnpm monorepo，4 个共享包 (core/ai/knowledge/agent) + 1 个 Electron 桌面应用 (apps/desktop)，main 进程负责 IPC/LanceDB/SQLite/文件IO，renderer 负责 React UI，通过 contextBridge 安全通信。

**Tech Stack:** Electron 38 + React 19 + TypeScript 5.8 + shadcn/ui + Tailwind CSS v4 + Zustand + TipTap 3 + Vercel AI SDK v5 + better-sqlite3 + Drizzle ORM + LanceDB + Vitest + electron-vite

---

### Task 1: 初始化 monorepo 工作区

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.json`
- Create: `.gitignore`
- Create: `biome.jsonc`

- [ ] **Step 1: 创建工作区根 package.json**

```bash
cd "/Users/knsrz/Documents/开源项目/极致写作"
cat > package.json << 'EOF'
{
  "name": "writing-app",
  "private": true,
  "version": "0.1.0",
  "engines": {
    "node": ">=22",
    "pnpm": ">=9"
  },
  "scripts": {
    "dev": "pnpm --filter @app/desktop dev",
    "build": "pnpm --filter @app/desktop build",
    "lint": "biome check .",
    "format": "biome check --write .",
    "typecheck": "pnpm -r typecheck",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
EOF
```

- [ ] **Step 2: 创建 pnpm-workspace.yaml**

```bash
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - "packages/*"
  - "apps/*"
EOF
```

- [ ] **Step 3: 创建根 tsconfig.json**

```bash
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
EOF
```

- [ ] **Step 4: 创建 .gitignore**

```bash
cat > .gitignore << 'EOF'
node_modules/
dist/
out/
.vite/
*.db
*.db-journal
.DS_Store
*.log
.env
.env.local
EOF
```

- [ ] **Step 5: 创建 biome.jsonc**

```bash
cat > biome.jsonc << 'EOF'
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "formatter": {
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "linter": {
    "enabled": true,
    "rules": { "recommended": true }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingCommas": "all"
    }
  }
}
EOF
```

- [ ] **Step 6: 安装根依赖并初始化**

```bash
pnpm install --save-dev typescript @biomejs/biome vitest
pnpm install
```

---

### Task 2: 创建 packages/core（共享类型与常量）

**Files:**
- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`
- Create: `packages/core/src/index.ts`
- Create: `packages/core/src/types.ts`
- Create: `packages/core/src/ipc-channels.ts`
- Create: `packages/core/src/constants.ts`

- [ ] **Step 1: 创建 package.json**

```bash
mkdir -p packages/core/src
cat > packages/core/package.json << 'EOF'
{
  "name": "@app/core",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit"
  }
}
EOF
```

- [ ] **Step 2: 创建 tsconfig.json**

```bash
cat > packages/core/tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
EOF
```

- [ ] **Step 3: 写入 types.ts**

```typescript
// packages/core/src/types.ts

export type WritingType =
  | 'summary'
  | 'report'
  | 'proposal'
  | 'minutes'
  | 'notice'
  | 'email'
  | 'promotional'
  | 'policy'
  | 'bidding'
  | 'custom';

export type Style = 'formal' | 'concise' | 'professional' | 'friendly' | 'promotional' | 'government';

export type WritingStatus = 'draft' | 'planning' | 'writing' | 'polishing' | 'done' | 'error';

export type DocStatus = 'pending' | 'parsing' | 'chunking' | 'embedding' | 'ready' | 'error';

export interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  embeddingModel: string;
  documentCount: number;
  storageSize: number;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  knowledgeBaseId: string;
  fileName: string;
  fileType: 'pdf' | 'docx' | 'txt' | 'md';
  filePath: string;
  fileHash: string;
  status: DocStatus;
  chunkCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  knowledgeBaseId: string;
  chunkIndex: number;
  content: string;
  tokenCount: number;
  metadata: ChunkMetadata;
  lanceRowId: string | null;
  createdAt: string;
}

export interface ChunkMetadata {
  heading?: string;
  page?: number;
  section?: string;
}

export interface WritingProject {
  id: string;
  title: string;
  writingType: WritingType;
  targetWords: number;
  style: Style;
  knowledgeBaseId: string | null;
  status: WritingStatus;
  plan: WritingPlan | null;
  createdAt: string;
  updatedAt: string;
}

export interface WritingPlan {
  goal: string;
  audience: string;
  sections: SectionPlan[];
  totalWordBudget: number;
  missingInfo?: string[];
}

export interface SectionPlan {
  title: string;
  targetWords: number;
  keywords: string[];
  needsRAG: boolean;
}

export interface WritingVersion {
  id: string;
  projectId: string;
  versionNumber: number;
  content: string;
  wordCount: number;
  changeSummary: string;
  createdAt: string;
}

export interface SectionOutput {
  sectionIndex: number;
  title: string;
  content: string;
}

export interface UploadProgress {
  documentId: string;
  fileName: string;
  stage: 'parsing' | 'chunking' | 'embedding';
  progress: number;
  totalChunks: number;
  completedChunks: number;
}

export interface ModelConfig {
  provider: string;
  baseUrl: string;
  apiKey: string;
  writingModel: string;
  embeddingModel: string;
}
```

- [ ] **Step 4: 写入 ipc-channels.ts**

```typescript
// packages/core/src/ipc-channels.ts

export const IpcChannel = {
  KB_LIST: 'kb:list',
  KB_CREATE: 'kb:create',
  KB_DELETE: 'kb:delete',
  KB_DOC_LIST: 'kb:doc-list',
  KB_DOC_DELETE: 'kb:doc-delete',
  KB_UPLOAD: 'kb:upload',
  KB_UPLOAD_PROGRESS: 'kb:upload-progress',
  KB_SEARCH: 'kb:search',

  WRITING_START: 'writing:start',
  WRITING_CANCEL: 'writing:cancel',
  WRITING_PLAN: 'writing:plan',
  WRITING_SECTION: 'writing:section',
  WRITING_PROGRESS: 'writing:progress',
  WRITING_DONE: 'writing:done',
  WRITING_ERROR: 'writing:error',
  WRITING_RETRY_SECTION: 'writing:retry-section',

  VERSION_LIST: 'version:list',
  VERSION_GET: 'version:get',
  VERSION_RESTORE: 'version:restore',

  EXPORT_MD: 'export:md',
  EXPORT_DOCX: 'export:docx',

  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  APIKEY_SET: 'apikey:set',
  APIKEY_TEST: 'apikey:test',
  MODEL_LIST: 'model:list',
} as const;

export type IpcChannelValue = (typeof IpcChannel)[keyof typeof IpcChannel];
```

- [ ] **Step 5: 写入 constants.ts**

```typescript
// packages/core/src/constants.ts
import type { Style, WritingType } from './types.js';

export const WRITING_TYPE_LABELS: Record<WritingType, string> = {
  summary: '工作总结',
  report: '调研报告',
  proposal: '项目方案',
  minutes: '会议纪要',
  notice: '通知公告',
  email: '商务邮件',
  promotional: '宣传稿',
  policy: '制度文档',
  bidding: '招投标材料',
  custom: '自定义文档',
};

export const STYLE_LABELS: Record<Style, string> = {
  formal: '正式',
  concise: '简洁',
  professional: '专业',
  friendly: '亲和',
  promotional: '宣传',
  government: '公文',
};

export const WORD_COUNT_OPTIONS = [
  { label: '短篇 (~800字)', value: 800 },
  { label: '中等 (~2000字)', value: 2000 },
  { label: '长篇 (~5000字)', value: 5000 },
  { label: '自定义', value: -1 },
] as const;

export const APP_DATA_DIR = 'writing-app';
```

- [ ] **Step 6: 写入 index.ts**

```typescript
// packages/core/src/index.ts
export * from './types.js';
export * from './ipc-channels.js';
export * from './constants.js';
```

- [ ] **Step 7: 安装 & 验证**

```bash
pnpm install
pnpm --filter @app/core typecheck
```

Expected: 无错误输出。

- [ ] **Step 8: 提交**

```bash
git init
git add -A
git commit -m "feat: init monorepo with packages/core (types, IPC channels, constants)"
```

---

### Task 3: 创建 packages/ai（模型抽象层）

**Files:**
- Create: `packages/ai/package.json`
- Create: `packages/ai/tsconfig.json`
- Create: `packages/ai/src/index.ts`
- Create: `packages/ai/src/providers/openai-compatible.ts`
- Create: `packages/ai/src/embedding.ts`
- Create: `packages/ai/src/token-counter.ts`

- [ ] **Step 1: 创建 package.json 和 tsconfig**

```bash
mkdir -p packages/ai/src/providers
cat > packages/ai/package.json << 'EOF'
{
  "name": "@app/ai",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": { "typecheck": "tsc --noEmit" },
  "dependencies": {
    "@app/core": "workspace:*"
  },
  "peerDependencies": {
    "ai": "^5.0.0"
  }
}
EOF

cat > packages/ai/tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": { "outDir": "./dist", "rootDir": "./src" },
  "include": ["src"]
}
EOF
```

- [ ] **Step 2: 实现 OpenAI-compatible provider**

```typescript
// packages/ai/src/providers/openai-compatible.ts
import { createOpenAI } from '@ai-sdk/openai';
import type { LanguageModelV2 } from 'ai';

export interface ProviderConfig {
  baseUrl: string;
  apiKey: string;
}

export function createOpenAICompatible(config: ProviderConfig) {
  return createOpenAI({
    baseURL: config.baseUrl,
    apiKey: config.apiKey,
  });
}

export function getWritingModel(provider: ReturnType<typeof createOpenAICompatible>, modelId: string): LanguageModelV2 {
  return provider.chat(modelId) as unknown as LanguageModelV2;
}

export function getEmbeddingModel(
  provider: ReturnType<typeof createOpenAICompatible>,
  modelId: string,
) {
  return provider.embedding(modelId);
}
```

- [ ] **Step 3: 实现 connection test**

```typescript
// packages/ai/src/index.ts
import { createOpenAICompatible } from './providers/openai-compatible.js';
import { generateText } from 'ai';

export { createOpenAICompatible, getWritingModel, getEmbeddingModel } from './providers/openai-compatible.js';
export { tokenCounter } from './token-counter.js';

export interface ConnectionTestResult {
  success: boolean;
  latencyMs: number;
  error?: string;
}

export async function testConnection(
  baseUrl: string,
  apiKey: string,
  modelId: string,
): Promise<ConnectionTestResult> {
  const start = Date.now();
  try {
    const provider = createOpenAICompatible({ baseUrl, apiKey });
    const model = provider.chat(modelId);
    await generateText({ model, prompt: 'Hi', maxTokens: 5 });
    return { success: true, latencyMs: Date.now() - start };
  } catch (e) {
    return { success: false, latencyMs: Date.now() - start, error: String(e) };
  }
}
```

- [ ] **Step 4: 实现 embedding wrapper**

```typescript
// packages/ai/src/embedding.ts
import { embedMany } from 'ai';
import type { EmbeddingModelV2 } from 'ai';

export async function embedTexts(
  model: EmbeddingModelV2<string>,
  texts: string[],
  batchSize = 20,
): Promise<number[][]> {
  const result = await embedMany({
    model,
    values: texts,
    maxEmbeddingsPerCall: batchSize,
  });
  return result.embeddings as number[][];
}
```

- [ ] **Step 5: 实现 token counter**

```typescript
// packages/ai/src/token-counter.ts

const AVG_CHARS_PER_TOKEN = 3.5;

export const tokenCounter = {
  count(text: string): number {
    return Math.ceil(text.length / AVG_CHARS_PER_TOKEN);
  },

  countWords(text: string): number {
    const cleaned = text.replace(/[#*>`\-\s]+/g, ' ').trim();
    if (!cleaned) return 0;
    return cleaned.split(/\s+/).length;
  },

  estimateTokensFromWords(words: number): number {
    return Math.ceil(words * 1.3);
  },
};
```

- [ ] **Step 6: 安装 & 验证**

```bash
pnpm install
pnpm --filter @app/ai typecheck
```

---

### Task 4: 创建 packages/knowledge（RAG 管线）

**Files:**
- Create: `packages/knowledge/package.json`
- Create: `packages/knowledge/tsconfig.json`
- Create: `packages/knowledge/src/index.ts`
- Create: `packages/knowledge/src/parser/index.ts`
- Create: `packages/knowledge/src/parser/pdf.ts`
- Create: `packages/knowledge/src/parser/docx.ts`
- Create: `packages/knowledge/src/parser/txt.ts`
- Create: `packages/knowledge/src/chunker.ts`
- Create: `packages/knowledge/src/vector-store.ts`
- Create: `packages/knowledge/src/retriever.ts`

- [ ] **Step 1: 创建包脚手架**

```bash
mkdir -p packages/knowledge/src/parser
cat > packages/knowledge/package.json << 'EOF'
{
  "name": "@app/knowledge",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": { "typecheck": "tsc --noEmit" },
  "dependencies": {
    "@app/core": "workspace:*",
    "@app/ai": "workspace:*",
    "pdf-parse": "^1.1.1",
    "mammoth": "^1.9.0"
  }
}
EOF

cp packages/ai/tsconfig.json packages/knowledge/tsconfig.json
```

- [ ] **Step 2: 实现 parser**

```typescript
// packages/knowledge/src/parser/pdf.ts
import fs from 'node:fs';

export async function parsePdf(filePath: string): Promise<string> {
  const pdfParse = (await import('pdf-parse')).default;
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return data.text;
}
```

```typescript
// packages/knowledge/src/parser/docx.ts
import mammoth from 'mammoth';

export async function parseDocx(filePath: string): Promise<string> {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
}
```

```typescript
// packages/knowledge/src/parser/txt.ts
import fs from 'node:fs';

export function parseTxt(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8');
}

export function parseMarkdown(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8');
}
```

```typescript
// packages/knowledge/src/parser/index.ts
import type { Document } from '@app/core';

export async function parseDocument(doc: Document): Promise<string> {
  switch (doc.fileType) {
    case 'pdf': {
      const { parsePdf } = await import('./pdf.js');
      return parsePdf(doc.filePath);
    }
    case 'docx': {
      const { parseDocx } = await import('./docx.js');
      return parseDocx(doc.filePath);
    }
    case 'md': {
      const { parseMarkdown } = await import('./txt.js');
      return parseMarkdown(doc.filePath);
    }
    case 'txt': {
      const { parseTxt } = await import('./txt.js');
      return parseTxt(doc.filePath);
    }
    default:
      throw new Error(`Unsupported file type: ${doc.fileType}`);
  }
}
```

- [ ] **Step 3: 实现 chunker**

```typescript
// packages/knowledge/src/chunker.ts
import type { ChunkMetadata } from '@app/core';

const MAX_CHUNK_CHARS = 1000;
const OVERLAP_CHARS = 100;

interface ChunkInput {
  content: string;
  metadata?: Partial<ChunkMetadata>;
}

export function chunkText(input: ChunkInput): { text: string; metadata: ChunkMetadata }[] {
  const { content, metadata = {} } = input;
  const paragraphs = content.split(/\n\s*\n/);
  const chunks: { text: string; metadata: ChunkMetadata }[] = [];

  let currentText = '';
  let heading = metadata.heading || '';

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    const headingMatch = trimmed.match(/^(#{1,4}\s|Chapter\s|[第][一二三四五六七八九十\d]+[章节篇部分])/);
    if (headingMatch) {
      heading = trimmed.replace(/^#+\s*/, '');
      if (currentText) {
        chunks.push({ text: currentText.trim(), metadata: { ...metadata, heading } });
        currentText = '';
      }
    }

    if (currentText.length + trimmed.length > MAX_CHUNK_CHARS) {
      chunks.push({ text: currentText.trim(), metadata: { ...metadata, heading } });
      currentText = currentText.slice(-OVERLAP_CHARS) + '\n\n' + trimmed;
    } else {
      currentText = currentText ? currentText + '\n\n' + trimmed : trimmed;
    }
  }

  if (currentText.trim()) {
    chunks.push({ text: currentText.trim(), metadata: { ...metadata, heading } });
  }

  return chunks;
}
```

- [ ] **Step 4: 实现 LanceDB vector store**

```typescript
// packages/knowledge/src/vector-store.ts
import { type Connection, type Table, connect } from '@lancedb/lancedb';

const VECTOR_DIM = 1536;

export interface VectorRecord {
  id: string;
  chunk_id: string;
  vector: number[];
  content: string;
  metadata: string;
}

export class VectorStore {
  private db: Connection | null = null;
  private tables = new Map<string, Table<VectorRecord>>();

  constructor(private dbPath: string) {}

  async connect(): Promise<void> {
    const { connect } = await import('@lancedb/lancedb');
    this.db = await connect(this.dbPath);
  }

  async createTable(kbId: string): Promise<void> {
    if (!this.db) throw new Error('Not connected');
    const tableName = `kb_${kbId}`;
    const table = await this.db.createTable(tableName, [] as VectorRecord[], {
      existOk: true,
    });
    this.tables.set(kbId, table);
  }

  async insert(kbId: string, records: VectorRecord[]): Promise<void> {
    const table = this.tables.get(kbId);
    if (!table) throw new Error(`Table for kb ${kbId} not found`);
    await table.add(records);
  }

  async search(kbId: string, vector: number[], limit = 10): Promise<VectorRecord[]> {
    const table = this.tables.get(kbId);
    if (!table) throw new Error(`Table for kb ${kbId} not found`);
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
```

- [ ] **Step 5: 实现 retriever**

```typescript
// packages/knowledge/src/retriever.ts
import type { EmbeddingModelV2 } from 'ai';
import { embedTexts } from '@app/ai/embedding';
import { VectorStore } from './vector-store.js';

export class Retriever {
  constructor(
    private vectorStore: VectorStore,
    private embedModel: EmbeddingModelV2<string>,
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
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return normA === 0 || normB === 0 ? 0 : dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
```

```typescript
// packages/knowledge/src/index.ts
export { parseDocument } from './parser/index.js';
export { chunkText } from './chunker.js';
export { VectorStore } from './vector-store.js';
export type { VectorRecord } from './vector-store.js';
export { Retriever } from './retriever.js';
```

- [ ] **Step 6: 安装 & 验证**

```bash
pnpm install
pnpm --filter @app/knowledge typecheck
```

---

### Task 5: 创建 packages/agent（写作 Agent 编排）

**Files:**
- Create: `packages/agent/package.json`
- Create: `packages/agent/tsconfig.json`
- Create: `packages/agent/src/index.ts`
- Create: `packages/agent/src/planner.ts`
- Create: `packages/agent/src/writer.ts`
- Create: `packages/agent/src/sub-agents/fact-check.ts`
- Create: `packages/agent/src/sub-agents/polish.ts`
- Create: `packages/agent/src/pipeline.ts`

- [ ] **Step 1: 创建包脚手架**

```bash
mkdir -p packages/agent/src/sub-agents
cat > packages/agent/package.json << 'EOF'
{
  "name": "@app/agent",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": { "typecheck": "tsc --noEmit" },
  "dependencies": {
    "@app/core": "workspace:*",
    "@app/ai": "workspace:*",
    "@app/knowledge": "workspace:*"
  }
}
EOF

cp packages/ai/tsconfig.json packages/agent/tsconfig.json
```

- [ ] **Step 2: 实现 planner**

```typescript
// packages/agent/src/planner.ts
import { generateText } from 'ai';
import type { LanguageModelV2 } from 'ai';
import type { WritingPlan, WritingRequest } from '@app/core';
import { tokenCounter } from '@app/ai/token-counter';
import type { Retriever } from '@app/knowledge';

const PLAN_SYSTEM_PROMPT = `You are a writing planner for Chinese business documents. Given a topic, writing type, target word count, and style requirements, generate a structured writing plan.

Output ONLY valid JSON in this exact format:
{
  "goal": "一句话描述文章目标",
  "audience": "目标读者描述",
  "sections": [
    {
      "title": "章节标题",
      "targetWords": 数字,
      "keywords": ["检索关键词1", "检索关键词2"],
      "needsRAG": true/false
    }
  ],
  "totalWordBudget": 数字,
  "missingInfo": ["需用户补充的信息"]
}

Rules:
- Total word budget across all sections must sum to roughly the target word count.
- Each section's targetWords should be proportional to its importance.
- If the user's request mentions specific data/policies/names that might be in their knowledge base, set needsRAG=true for relevant sections.
- Extract meaningful keywords that would help retrieve relevant documents.`;

export async function generatePlan(
  model: LanguageModelV2,
  request: WritingRequest,
  retriever?: Retriever,
  knowledgeBaseId?: string,
): Promise<WritingPlan> {
  const prompt = `写作类型：${request.type}
写作主题：${request.topic}
目标字数：${request.targetWords}
风格：${request.style}
${request.userOutline ? `用户大纲：${request.userOutline}` : ''}

请为此生成写作计划。`;

  const result = await generateText({
    model,
    system: PLAN_SYSTEM_PROMPT,
    prompt,
    temperature: 0.3,
  });

  const text = result.text.trim();
  const jsonStart = text.indexOf('{');
  const jsonEnd = text.lastIndexOf('}') + 1;
  const plan: WritingPlan = JSON.parse(text.slice(jsonStart, jsonEnd));

  const totalWords = plan.sections.reduce((sum, s) => sum + s.targetWords, 0);
  plan.totalWordBudget = totalWords;

  return plan;
}
```

- [ ] **Step 3: 实现 writer**

```typescript
// packages/agent/src/writer.ts
import { streamText } from 'ai';
import type { LanguageModelV2 } from 'ai';
import type { SectionPlan, SectionOutput, Style, WritingPlan } from '@app/core';
import type { Retriever } from '@app/knowledge';

const SECTION_SYSTEM_PROMPT = `You are a professional Chinese business writer. Write the specified section of a document based on the plan, style requirements, and any reference materials provided.

Rules:
- Write in Chinese.
- Target the specified word count approximately (±20%).
- Use the reference materials as factual basis — do not fabricate data, dates, names, or policies.
- Maintain the specified tone and style.
- Output ONLY the section content, no meta-commentary.`;

export async function* writeSection(
  model: LanguageModelV2,
  section: SectionPlan,
  sectionIndex: number,
  plan: WritingPlan,
  style: Style,
  retriever?: Retriever,
  knowledgeBaseId?: string,
): AsyncGenerator<SectionOutput> {
  let referenceContext = '';
  if (retriever && knowledgeBaseId && section.needsRAG) {
    const kw = section.keywords.join(' ');
    const results = await retriever.search(knowledgeBaseId, kw, 5);
    referenceContext = results
      .map((r, i) => `[参考资料${i + 1}]\n${r.content}`)
      .join('\n\n');
  }

  const prompt = `请撰写以下章节：

章节标题：${section.title}
目标字数：${section.targetWords}字
风格：${style}
文章目标：${plan.goal}
目标读者：${plan.audience}

${referenceContext ? `参考资料：\n${referenceContext}` : ''}

请直接输出章节正文（Markdown格式），不要包含章节标题本身。`;

  const result = await streamText({
    model,
    system: SECTION_SYSTEM_PROMPT,
    prompt,
    temperature: 0.7,
  });

  let fullContent = '';
  for await (const chunk of result.textStream) {
    fullContent += chunk;
  }

  yield {
    sectionIndex,
    title: section.title,
    content: fullContent,
  };
}
```

- [ ] **Step 4: 实现 fact-check sub-agent**

```typescript
// packages/agent/src/sub-agents/fact-check.ts
import { generateText } from 'ai';
import type { LanguageModelV2 } from 'ai';

const FACT_CHECK_PROMPT = `You are a fact-checking editor for Chinese documents. Compare the provided paragraph against reference materials.

Rules:
- Check each factual claim (numbers, dates, names, policies, conclusions) against the references.
- If a claim matches or is supported by references, keep it unchanged.
- If a claim contradicts references, correct it to match the references.
- If a claim cannot be verified from references, keep it but wrap it in [待核实: ...].
- Do NOT add new content or opinions.
- Return the corrected paragraph in Markdown, followed by a brief list of changes made.`;

export async function factCheckSection(
  model: LanguageModelV2,
  sectionContent: string,
  referenceContext: string,
): Promise<string> {
  const result = await generateText({
    model,
    system: FACT_CHECK_PROMPT,
    prompt: `参考资料：\n${referenceContext}\n\n待校正文段：\n${sectionContent}`,
    temperature: 0.2,
  });
  return result.text;
}
```

- [ ] **Step 5: 实现 polish sub-agent**

```typescript
// packages/agent/src/sub-agents/polish.ts
import { generateText } from 'ai';
import type { LanguageModelV2 } from 'ai';

const POLISH_PROMPT = `You are a Chinese language editor. Polish the given paragraph to improve clarity, flow, and professionalism while preserving all factual content.

Rules:
- Optimize expression and sentence structure.
- Improve transitions between sentences.
- Remove redundancy and wordiness.
- Maintain the original tone and style.
- Do NOT change any facts, numbers, dates, or names.
- Keep approximately the same length.
- Return only the polished text.`;

export async function polishSection(
  model: LanguageModelV2,
  sectionContent: string,
  style: string,
): Promise<string> {
  const result = await generateText({
    model,
    system: POLISH_PROMPT,
    prompt: `目标风格：${style}\n\n待润色文段：\n${sectionContent}`,
    temperature: 0.5,
  });
  return result.text;
}
```

- [ ] **Step 6: 实现 pipeline orchestrator**

```typescript
// packages/agent/src/pipeline.ts
import type { LanguageModelV2, EmbeddingModelV2 } from 'ai';
import type { WritingPlan, WritingRequest, SectionOutput } from '@app/core';
import { Retriever } from '@app/knowledge';
import { tokenCounter } from '@app/ai/token-counter';
import { generatePlan } from './planner.js';
import { writeSection } from './writer.js';
import { factCheckSection } from './sub-agents/fact-check.js';
import { polishSection } from './sub-agents/polish.js';

export interface PipelineCallbacks {
  onPlanReady: (plan: WritingPlan) => void;
  onSectionStart: (index: number, title: string) => void;
  onSectionWriting: (section: SectionOutput) => void;
  onSectionFactCheck: (index: number, content: string) => void;
  onSectionPolish: (index: number, content: string) => void;
  onProgress: (percent: number) => void;
  onError: (error: Error) => void;
}

export async function runPipeline(
  request: WritingRequest,
  writingModel: LanguageModelV2,
  retriever: Retriever | null,
  callbacks: PipelineCallbacks,
): Promise<string> {
  try {
    // Phase 1: Plan
    callbacks.onProgress(5);
    const plan = await generatePlan(writingModel, request, retriever ?? undefined, request.knowledgeBaseId ?? undefined);
    callbacks.onPlanReady(plan);
    callbacks.onProgress(10);

    // Phase 2: Write sections
    const totalTarget = plan.sections.reduce((s, sec) => s + sec.targetWords, 0);
    const sections: SectionOutput[] = [];

    for (let i = 0; i < plan.sections.length; i++) {
      const sectionPlan = plan.sections[i];
      callbacks.onSectionStart(i, sectionPlan.title);

      const gen = writeSection(
        writingModel, sectionPlan, i, plan, request.style,
        retriever ?? undefined, request.knowledgeBaseId ?? undefined,
      );

      for await (const section of gen) {
        callbacks.onSectionWriting(section);

        // Phase 3a: Fact check
        let content = section.content;
        if (retriever && request.knowledgeBaseId && sectionPlan.needsRAG) {
          const refs = await retriever.search(request.knowledgeBaseId, sectionPlan.keywords.join(' '), 5);
          const refContext = refs.map((r) => r.content).join('\n\n');
          content = await factCheckSection(writingModel, section.content, refContext);
          callbacks.onSectionFactCheck(i, content);
        }

        // Phase 3b: Polish
        content = await polishSection(writingModel, content, request.style);
        callbacks.onSectionPolish(i, content);

        sections.push({ sectionIndex: i, title: section.title, content });
      }

      const phaseProgress = 10 + Math.round(((i + 1) / plan.sections.length) * 75);
      callbacks.onProgress(phaseProgress);
    }

    // Phase 4: Merge
    callbacks.onProgress(90);
    const fullText = sections
      .map((s) => `## ${s.title}\n\n${s.content}`)
      .join('\n\n');

    // Word count check
    const actualWords = tokenCounter.countWords(fullText);
    if (actualWords > request.targetWords * 1.15) {
      const compressed = await compressFullText(writingModel, fullText, request.targetWords);
      callbacks.onProgress(100);
      return compressed;
    }

    callbacks.onProgress(100);
    return fullText;
  } catch (e) {
    callbacks.onError(e instanceof Error ? e : new Error(String(e)));
    throw e;
  }
}

async function compressFullText(
  model: LanguageModelV2,
  text: string,
  targetWords: number,
): Promise<string> {
  const { generateText } = await import('ai');
  const result = await generateText({
    model,
    system: '压缩以下文章到约目标字数，保留所有关键信息和结构。只输出压缩后的文章。',
    prompt: `目标字数：${targetWords}字\n\n${text}`,
    temperature: 0.3,
  });
  return result.text;
}
```

```typescript
// packages/agent/src/index.ts
export { runPipeline } from './pipeline.js';
export type { PipelineCallbacks } from './pipeline.js';
export { generatePlan } from './planner.js';
```

- [ ] **Step 7: 安装 & 验证**

```bash
pnpm install
pnpm --filter @app/agent typecheck
```

---

### Task 6: 搭建 Electron 桌面应用脚手架

**Files:**
- Create: `apps/desktop/package.json`
- Create: `apps/desktop/electron.vite.config.ts`
- Create: `apps/desktop/tsconfig.json`
- Create: `apps/desktop/tsconfig.node.json`
- Create: `apps/desktop/tsconfig.web.json`
- Create: `apps/desktop/src/main/index.ts`
- Create: `apps/desktop/src/preload/index.ts`
- Create: `apps/desktop/src/renderer/index.html`
- Create: `apps/desktop/src/renderer/main.tsx`
- Create: `apps/desktop/src/renderer/App.tsx`
- Create: `apps/desktop/src/renderer/globals.css`

- [ ] **Step 1: 创建 apps/desktop/package.json**

```bash
mkdir -p apps/desktop/src/{main/ipc,main/db,main/services,preload,renderer/{pages,components/{writing,knowledge,editor,ui},hooks,store,lib}}

cat > apps/desktop/package.json << 'EOF'
{
  "name": "@app/desktop",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./out/main/index.js",
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "typecheck:node": "tsc --noEmit -p tsconfig.node.json",
    "typecheck:web": "tsc --noEmit -p tsconfig.web.json",
    "typecheck": "npm run typecheck:node && npm run typecheck:web"
  },
  "dependencies": {
    "@app/core": "workspace:*",
    "@app/ai": "workspace:*",
    "@app/knowledge": "workspace:*",
    "@app/agent": "workspace:*",
    "better-sqlite3": "^11.7.0",
    "drizzle-orm": "^0.41.0",
    "@lancedb/lancedb": "^0.18.0"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.13",
    "electron": "^38.0.0",
    "electron-vite": "^3.0.0",
    "@vitejs/plugin-react": "^4.4.0"
  }
}
EOF
```

- [ ] **Step 2: 创建 TypeScript configs**

```bash
cat > apps/desktop/tsconfig.json << 'EOF'
{
  "files": [],
  "references": [
    { "path": "./tsconfig.node.json" },
    { "path": "./tsconfig.web.json" }
  ]
}
EOF

cat > apps/desktop/tsconfig.node.json << 'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./out",
    "rootDir": "./src",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "types": ["node"]
  },
  "include": ["src/main/**/*", "src/preload/**/*"]
}
EOF

cat > apps/desktop/tsconfig.web.json << 'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./out",
    "rootDir": "./src/renderer",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "types": ["vite/client"]
  },
  "include": ["src/renderer/**/*"]
}
EOF
```

- [ ] **Step 3: 创建 electron.vite.config.ts**

```bash
cat > apps/desktop/electron.vite.config.ts << 'EOF'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: { index: resolve(__dirname, 'src/main/index.ts') },
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: { index: resolve(__dirname, 'src/preload/index.ts') },
      },
    },
  },
  renderer: {
    root: resolve(__dirname, 'src/renderer'),
    build: { rollupOptions: { input: { index: resolve(__dirname, 'src/renderer/index.html') } } },
    plugins: [react()],
    resolve: {
      alias: { '@': resolve(__dirname, 'src/renderer') },
    },
  },
});
EOF
```

- [ ] **Step 4: 创建 Electron main process entry**

```typescript
// apps/desktop/src/main/index.ts
import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'node:path';
import { initDatabase } from './db/index.js';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    title: '极致写作',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(async () => {
  initDatabase();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
```

- [ ] **Step 5: 创建 preload**

```typescript
// apps/desktop/src/preload/index.ts
import { contextBridge, ipcRenderer } from 'electron';
import { IpcChannel } from '@app/core';

const api = {
  // Knowledge base
  listKnowledgeBases: () => ipcRenderer.invoke(IpcChannel.KB_LIST),
  createKnowledgeBase: (name: string, description: string) =>
    ipcRenderer.invoke(IpcChannel.KB_CREATE, name, description),
  deleteKnowledgeBase: (id: string) =>
    ipcRenderer.invoke(IpcChannel.KB_DELETE, id),
  listDocuments: (kbId: string) =>
    ipcRenderer.invoke(IpcChannel.KB_DOC_LIST, kbId),
  deleteDocument: (docId: string) =>
    ipcRenderer.invoke(IpcChannel.KB_DOC_DELETE, docId),
  uploadDocument: (kbId: string) =>
    ipcRenderer.invoke(IpcChannel.KB_UPLOAD, kbId),
  onUploadProgress: (cb: (progress: unknown) => void) => {
    const handler = (_: unknown, p: unknown) => cb(p);
    ipcRenderer.on(IpcChannel.KB_UPLOAD_PROGRESS, handler);
    return () => ipcRenderer.removeListener(IpcChannel.KB_UPLOAD_PROGRESS, handler);
  },
  searchKnowledgeBase: (kbId: string, query: string) =>
    ipcRenderer.invoke(IpcChannel.KB_SEARCH, kbId, query),

  // Writing
  startWriting: (req: unknown) =>
    ipcRenderer.invoke(IpcChannel.WRITING_START, req),
  cancelWriting: () => ipcRenderer.invoke(IpcChannel.WRITING_CANCEL),
  onWritingPlan: (cb: (plan: unknown) => void) => {
    const handler = (_: unknown, p: unknown) => cb(p);
    ipcRenderer.on(IpcChannel.WRITING_PLAN, handler);
    return () => ipcRenderer.removeListener(IpcChannel.WRITING_PLAN, handler);
  },
  onWritingSection: (cb: (section: unknown) => void) => {
    const handler = (_: unknown, s: unknown) => cb(s);
    ipcRenderer.on(IpcChannel.WRITING_SECTION, handler);
    return () => ipcRenderer.removeListener(IpcChannel.WRITING_SECTION, handler);
  },
  onWritingProgress: (cb: (p: number) => void) => {
    const handler = (_: unknown, p: number) => cb(p);
    ipcRenderer.on(IpcChannel.WRITING_PROGRESS, handler);
    return () => ipcRenderer.removeListener(IpcChannel.WRITING_PROGRESS, handler);
  },
  onWritingDone: (cb: (full: string) => void) => {
    const handler = (_: unknown, full: string) => cb(full);
    ipcRenderer.on(IpcChannel.WRITING_DONE, handler);
    return () => ipcRenderer.removeListener(IpcChannel.WRITING_DONE, handler);
  },
  onWritingError: (cb: (error: string) => void) => {
    const handler = (_: unknown, error: string) => cb(error);
    ipcRenderer.on(IpcChannel.WRITING_ERROR, handler);
    return () => ipcRenderer.removeListener(IpcChannel.WRITING_ERROR, handler);
  },
  retrySection: (projectId: string, sectionIndex: number) =>
    ipcRenderer.invoke(IpcChannel.WRITING_RETRY_SECTION, projectId, sectionIndex),

  // Versions
  listVersions: (projectId: string) =>
    ipcRenderer.invoke(IpcChannel.VERSION_LIST, projectId),
  getVersion: (versionId: string) =>
    ipcRenderer.invoke(IpcChannel.VERSION_GET, versionId),
  restoreVersion: (versionId: string) =>
    ipcRenderer.invoke(IpcChannel.VERSION_RESTORE, versionId),

  // Export
  exportMarkdown: (projectId: string) =>
    ipcRenderer.invoke(IpcChannel.EXPORT_MD, projectId),
  exportDocx: (projectId: string) =>
    ipcRenderer.invoke(IpcChannel.EXPORT_DOCX, projectId),

  // Settings
  getSetting: (key: string) => ipcRenderer.invoke(IpcChannel.SETTINGS_GET, key),
  setSetting: (key: string, value: string) =>
    ipcRenderer.invoke(IpcChannel.SETTINGS_SET, key, value),
  setApiKey: (config: unknown) => ipcRenderer.invoke(IpcChannel.APIKEY_SET, config),
  testApiConnection: (config: unknown) =>
    ipcRenderer.invoke(IpcChannel.APIKEY_TEST, config),
};

contextBridge.exposeInMainWorld('api', api);

export type ElectronApi = typeof api;
```

- [ ] **Step 6: 创建 renderer 入口文件**

```html
<!-- apps/desktop/src/renderer/index.html -->
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>极致写作</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./main.tsx"></script>
  </body>
</html>
```

```typescript
// apps/desktop/src/renderer/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

```typescript
// apps/desktop/src/renderer/App.tsx
export default function App() {
  return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <h1 className="text-2xl font-bold text-slate-800">极致写作</h1>
    </div>
  );
}
```

```css
/* apps/desktop/src/renderer/globals.css */
@import "tailwindcss";

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}
```

- [ ] **Step 7: 安装依赖并验证构建**

```bash
cd apps/desktop
pnpm install
pnpm add -D tailwindcss @tailwindcss/vite
cd ../..
pnpm install
```

Expected: `pnpm install` 成功，无错误。

---

### Task 7: 实现主进程数据库层

**Files:**
- Create: `apps/desktop/src/main/db/schema.ts`
- Create: `apps/desktop/src/main/db/index.ts`

- [ ] **Step 1: 创建 Drizzle schema**

```typescript
// apps/desktop/src/main/db/schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const knowledgeBases = sqliteTable('knowledge_bases', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').default(''),
  embeddingModel: text('embedding_model').default('text-embedding-3-small'),
  documentCount: integer('document_count').default(0),
  storageSize: integer('storage_size').default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const documents = sqliteTable('documents', {
  id: text('id').primaryKey(),
  knowledgeBaseId: text('knowledge_base_id').notNull().references(() => knowledgeBases.id, { onDelete: 'cascade' }),
  fileName: text('file_name').notNull(),
  fileType: text('file_type').notNull(),
  filePath: text('file_path').notNull(),
  fileHash: text('file_hash').notNull(),
  status: text('status').default('pending'),
  chunkCount: integer('chunk_count').default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const documentChunks = sqliteTable('document_chunks', {
  id: text('id').primaryKey(),
  documentId: text('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' }),
  knowledgeBaseId: text('knowledge_base_id').notNull().references(() => knowledgeBases.id, { onDelete: 'cascade' }),
  chunkIndex: integer('chunk_index').notNull(),
  content: text('content').notNull(),
  tokenCount: integer('token_count').default(0),
  metadata: text('metadata').default('{}'),
  lanceRowId: text('lance_row_id'),
  createdAt: text('created_at').notNull(),
});

export const writingProjects = sqliteTable('writing_projects', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  writingType: text('writing_type').notNull(),
  targetWords: integer('target_words').default(2000),
  style: text('style').default('formal'),
  knowledgeBaseId: text('knowledge_base_id'),
  status: text('status').default('draft'),
  plan: text('plan'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const writingVersions = sqliteTable('writing_versions', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => writingProjects.id, { onDelete: 'cascade' }),
  versionNumber: integer('version_number').notNull(),
  content: text('content').notNull(),
  wordCount: integer('word_count').default(0),
  changeSummary: text('change_summary').default(''),
  createdAt: text('created_at').notNull(),
});

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});
```

- [ ] **Step 2: 实现数据库初始化**

```typescript
// apps/desktop/src/main/db/index.ts
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { app } from 'electron';
import { join } from 'node:path';
import * as schema from './schema.js';
import { APP_DATA_DIR } from '@app/core';

let dbInstance: ReturnType<typeof drizzle> | null = null;

export function initDatabase(): ReturnType<typeof drizzle> {
  if (dbInstance) return dbInstance;

  const userDataPath = app.getPath('userData');
  const dbPath = join(userDataPath, APP_DATA_DIR, 'app.db');

  const fs = require('node:fs');
  fs.mkdirSync(join(userDataPath, APP_DATA_DIR), { recursive: true });

  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  dbInstance = drizzle(sqlite, { schema });

  // Create tables
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS knowledge_bases (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      embedding_model TEXT DEFAULT 'text-embedding-3-small',
      document_count INTEGER DEFAULT 0,
      storage_size INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      knowledge_base_id TEXT NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
      file_name TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_hash TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      chunk_count INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS document_chunks (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      knowledge_base_id TEXT NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
      chunk_index INTEGER NOT NULL,
      content TEXT NOT NULL,
      token_count INTEGER DEFAULT 0,
      metadata TEXT DEFAULT '{}',
      lance_row_id TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS writing_projects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      writing_type TEXT NOT NULL,
      target_words INTEGER DEFAULT 2000,
      style TEXT DEFAULT 'formal',
      knowledge_base_id TEXT,
      status TEXT DEFAULT 'draft',
      plan TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS writing_versions (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES writing_projects(id) ON DELETE CASCADE,
      version_number INTEGER NOT NULL,
      content TEXT NOT NULL,
      word_count INTEGER DEFAULT 0,
      change_summary TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  return dbInstance;
}

export function getDb(): ReturnType<typeof drizzle> {
  if (!dbInstance) throw new Error('Database not initialized');
  return dbInstance;
}
```

---

### Task 8: 实现主进程安全存储 (Keychain)

**Files:**
- Create: `apps/desktop/src/main/services/keychain.ts`

- [ ] **Step 1: 实现 keychain service**

```typescript
// apps/desktop/src/main/services/keychain.ts
import { safeStorage } from 'electron';
import { getDb } from '../db/index.js';
import { settings } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const API_KEY_PREFIX = 'apikey_encrypted_';

function isEncryptionAvailable(): boolean {
  return safeStorage.isEncryptionAvailable();
}

export const keychain = {
  async storeApiKey(modelConfig: { provider: string; baseUrl: string; apiKey: string; writingModel: string; embeddingModel: string }): Promise<void> {
    const db = getDb();

    if (isEncryptionAvailable()) {
      const encrypted = safeStorage.encryptString(modelConfig.apiKey);
      const encoded = encrypted.toString('base64');

      await db.insert(settings).values({
        key: `${API_KEY_PREFIX}data`,
        value: encoded,
      }).onConflictDoUpdate({ target: settings.key, set: { value: encoded } });
    }

    await db.insert(settings).values({ key: 'provider', value: modelConfig.provider })
      .onConflictDoUpdate({ target: settings.key, set: { value: modelConfig.provider } });
    await db.insert(settings).values({ key: 'base_url', value: modelConfig.baseUrl })
      .onConflictDoUpdate({ target: settings.key, set: { value: modelConfig.baseUrl } });
    await db.insert(settings).values({ key: 'writing_model', value: modelConfig.writingModel })
      .onConflictDoUpdate({ target: settings.key, set: { value: modelConfig.writingModel } });
    await db.insert(settings).values({ key: 'embedding_model', value: modelConfig.embeddingModel })
      .onConflictDoUpdate({ target: settings.key, set: { value: modelConfig.embeddingModel } });
  },

  async getApiKey(): Promise<{ provider: string; baseUrl: string; apiKey: string; writingModel: string; embeddingModel: string } | null> {
    const db = getDb();

    const rows = await db.select().from(settings);
    const map = new Map(rows.map((r) => [r.key, r.value]));

    const provider = map.get('provider');
    const baseUrl = map.get('base_url');
    const writingModel = map.get('writing_model');
    const embeddingModel = map.get('embedding_model');

    if (!provider || !baseUrl) return null;

    let apiKey = '';
    const encryptedB64 = map.get(`${API_KEY_PREFIX}data`);
    if (encryptedB64 && isEncryptionAvailable()) {
      const buffer = Buffer.from(encryptedB64, 'base64');
      apiKey = safeStorage.decryptString(buffer);
    }

    return { provider, baseUrl, apiKey, writingModel: writingModel || 'gpt-4o', embeddingModel: embeddingModel || 'text-embedding-3-small' };
  },
};
```

---

### Task 9: 实现主进程文件服务

**Files:**
- Create: `apps/desktop/src/main/services/file-service.ts`

- [ ] **Step 1: 实现 file-service**

```typescript
// apps/desktop/src/main/services/file-service.ts
import { app, dialog } from 'electron';
import { join } from 'node:path';
import { copyFileSync, createHash, existsSync, mkdirSync } from 'node:fs';
import { APP_DATA_DIR } from '@app/core';

export async function selectAndCopyDocs(kbId: string): Promise<{ fileName: string; filePath: string; fileType: string; fileHash: string } | null> {
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: '文档', extensions: ['pdf', 'docx', 'txt', 'md'] },
    ],
  });

  if (result.canceled || result.filePaths.length === 0) return null;

  const sourcePath = result.filePaths[0];
  const fileName = sourcePath.split(/[/\\]/).pop() || 'untitled';
  const ext = fileName.split('.').pop()?.toLowerCase() || 'txt';
  const fileType = ['pdf', 'docx', 'txt', 'md'].includes(ext) ? ext : 'txt';

  // Compute hash
  const { readFileSync } = await import('node:fs');
  const buffer = readFileSync(sourcePath);
  const hash = createHash('sha256').update(buffer).digest('hex');

  // Copy to app data
  const userDataPath = app.getPath('userData');
  const destDir = join(userDataPath, APP_DATA_DIR, 'documents', kbId);
  mkdirSync(destDir, { recursive: true });
  const destPath = join(destDir, `${hash}.${ext}`);
  if (!existsSync(destPath)) {
    copyFileSync(sourcePath, destPath);
  }

  return { fileName, filePath: destPath, fileType, fileHash: hash };
}
```

---

### Task 10: 实现主进程 IPC handlers（知识库 + 设置）

**Files:**
- Create: `apps/desktop/src/main/ipc/knowledge.ts`
- Create: `apps/desktop/src/main/ipc/settings.ts`

- [ ] **Step 1: 实现 knowledge IPC handlers**

```typescript
// apps/desktop/src/main/ipc/knowledge.ts
import { ipcMain, BrowserWindow } from 'electron';
import { IpcChannel } from '@app/core';
import { getDb } from '../db/index.js';
import { knowledgeBases, documents, documentChunks } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { selectAndCopyDocs } from '../services/file-service.js';
import { parseDocument, chunkText, VectorStore } from '@app/knowledge';
import { embedTexts } from '@app/ai/embedding';
import { createOpenAICompatible, getEmbeddingModel } from '@app/ai';
import { keychain } from '../services/keychain.js';
import { join } from 'node:path';
import { app } from 'electron';
import { APP_DATA_DIR } from '@app/core';

const vectorStores = new Map<string, VectorStore>();

function getVectorStorePath(): string {
  return join(app.getPath('userData'), APP_DATA_DIR, 'lancedb');
}

async function getVectorStore(): Promise<VectorStore> {
  const storePath = getVectorStorePath();
  if (!vectorStores.has(storePath)) {
    const store = new VectorStore(storePath);
    await store.connect();
    vectorStores.set(storePath, store);
  }
  return vectorStores.get(storePath)!;
}

export function registerKnowledgeIpc(): void {
  // List
  ipcMain.handle(IpcChannel.KB_LIST, async () => {
    const db = getDb();
    return db.select().from(knowledgeBases).all();
  });

  // Create
  ipcMain.handle(IpcChannel.KB_CREATE, async (_, name: string, description: string) => {
    const db = getDb();
    const id = randomUUID();
    const now = new Date().toISOString();
    await db.insert(knowledgeBases).values({ id, name, description, createdAt: now, updatedAt: now });
    const store = await getVectorStore();
    await store.createTable(id);
    return db.select().from(knowledgeBases).where(eq(knowledgeBases.id, id)).get();
  });

  // Delete
  ipcMain.handle(IpcChannel.KB_DELETE, async (_, id: string) => {
    const db = getDb();
    const store = await getVectorStore();
    await store.deleteTable(id);
    await db.delete(documents).where(eq(documents.knowledgeBaseId, id));
    await db.delete(knowledgeBases).where(eq(knowledgeBases.id, id));
  });

  // List documents
  ipcMain.handle(IpcChannel.KB_DOC_LIST, async (_, kbId: string) => {
    const db = getDb();
    return db.select().from(documents).where(eq(documents.knowledgeBaseId, kbId)).all();
  });

  // Delete document
  ipcMain.handle(IpcChannel.KB_DOC_DELETE, async (_, docId: string) => {
    const db = getDb();
    await db.delete(documentChunks).where(eq(documentChunks.documentId, docId));
    await db.delete(documents).where(eq(documents.id, docId));
  });

  // Upload
  ipcMain.handle(IpcChannel.KB_UPLOAD, async (event, kbId: string) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) throw new Error('No window');

    const fileInfo = await selectAndCopyDocs(kbId);
    if (!fileInfo) return null;

    const db = getDb();
    const docId = randomUUID();
    const now = new Date().toISOString();

    // Insert document record
    await db.insert(documents).values({
      id: docId, knowledgeBaseId: kbId,
      fileName: fileInfo.fileName, fileType: fileInfo.fileType,
      filePath: fileInfo.filePath, fileHash: fileInfo.fileHash,
      status: 'parsing', createdAt: now, updatedAt: now,
    });

    // Parse
    const text = await parseDocument({
      id: docId, knowledgeBaseId: kbId,
      fileName: fileInfo.fileName, fileType: fileInfo.fileType as 'pdf' | 'docx' | 'txt' | 'md',
      filePath: fileInfo.filePath, fileHash: fileInfo.fileHash,
      status: 'parsing', chunkCount: 0, createdAt: now, updatedAt: now,
    });

    // Chunk
    win.webContents.send(IpcChannel.KB_UPLOAD_PROGRESS, { documentId: docId, fileName: fileInfo.fileName, stage: 'chunking', progress: 30, totalChunks: 0, completedChunks: 0 });
    const chunks = chunkText({ content: text, metadata: { heading: fileInfo.fileName } });

    // Embed
    win.webContents.send(IpcChannel.KB_UPLOAD_PROGRESS, { documentId: docId, fileName: fileInfo.fileName, stage: 'embedding', progress: 50, totalChunks: chunks.length, completedChunks: 0 });

    const apiConfig = await keychain.getApiKey();
    if (!apiConfig) throw new Error('API Key not configured');

    const provider = createOpenAICompatible({ baseUrl: apiConfig.baseUrl, apiKey: apiConfig.apiKey });
    const embedModel = getEmbeddingModel(provider, apiConfig.embeddingModel);

    const store = await getVectorStore();
    const vectors: import('@app/knowledge').VectorRecord[] = [];

    for (let i = 0; i < chunks.length; i += 20) {
      const batch = chunks.slice(i, i + 20);
      const texts = batch.map((c) => c.text);
      const embeddings = await embedTexts(embedModel, texts);

      for (let j = 0; j < batch.length; j++) {
        const chunk = batch[j];
        const chunkId = randomUUID();

        await db.insert(documentChunks).values({
          id: chunkId, documentId: docId, knowledgeBaseId: kbId,
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
        documentId: docId, fileName: fileInfo.fileName,
        stage: 'embedding', progress: 50 + Math.round(((i + batch.length) / chunks.length) * 50),
        totalChunks: chunks.length, completedChunks: i + batch.length,
      });
    }

    await store.insert(kbId, vectors);

    // Update document status
    await db.update(documents).set({ status: 'ready', chunkCount: chunks.length, updatedAt: new Date().toISOString() }).where(eq(documents.id, docId));
    await db.update(knowledgeBases).set({ documentCount: chunks.length, updatedAt: new Date().toISOString() }).where(eq(knowledgeBases.id, kbId));

    return db.select().from(documents).where(eq(documents.id, docId)).get();
  });

  // Search
  ipcMain.handle(IpcChannel.KB_SEARCH, async (_, kbId: string, query: string) => {
    const apiConfig = await keychain.getApiKey();
    if (!apiConfig) throw new Error('API Key not configured');
    const provider = createOpenAICompatible({ baseUrl: apiConfig.baseUrl, apiKey: apiConfig.apiKey });
    const embedModel = getEmbeddingModel(provider, apiConfig.embeddingModel);
    const store = await getVectorStore();
    const { Retriever } = await import('@app/knowledge');
    const retriever = new Retriever(store, embedModel);
    return retriever.search(kbId, query, 5);
  });
}
```

- [ ] **Step 2: 实现 settings IPC handlers**

```typescript
// apps/desktop/src/main/ipc/settings.ts
import { ipcMain } from 'electron';
import { IpcChannel } from '@app/core';
import { getDb } from '../db/index.js';
import { settings } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { keychain } from '../services/keychain.js';
import { testConnection } from '@app/ai';

export function registerSettingsIpc(): void {
  ipcMain.handle(IpcChannel.SETTINGS_GET, async (_, key: string) => {
    const db = getDb();
    const row = await db.select().from(settings).where(eq(settings.key, key)).get();
    return row?.value ?? null;
  });

  ipcMain.handle(IpcChannel.SETTINGS_SET, async (_, key: string, value: string) => {
    const db = getDb();
    await db.insert(settings).values({ key, value }).onConflictDoUpdate({ target: settings.key, set: { value } });
  });

  ipcMain.handle(IpcChannel.APIKEY_SET, async (_, config: { provider: string; baseUrl: string; apiKey: string; writingModel: string; embeddingModel: string }) => {
    await keychain.storeApiKey(config);
    return { success: true };
  });

  ipcMain.handle(IpcChannel.APIKEY_TEST, async (_, config: { baseUrl: string; apiKey: string; writingModel: string }) => {
    return testConnection(config.baseUrl, config.apiKey, config.writingModel);
  });
}
```

---

### Task 11: 实现主进程 IPC handlers（写作 + 版本 + 导出）

**Files:**
- Create: `apps/desktop/src/main/ipc/writing.ts`
- Create: `apps/desktop/src/main/ipc/export.ts`

- [ ] **Step 1: 实现 writing IPC handlers**

```typescript
// apps/desktop/src/main/ipc/writing.ts
import { ipcMain, BrowserWindow } from 'electron';
import { IpcChannel } from '@app/core';
import type { WritingRequest } from '@app/core';
import { getDb } from '../db/index.js';
import { writingProjects, writingVersions } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { keychain } from '../services/keychain.js';
import { createOpenAICompatible, getWritingModel, getEmbeddingModel } from '@app/ai';
import { runPipeline } from '@app/agent';
import type { PipelineCallbacks } from '@app/agent';
import { VectorStore, Retriever } from '@app/knowledge';
import { join } from 'node:path';
import { app } from 'electron';
import { APP_DATA_DIR } from '@app/core';
import { tokenCounter } from '@app/ai/token-counter';

let activePipeline: { cancel: () => void } | null = null;

export function registerWritingIpc(): void {
  ipcMain.handle(IpcChannel.WRITING_START, async (event, request: WritingRequest) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) throw new Error('No window');

    const db = getDb();
    const projectId = randomUUID();
    const now = new Date().toISOString();

    await db.insert(writingProjects).values({
      id: projectId, title: request.topic,
      writingType: request.type, targetWords: request.targetWords,
      style: request.style, knowledgeBaseId: request.knowledgeBaseId || null,
      status: 'planning', createdAt: now, updatedAt: now,
    });

    const apiConfig = await keychain.getApiKey();
    if (!apiConfig) {
      win.webContents.send(IpcChannel.WRITING_ERROR, '请先配置 API Key');
      return;
    }

    const provider = createOpenAICompatible({ baseUrl: apiConfig.baseUrl, apiKey: apiConfig.apiKey });
    const writingModel = getWritingModel(provider, apiConfig.writingModel);
    const embedModel = getEmbeddingModel(provider, apiConfig.embeddingModel);

    let retriever: Retriever | null = null;
    if (request.knowledgeBaseId) {
      const storePath = join(app.getPath('userData'), APP_DATA_DIR, 'lancedb');
      const store = new VectorStore(storePath);
      await store.connect();
      retriever = new Retriever(store, embedModel);
    }

    const callbacks: PipelineCallbacks = {
      onPlanReady: async (plan) => {
        await db.update(writingProjects).set({ plan: JSON.stringify(plan), status: 'writing', updatedAt: new Date().toISOString() }).where(eq(writingProjects.id, projectId));
        win.webContents.send(IpcChannel.WRITING_PLAN, plan);
      },
      onSectionStart: (index, title) => {
        win.webContents.send(IpcChannel.WRITING_PROGRESS, { sectionIndex: index, title, status: 'writing' });
      },
      onSectionWriting: (section) => {
        win.webContents.send(IpcChannel.WRITING_SECTION, section);
      },
      onSectionFactCheck: (index, content) => {
        win.webContents.send(IpcChannel.WRITING_PROGRESS, { sectionIndex: index, status: 'fact-checking' });
      },
      onSectionPolish: (index, content) => {
        win.webContents.send(IpcChannel.WRITING_PROGRESS, { sectionIndex: index, status: 'polishing' });
      },
      onProgress: (percent) => {
        win.webContents.send(IpcChannel.WRITING_PROGRESS, { percent });
      },
      onError: (error) => {
        win.webContents.send(IpcChannel.WRITING_ERROR, error.message);
      },
    };

    try {
      const fullText = await runPipeline(request, writingModel, retriever, callbacks);

      // Save version
      const versions = await db.select().from(writingVersions).where(eq(writingVersions.projectId, projectId)).all();
      const versionNumber = versions.length + 1;
      const wordCount = tokenCounter.countWords(fullText);

      await db.insert(writingVersions).values({
        id: randomUUID(), projectId, versionNumber,
        content: fullText, wordCount,
        changeSummary: '初稿',
        createdAt: new Date().toISOString(),
      });

      await db.update(writingProjects).set({ status: 'done', updatedAt: new Date().toISOString() }).where(eq(writingProjects.id, projectId));

      win.webContents.send(IpcChannel.WRITING_DONE, { projectId, content: fullText, wordCount });
    } catch (e) {
      win.webContents.send(IpcChannel.WRITING_ERROR, String(e));
      await db.update(writingProjects).set({ status: 'error', updatedAt: new Date().toISOString() }).where(eq(writingProjects.id, projectId));
    }
  });

  ipcMain.handle(IpcChannel.WRITING_CANCEL, async () => {
    activePipeline?.cancel();
  });

  // Version list
  ipcMain.handle(IpcChannel.VERSION_LIST, async (_, projectId: string) => {
    const db = getDb();
    return db.select().from(writingVersions).where(eq(writingVersions.projectId, projectId)).orderBy(desc(writingVersions.versionNumber)).all();
  });

  // Version get
  ipcMain.handle(IpcChannel.VERSION_GET, async (_, versionId: string) => {
    const db = getDb();
    return db.select().from(writingVersions).where(eq(writingVersions.id, versionId)).get();
  });
}
```

- [ ] **Step 2: 实现 export IPC handlers**

```typescript
// apps/desktop/src/main/ipc/export.ts
import { ipcMain, dialog, BrowserWindow } from 'electron';
import { IpcChannel } from '@app/core';
import { getDb } from '../db/index.js';
import { writingVersions } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { writeFileSync } from 'node:fs';

export function registerExportIpc(): void {
  ipcMain.handle(IpcChannel.EXPORT_MD, async (event, projectId: string) => {
    const db = getDb();
    const version = await db.select().from(writingVersions).where(eq(writingVersions.projectId, projectId)).orderBy(desc(writingVersions.versionNumber)).limit(1).get();
    if (!version) throw new Error('No version found');

    const win = BrowserWindow.fromWebContents(event.sender);
    const result = await dialog.showSaveDialog(win!, {
      defaultPath: `document.md`,
      filters: [{ name: 'Markdown', extensions: ['md'] }],
    });

    if (!result.canceled && result.filePath) {
      writeFileSync(result.filePath, version.content, 'utf-8');
      return { success: true, path: result.filePath };
    }
    return { success: false };
  });

  ipcMain.handle(IpcChannel.EXPORT_DOCX, async (event, projectId: string) => {
    const db = getDb();
    const version = await db.select().from(writingVersions).where(eq(writingVersions.projectId, projectId)).orderBy(desc(writingVersions.versionNumber)).limit(1).get();
    if (!version) throw new Error('No version found');

    const win = BrowserWindow.fromWebContents(event.sender);
    const result = await dialog.showSaveDialog(win!, {
      defaultPath: `document.docx`,
      filters: [{ name: 'Word', extensions: ['docx'] }],
    });

    if (!result.canceled && result.filePath) {
      // Use native markdown-to-docx via a simple HTML-based approach
      const htmlContent = markdownToHtml(version.content);
      const { Document, Packer, Paragraph, TextRun } = await import('docx');
      const doc = new Document({
        sections: [{
          properties: {},
          children: htmlContent.split('\n').filter(Boolean).map((line) =>
            new Paragraph({ children: [new TextRun(line)] }),
          ),
        }],
      });
      const buffer = await Packer.toBuffer(doc);
      writeFileSync(result.filePath, buffer);
      return { success: true, path: result.filePath };
    }
    return { success: false };
  });
}

function markdownToHtml(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(.+)$/gm, (_, t) => t.startsWith('<') ? t : `<p>${t}</p>`);
}
```

- [ ] **Step 3: 更新 main/index.ts 注册 IPC**

```typescript
// 在 apps/desktop/src/main/index.ts 的 app.whenReady() 中添加
import { registerKnowledgeIpc } from './ipc/knowledge.js';
import { registerSettingsIpc } from './ipc/settings.js';
import { registerWritingIpc } from './ipc/writing.js';
import { registerExportIpc } from './ipc/export.js';

// 在 createWindow() 调用前添加:
registerKnowledgeIpc();
registerSettingsIpc();
registerWritingIpc();
registerExportIpc();
```

---

### Task 12: 搭建 React UI 框架（路由 + Tailwind + shadcn/ui）

**Files:**
- Modify: `apps/desktop/src/renderer/App.tsx`
- Create: `apps/desktop/src/renderer/components/ui/sidebar.tsx`
- Create: `apps/desktop/src/renderer/lib/utils.ts`
- Create: `apps/desktop/src/renderer/lib/api.ts`

- [ ] **Step 1: 安装前端依赖**

```bash
cd apps/desktop
pnpm add react-router-dom zustand @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder @radix-ui/react-dialog @radix-ui/react-select @radix-ui/react-slot class-variance-authority clsx tailwind-merge lucide-react
cd ../..
pnpm install
```

- [ ] **Step 2: 创建 utils**

```typescript
// apps/desktop/src/renderer/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 3: 创建 API client**

```typescript
// apps/desktop/src/renderer/lib/api.ts
import type { ElectronApi } from '../../preload/index';

const w = window as unknown as { api: ElectronApi };

export const api = {
  // Knowledge base
  listKnowledgeBases: () => w.api.listKnowledgeBases(),
  createKnowledgeBase: (name: string, description: string) => w.api.createKnowledgeBase(name, description),
  deleteKnowledgeBase: (id: string) => w.api.deleteKnowledgeBase(id),
  listDocuments: (kbId: string) => w.api.listDocuments(kbId),
  uploadDocument: (kbId: string) => w.api.uploadDocument(kbId),
  onUploadProgress: (cb: (p: unknown) => void) => w.api.onUploadProgress(cb),
  searchKnowledgeBase: (kbId: string, query: string) => w.api.searchKnowledgeBase(kbId, query),

  // Writing
  startWriting: (req: unknown) => w.api.startWriting(req),
  cancelWriting: () => w.api.cancelWriting(),
  onWritingPlan: (cb: (plan: unknown) => void) => w.api.onWritingPlan(cb),
  onWritingSection: (cb: (section: unknown) => void) => w.api.onWritingSection(cb),
  onWritingProgress: (cb: (p: unknown) => void) => w.api.onWritingProgress(cb),
  onWritingDone: (cb: (result: unknown) => void) => w.api.onWritingDone(cb),
  onWritingError: (cb: (error: string) => void) => w.api.onWritingError(cb),
  retrySection: (projectId: string, sectionIndex: number) => w.api.retrySection(projectId, sectionIndex),

  // Projects
  listProjects: () => w.api.listProjects(),

  // Versions
  listVersions: (projectId: string) => w.api.listVersions(projectId),
  getVersion: (versionId: string) => w.api.getVersion(versionId),
  restoreVersion: (versionId: string) => w.api.restoreVersion(versionId),

  // Export
  exportMarkdown: (projectId: string) => w.api.exportMarkdown(projectId),
  exportDocx: (projectId: string) => w.api.exportDocx(projectId),

  // Settings
  getSetting: (key: string) => w.api.getSetting(key),
  setSetting: (key: string, value: string) => w.api.setSetting(key, value),
  setApiKey: (config: unknown) => w.api.setApiKey(config),
  testApiConnection: (config: unknown) => w.api.testApiConnection(config),
};
```

- [ ] **Step 4: 创建 Sidebar 组件**

```typescript
// apps/desktop/src/renderer/components/ui/sidebar.tsx
import { NavLink } from 'react-router-dom';
import { PenLine, Library, History, Settings } from 'lucide-react';

const navItems = [
  { to: '/', label: '写作', icon: PenLine },
  { to: '/knowledge', label: '知识库', icon: Library },
  { to: '/history', label: '历史', icon: History },
  { to: '/settings', label: '设置', icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="w-16 h-screen bg-slate-900 flex flex-col items-center py-4 gap-1">
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `w-12 h-12 flex flex-col items-center justify-center rounded-lg transition-colors ${
              isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`
          }
        >
          <Icon className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">{label}</span>
        </NavLink>
      ))}
    </aside>
  );
}
```

- [ ] **Step 5: 更新 App.tsx 加入路由**

```typescript
// apps/desktop/src/renderer/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/ui/sidebar';

const WritingPage = () => <div className="p-8">Writing Page</div>;
const KnowledgePage = () => <div className="p-8">Knowledge Page</div>;
const HistoryPage = () => <div className="p-8">History Page</div>;
const SettingsPage = () => <div className="p-8">Settings Page</div>;

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-white">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<WritingPage />} />
            <Route path="/knowledge" element={<KnowledgePage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
```

---

### Task 13: 创建设置页面 + Store + API Key 配置

**Files:**
- Create: `apps/desktop/src/renderer/store/settings.ts`
- Create: `apps/desktop/src/renderer/store/writing.ts`
- Create: `apps/desktop/src/renderer/store/knowledge.ts`
- Create: `apps/desktop/src/renderer/pages/Settings.tsx`

- [ ] **Step 1: 创建设置 store**

```typescript
// apps/desktop/src/renderer/store/settings.ts
import { create } from 'zustand';
import { api } from '../lib/api';

interface SettingsState {
  provider: string;
  baseUrl: string;
  writingModel: string;
  embeddingModel: string;
  apiKeySet: boolean;
  testing: boolean;
  testResult: { success: boolean; latencyMs: number; error?: string } | null;
  setConfig: (config: { provider: string; baseUrl: string; writingModel: string; embeddingModel: string }) => void;
  saveApiKey: (apiKey: string) => Promise<void>;
  testConnection: () => Promise<void>;
  loadSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  provider: 'openai',
  baseUrl: 'https://api.openai.com/v1',
  writingModel: 'gpt-4o',
  embeddingModel: 'text-embedding-3-small',
  apiKeySet: false,
  testing: false,
  testResult: null,

  setConfig: (config) => set(config),

  saveApiKey: async (apiKey: string) => {
    const { provider, baseUrl, writingModel, embeddingModel } = get();
    await api.setApiKey({ provider, baseUrl, apiKey, writingModel, embeddingModel });
    set({ apiKeySet: true });
  },

  testConnection: async () => {
    set({ testing: true, testResult: null });
    const { baseUrl, writingModel } = get();
    const key = await api.getSetting('apikey_encrypted_data');
    // Use stored key for testing — the actual API key is only on main process
    // We pass config and main process reads the stored key
    const result = await api.testApiConnection({ baseUrl, apiKey: '', writingModel });
    set({ testing: false, testResult: result as SettingsState['testResult'] });
  },

  loadSettings: async () => {
    const provider = await api.getSetting('provider');
    const baseUrl = await api.getSetting('base_url');
    const writingModel = await api.getSetting('writing_model');
    const embeddingModel = await api.getSetting('embedding_model');
    if (provider) set({
      provider, baseUrl: baseUrl || 'https://api.openai.com/v1',
      writingModel: writingModel || 'gpt-4o',
      embeddingModel: embeddingModel || 'text-embedding-3-small',
      apiKeySet: true,
    });
  },
}));
```

- [ ] **Step 2: 创建 writing store**

```typescript
// apps/desktop/src/renderer/store/writing.ts
import { create } from 'zustand';
import { api } from '../lib/api';
import type { WritingPlan, SectionOutput, WritingType, Style } from '@app/core';

interface WritingState {
  topic: string;
  type: WritingType;
  style: Style;
  targetWords: number;
  knowledgeBaseId: string | null;
  status: 'idle' | 'planning' | 'writing' | 'polishing' | 'done' | 'error';
  plan: WritingPlan | null;
  sections: SectionOutput[];
  currentSectionIndex: number;
  progress: number;
  projectId: string | null;
  error: string | null;
  fullText: string;
  setForm: (data: Partial<Pick<WritingState, 'topic' | 'type' | 'style' | 'targetWords' | 'knowledgeBaseId'>>) => void;
  startWriting: () => Promise<void>;
  reset: () => void;
}

export const useWritingStore = create<WritingState>((set, get) => ({
  topic: '',
  type: 'summary',
  style: 'formal',
  targetWords: 2000,
  knowledgeBaseId: null,
  status: 'idle',
  plan: null,
  sections: [],
  currentSectionIndex: -1,
  progress: 0,
  projectId: null,
  error: null,
  fullText: '',

  setForm: (data) => set(data),

  startWriting: async () => {
    const { topic, type, style, targetWords, knowledgeBaseId } = get();
    if (!topic.trim()) return;

    set({ status: 'planning', sections: [], plan: null, error: null, fullText: '' });

    api.onWritingPlan((plan) => {
      set({ plan: plan as WritingPlan, status: 'writing' });
    });

    api.onWritingSection((section) => {
      const s = section as SectionOutput;
      set((state) => {
        const sections = [...state.sections];
        const existing = sections.findIndex((x) => x.sectionIndex === s.sectionIndex);
        if (existing >= 0) sections[existing] = s;
        else sections.push(s);
        return { sections, currentSectionIndex: s.sectionIndex };
      });
    });

    api.onWritingProgress((p: unknown) => {
      const progress = p as { percent?: number };
      if (progress.percent) set({ progress: progress.percent });
    });

    api.onWritingDone((result) => {
      const r = result as { projectId: string; content: string; wordCount: number };
      set({ status: 'done', projectId: r.projectId, fullText: r.content, progress: 100 });
    });

    api.onWritingError((error) => {
      set({ status: 'error', error });
    });

    await api.startWriting({ topic, type, style, targetWords, knowledgeBaseId });
  },

  reset: () => set({
    status: 'idle', plan: null, sections: [], currentSectionIndex: -1,
    progress: 0, projectId: null, error: null, fullText: '',
  }),
}));
```

- [ ] **Step 3: 创建 knowledge store**

```typescript
// apps/desktop/src/renderer/store/knowledge.ts
import { create } from 'zustand';
import { api } from '../lib/api';
import type { KnowledgeBase, Document, UploadProgress } from '@app/core';

interface KnowledgeState {
  bases: KnowledgeBase[];
  currentBase: KnowledgeBase | null;
  documents: Document[];
  uploadProgress: UploadProgress | null;
  loadBases: () => Promise<void>;
  createBase: (name: string, description: string) => Promise<void>;
  deleteBase: (id: string) => Promise<void>;
  loadDocuments: (kbId: string) => Promise<void>;
  uploadDocument: (kbId: string) => Promise<void>;
  setCurrentBase: (base: KnowledgeBase | null) => void;
}

export const useKnowledgeStore = create<KnowledgeState>((set) => ({
  bases: [],
  currentBase: null,
  documents: [],
  uploadProgress: null,

  loadBases: async () => {
    const bases = await api.listKnowledgeBases();
    set({ bases: bases as KnowledgeBase[] });
  },

  createBase: async (name: string, description: string) => {
    await api.createKnowledgeBase(name, description);
    const bases = await api.listKnowledgeBases();
    set({ bases: bases as KnowledgeBase[] });
  },

  deleteBase: async (id: string) => {
    await api.deleteKnowledgeBase(id);
    const bases = await api.listKnowledgeBases();
    set({ bases: bases as KnowledgeBase[] });
  },

  loadDocuments: async (kbId: string) => {
    const docs = await api.listDocuments(kbId);
    set({ documents: docs as Document[] });
  },

  uploadDocument: async (kbId: string) => {
    api.onUploadProgress((p) => set({ uploadProgress: p as UploadProgress }));
    await api.uploadDocument(kbId);
    const docs = await api.listDocuments(kbId);
    set({ documents: docs as Document[], uploadProgress: null });
  },

  setCurrentBase: (base) => set({ currentBase: base }),
}));
```

- [ ] **Step 4: 创建设置页面**

```typescript
// apps/desktop/src/renderer/pages/Settings.tsx
import { useEffect, useState } from 'react';
import { useSettingsStore } from '../store/settings';

export default function SettingsPage() {
  const { provider, baseUrl, writingModel, embeddingModel, apiKeySet, testing, testResult, setConfig, saveApiKey, testConnection, loadSettings } = useSettingsStore();
  const [apiKey, setApiKey] = useState('');

  useEffect(() => { loadSettings(); }, []);

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-8">设置</h1>

      <div className="space-y-6">
        <section>
          <h2 className="text-lg font-semibold text-slate-700 mb-4">API Key 配置</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-600 mb-1">Base URL</label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setConfig({ provider, baseUrl: e.target.value, writingModel, embeddingModel })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://api.openai.com/v1"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={apiKeySet ? '已保存（输入新 Key 覆盖）' : 'sk-...'}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">写作模型</label>
                <input
                  type="text"
                  value={writingModel}
                  onChange={(e) => setConfig({ provider, baseUrl, writingModel: e.target.value, embeddingModel })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Embedding 模型</label>
                <input
                  type="text"
                  value={embeddingModel}
                  onChange={(e) => setConfig({ provider, baseUrl, writingModel, embeddingModel: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => apiKey && saveApiKey(apiKey)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
              >
                保存
              </button>
              <button
                onClick={testConnection}
                disabled={testing || !apiKeySet}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50 disabled:opacity-50"
              >
                {testing ? '测试中...' : '测试连接'}
              </button>
            </div>
            {testResult && (
              <div className={`text-sm px-3 py-2 rounded ${testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {testResult.success
                  ? `连接成功，延迟 ${testResult.latencyMs}ms`
                  : `连接失败：${testResult.error}`}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
```

---

### Task 14: 创建写作工作台页面

**Files:**
- Create: `apps/desktop/src/renderer/pages/Writing.tsx`
- Create: `apps/desktop/src/renderer/components/writing/WritingForm.tsx`
- Create: `apps/desktop/src/renderer/components/writing/WritingPlanPanel.tsx`
- Create: `apps/desktop/src/renderer/components/writing/WritingOutput.tsx`

- [ ] **Step 1: WritingForm 组件**

```typescript
// apps/desktop/src/renderer/components/writing/WritingForm.tsx
import { WRITING_TYPE_LABELS, STYLE_LABELS, WORD_COUNT_OPTIONS } from '@app/core';
import type { WritingType, Style } from '@app/core';
import { useWritingStore } from '../../store/writing';
import { useKnowledgeStore } from '../../store/knowledge';
import { useEffect } from 'react';

export function WritingForm({ onStart }: { onStart: () => void }) {
  const { topic, type, style, targetWords, knowledgeBaseId, setForm, status } = useWritingStore();
  const { bases, loadBases } = useKnowledgeStore();
  const isRunning = status !== 'idle' && status !== 'done' && status !== 'error';

  useEffect(() => { loadBases(); }, []);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-800 mb-8">新建写作</h1>

      <div className="space-y-5">
        <div>
          <label className="block text-lg font-medium text-slate-700 mb-2">你要写什么？</label>
          <textarea
            value={topic}
            onChange={(e) => setForm({ topic: e.target.value })}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg text-base resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="例如：写一份2024年Q2季度工作总结，包含项目进展、问题反思和下季度规划..."
            disabled={isRunning}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-600 mb-1">写作类型</label>
            <select
              value={type}
              onChange={(e) => setForm({ type: e.target.value as WritingType })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isRunning}
            >
              {Object.entries(WRITING_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">语言风格</label>
            <select
              value={style}
              onChange={(e) => setForm({ style: e.target.value as Style })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isRunning}
            >
              {Object.entries(STYLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-600 mb-1">篇幅</label>
            <select
              value={targetWords}
              onChange={(e) => setForm({ targetWords: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isRunning}
            >
              {WORD_COUNT_OPTIONS.map((opt) => (
                <option key={opt.label} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">使用知识库</label>
            <select
              value={knowledgeBaseId || ''}
              onChange={(e) => setForm({ knowledgeBaseId: e.target.value || null })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isRunning}
            >
              <option value="">不使用</option>
              {bases.map((kb) => (
                <option key={kb.id} value={kb.id}>{kb.name}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={onStart}
          disabled={!topic.trim() || isRunning}
          className="w-full py-3 bg-blue-600 text-white rounded-lg text-base font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isRunning ? '写作中...' : '开始写作'}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: WritingPlanPanel 组件**

```typescript
// apps/desktop/src/renderer/components/writing/WritingPlanPanel.tsx
import type { WritingPlan } from '@app/core';

export function WritingPlanPanel({ plan }: { plan: WritingPlan }) {
  return (
    <div className="bg-blue-50 rounded-lg p-4 mb-6">
      <h3 className="text-sm font-semibold text-blue-800 mb-2">写作计划</h3>
      <p className="text-sm text-blue-700 mb-1">目标：{plan.goal}</p>
      <p className="text-sm text-blue-700 mb-3">读者：{plan.audience}</p>
      <div className="space-y-1">
        {plan.sections.map((section, i) => (
          <div key={i} className="flex items-center gap-2 text-sm text-blue-600">
            <span className="w-6 h-6 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center text-xs font-medium">
              {i + 1}
            </span>
            <span>{section.title}</span>
            <span className="text-blue-400">~{section.targetWords}字</span>
            {section.needsRAG && <span className="text-xs bg-blue-200 px-1.5 py-0.5 rounded">需资料</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: WritingOutput 组件**

```typescript
// apps/desktop/src/renderer/components/writing/WritingOutput.tsx
import type { SectionOutput } from '@app/core';

export function WritingOutput({
  sections,
  currentSectionIndex,
  progress,
  fullText,
}: {
  sections: SectionOutput[];
  currentSectionIndex: number;
  progress: number;
  fullText: string;
}) {
  if (fullText) {
    return (
      <div className="prose max-w-none">
        {sections.map((section) => (
          <div key={section.sectionIndex} className="mb-6">
            <h2 className="text-xl font-bold text-slate-800 mb-2">{section.title}</h2>
            <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">{section.content}</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <div key={section.sectionIndex} className="mb-6">
          <h2 className="text-xl font-bold text-slate-800 mb-2">{section.title}</h2>
          <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">{section.content}</div>
          {section.sectionIndex === currentSectionIndex && (
            <span className="inline-block mt-2 text-sm text-blue-500 animate-pulse">写作中...</span>
          )}
        </div>
      ))}
      {sections.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="text-slate-400">等待 AI 生成...</div>
        </div>
      )}
      <div className="w-full bg-slate-200 rounded-full h-1.5">
        <div
          className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Writing 页面组合**

```typescript
// apps/desktop/src/renderer/pages/Writing.tsx
import { useWritingStore } from '../store/writing';
import { WritingForm } from '../components/writing/WritingForm';
import { WritingPlanPanel } from '../components/writing/WritingPlanPanel';
import { WritingOutput } from '../components/writing/WritingOutput';
import { api } from '../lib/api';

export default function WritingPage() {
  const { status, plan, sections, currentSectionIndex, progress, fullText, projectId, startWriting, reset } = useWritingStore();

  const handleStart = async () => {
    await startWriting();
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      {status === 'idle' && <WritingForm onStart={handleStart} />}

      {(status === 'planning' || status === 'writing' || status === 'polishing') && (
        <div className="flex gap-8">
          <div className="w-72 shrink-0">
            {plan && <WritingPlanPanel plan={plan} />}
            <div className="text-sm text-slate-500 mt-4">
              进度：{Math.round(progress)}%
            </div>
            <button
              onClick={reset}
              className="mt-4 px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50"
            >
              取消
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <WritingOutput
              sections={sections}
              currentSectionIndex={currentSectionIndex}
              progress={progress}
              fullText={fullText}
            />
          </div>
        </div>
      )}

      {status === 'done' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-slate-800">写作完成</h1>
            <div className="flex gap-3">
              <button
                onClick={() => projectId && api.exportMarkdown(projectId)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-700"
              >
                导出 Markdown
              </button>
              <button
                onClick={() => projectId && api.exportDocx(projectId)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                导出 Word
              </button>
              <button
                onClick={reset}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50"
              >
                新建写作
              </button>
            </div>
          </div>
          <WritingOutput
            sections={sections}
            currentSectionIndex={currentSectionIndex}
            progress={progress}
            fullText={fullText}
          />
        </div>
      )}

      {status === 'error' && (
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">写作出错，请重试</div>
          <button onClick={reset} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
            重新开始
          </button>
        </div>
      )}
    </div>
  );
}
```

---

### Task 15: 创建知识库页面

**Files:**
- Create: `apps/desktop/src/renderer/pages/Knowledge.tsx`
- Create: `apps/desktop/src/renderer/pages/KnowledgeDetail.tsx`
- Create: `apps/desktop/src/renderer/components/knowledge/KnowledgeCard.tsx`

- [ ] **Step 1: KnowledgeCard 组件**

```typescript
// apps/desktop/src/renderer/components/knowledge/KnowledgeCard.tsx
import type { KnowledgeBase } from '@app/core';
import { Folder, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function KnowledgeCard({ kb, onDelete }: { kb: KnowledgeBase; onDelete: (id: string) => void }) {
  return (
    <div className="border border-slate-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Folder className="w-8 h-8 text-blue-500" />
          <div>
            <h3 className="font-medium text-slate-800">{kb.name}</h3>
            <p className="text-sm text-slate-500 mt-0.5">{kb.description || '暂无描述'}</p>
          </div>
        </div>
        <button
          onClick={() => onDelete(kb.id)}
          className="text-xs text-red-400 hover:text-red-600"
        >
          删除
        </button>
      </div>
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
        <span className="text-xs text-slate-400">
          {kb.documentCount} 个文档 · {new Date(kb.updatedAt).toLocaleDateString('zh-CN')}
        </span>
        <Link
          to={`/knowledge/${kb.id}`}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
        >
          管理 <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Knowledge 列表页面**

```typescript
// apps/desktop/src/renderer/pages/Knowledge.tsx
import { useEffect, useState } from 'react';
import { useKnowledgeStore } from '../store/knowledge';
import { KnowledgeCard } from '../components/knowledge/KnowledgeCard';

export default function KnowledgePage() {
  const { bases, loadBases, createBase, deleteBase } = useKnowledgeStore();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => { loadBases(); }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    await createBase(name, description);
    setName('');
    setDescription('');
    setShowCreate(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-slate-800">知识库</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          + 新建知识库
        </button>
      </div>

      {showCreate && (
        <div className="mb-6 border border-slate-200 rounded-lg p-4 bg-slate-50">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm mb-2"
            placeholder="知识库名称"
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm mb-3"
            placeholder="简短描述（可选）"
          />
          <div className="flex gap-2">
            <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">创建</button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm">取消</button>
          </div>
        </div>
      )}

      <div className="grid gap-3">
        {bases.map((kb) => (
          <KnowledgeCard key={kb.id} kb={kb} onDelete={deleteBase} />
        ))}
        {bases.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            暂无知识库，点击上方按钮创建
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: KnowledgeDetail 页面**

```typescript
// apps/desktop/src/renderer/pages/KnowledgeDetail.tsx
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useKnowledgeStore } from '../store/knowledge';
import type { Document } from '@app/core';

const STATUS_LABELS: Record<string, string> = {
  pending: '等待中', parsing: '解析中', chunking: '切片中', embedding: '向量化中', ready: '就绪', error: '错误',
};

export default function KnowledgeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { bases, documents, uploadProgress, loadBases, setCurrentBase, loadDocuments, uploadDocument } = useKnowledgeStore();

  useEffect(() => {
    loadBases();
    if (id) loadDocuments(id);
  }, [id]);

  const kb = bases.find((b) => b.id === id);

  if (!kb) {
    return <div className="p-8 text-slate-400">知识库不存在</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <button onClick={() => navigate('/knowledge')} className="text-sm text-blue-600 mb-4 block">&larr; 返回</button>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">{kb.name}</h1>
      <p className="text-sm text-slate-500 mb-8">{kb.description}</p>

      <div className="mb-6">
        <button
          onClick={() => id && uploadDocument(id)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          上传文档
        </button>
      </div>

      {uploadProgress && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
          正在处理 {uploadProgress.fileName}: {uploadProgress.stage}
          {uploadProgress.totalChunks > 0 && ` (${uploadProgress.completedChunks}/${uploadProgress.totalChunks})`}
        </div>
      )}

      <div className="space-y-2">
        {documents.map((doc: Document) => (
          <div key={doc.id} className="flex items-center justify-between px-4 py-3 border border-slate-200 rounded-lg">
            <div>
              <span className="text-sm font-medium text-slate-700">{doc.fileName}</span>
              <span className="ml-3 text-xs text-slate-400">{doc.fileType.toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2 py-0.5 rounded ${
                doc.status === 'ready' ? 'bg-green-100 text-green-700' :
                doc.status === 'error' ? 'bg-red-100 text-red-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {STATUS_LABELS[doc.status] || doc.status}
              </span>
              <span className="text-xs text-slate-400">
                {doc.chunkCount} 切片
              </span>
            </div>
          </div>
        ))}
        {documents.length === 0 && !uploadProgress && (
          <div className="text-center py-12 text-slate-400">暂无文档，点击上传</div>
        )}
      </div>
    </div>
  );
}
```

---

### Task 16: 创建历史页面

**Files:**
- Create: `apps/desktop/src/renderer/pages/History.tsx`

- [ ] **Step 1: 历史页面实现**

```typescript
// apps/desktop/src/renderer/pages/History.tsx
import { useEffect, useState } from 'react';
import type { WritingProject } from '@app/core';
import { api } from '../lib/api';
import { WRITING_TYPE_LABELS } from '@app/core';

export default function HistoryPage() {
  const [projects, setProjects] = useState<WritingProject[]>([]);

  useEffect(() => {
    api.listProjects().then((ps) => setProjects(ps as WritingProject[]));
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-8">写作历史</h1>
      {projects.length === 0 ? (
        <div className="text-center py-12 text-slate-400">暂无写作记录</div>
      ) : (
        <div className="space-y-3">
          {projects.map((p) => (
            <div key={p.id} className="border border-slate-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-slate-800">{p.title}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-slate-400">{WRITING_TYPE_LABELS[p.writingType]}</span>
                    <span className="text-xs text-slate-400">{p.targetWords}字</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      p.status === 'done' ? 'bg-green-100 text-green-700' :
                      p.status === 'error' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>{p.status}</span>
                  </div>
                </div>
                <span className="text-xs text-slate-400">{new Date(p.createdAt).toLocaleString('zh-CN')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

### Task 17: 补齐缺失的 IPC 通道与页面整合

**Files:**
- Modify: `apps/desktop/src/preload/index.ts` (add project list API)
- Modify: `apps/desktop/src/main/ipc/writing.ts` (add project list handler)
- Modify: `apps/desktop/src/renderer/App.tsx` (use real pages)

- [ ] **Step 1: 添加 project list 到 preload**

在 `apps/desktop/src/preload/index.ts` 的 `api` 对象中添加：

```typescript
  // Projects (补充)
  listProjects: () => ipcRenderer.invoke('project:list'),
```

- [ ] **Step 2: 添加 project list handler 到 writing IPC**

在 `apps/desktop/src/main/ipc/writing.ts` 的 `registerWritingIpc` 中添加：

```typescript
  ipcMain.handle('project:list', async () => {
    const db = getDb();
    return db.select().from(writingProjects).orderBy(desc(writingProjects.createdAt)).all();
  });
```

- [ ] **Step 3: 更新 App.tsx 使用真实页面**

```typescript
// apps/desktop/src/renderer/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/ui/sidebar';
import WritingPage from './pages/Writing';
import KnowledgePage from './pages/Knowledge';
import KnowledgeDetailPage from './pages/KnowledgeDetail';
import HistoryPage from './pages/History';
import SettingsPage from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-white">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<WritingPage />} />
            <Route path="/knowledge" element={<KnowledgePage />} />
            <Route path="/knowledge/:id" element={<KnowledgeDetailPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
```

---

### Task 18: 首次启动验证与 Debug

- [ ] **Step 1: 安装所有依赖**

```bash
cd "/Users/knsrz/Documents/开源项目/极致写作"
pnpm install
```

- [ ] **Step 2: TypeScript 类型检查**

```bash
pnpm --filter @app/core typecheck
pnpm --filter @app/ai typecheck
pnpm --filter @app/knowledge typecheck
pnpm --filter @app/agent typecheck
pnpm --filter @app/desktop typecheck:node
```

- [ ] **Step 3: 启动 Electron 开发模式**

```bash
pnpm dev
```

Expected: Electron 窗口打开，显示"极致写作"首页，侧边栏有 4 个导航项。

- [ ] **Step 4: 手动验证核心流程**

1. 进入"设置" → 配置 API Key → 测试连接
2. 进入"知识库" → 新建知识库 → 上传 PDF
3. 进入"写作" → 输入主题 → 选择类型/风格/篇幅 → 开始写作
4. 验证：计划生成 → 分段输出 → 全文完成 → 导出 Markdown

---

### Task 19: 提交最终版本

- [ ] **Step 1: 最终提交**

```bash
git add -A
git commit -m "feat: complete Stage 1 MVP - writing app with RAG, agent pipeline, and Electron desktop UI"
```
