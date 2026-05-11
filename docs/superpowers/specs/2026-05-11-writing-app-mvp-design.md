# 极致写作 — MVP 阶段 1 设计文档

> 面向办公人员的 AI 写作桌面客户端 · 本地单机 MVP

## 1. 产品定位与 MVP 范围

本产品是一款面向办公人员的 AI 写作桌面客户端。MVP 阶段专注于打通本地写作闭环：

**包含：**
- Electron 桌面客户端（macOS + Windows）
- API Key 自配置（OpenAI-compatible）
- 知识库创建、文档上传（PDF/DOCX/TXT/MD）、本地向量索引与 RAG 检索
- 写作计划生成 → 分段写作 → 子 Agent 润色 → 全文合并
- 字数控制、语言风格设置
- Markdown / DOCX 导出
- 历史版本管理

**不包含：**
- 商业后台（账号、订阅、支付、模型代理）
- 云端同步
- 团队协作
- OCR / PPT / Excel 解析
- 插件市场

## 2. 技术栈

| 层 | 选型 | 理由 |
|---|---|---|
| 桌面壳 | Electron 38 | 参考 cherry-studio/craft-agents 成熟架构 |
| 前端框架 | React 19 + TypeScript 5.8 | speck 指定 |
| UI | shadcn/ui + Tailwind CSS v4 | 现代化、轻量、可定制 |
| 状态管理 | Zustand | 比 Redux Toolkit 更轻，写作工作台无需复杂状态 |
| 富文本编辑 | TipTap 3 | cherry-studio 已验证，支持 Markdown 渲染 |
| 构建 | electron-vite (Vite) | HMR 快，cherry-studio 同款 |
| AI SDK | Vercel AI SDK v5 | 多 provider 抽象成熟 |
| 主进程 DB | better-sqlite3 + Drizzle ORM | 轻量、同步 API 适合 Electron |
| 向量存储 | LanceDB (Node.js binding) | 嵌入式，无需额外服务 |
| 文档解析 | pdf-parse + mammoth + 原生 | PDF/DOCX/TXT/MD 全覆盖 |
| 包管理 | pnpm workspace | monorepo 原生支持 |
| 测试 | Vitest + Playwright | unit + e2e |

## 3. 总体架构

```
┌─────────────────────────────────────────────────┐
│                  Electron App                     │
│                                                    │
│  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │
│  │  main/    │  │ preload/ │  │   renderer/     │  │
│  │  (Node)   │◄─┤ (bridge) ├──┤   (React SPA)   │  │
│  │           │  │          │  │                 │  │
│  │ • IPC     │  │ context  │  │ • 写作工作台     │  │
│  │ • 文件IO  │  │ Bridge   │  │ • 知识库管理     │  │
│  │ • LanceDB │  │          │  │ • 编辑器(TipTap) │  │
│  │ • SQLite  │  │          │  │ • 设置页面       │  │
│  └─────┬─────┘  └──────────┘  └────────────────┘  │
│        │                                           │
└────────┼───────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────┐
│  packages/ai/    │────▶│  OpenAI / Claude  │
│  (模型抽象层)    │     │  / 兼容 API       │
└─────────────────┘     └──────────────────┘
         │
┌─────────────────┐     ┌──────────────────┐
│ packages/agent/  │────▶│  packages/        │
│ (Agent 编排)     │     │  knowledge/(RAG)  │
└─────────────────┘     └──────────────────┘
```

## 4. 项目结构

```
writing-app/
├── package.json                    # workspace root
├── pnpm-workspace.yaml
├── tsconfig.json
├── electron-builder.yml
│
├── packages/
│   ├── core/                       # @app/core
│   │   └── src/
│   │       ├── types/              # WritingProject, KnowledgeBase, Document, Chunk
│   │       ├── ipc-channels.ts     # IPC 通道常量
│   │       └── constants.ts        # 写作类型、风格枚举、字数档位
│   │
│   ├── ai/                         # @app/ai
│   │   └── src/
│   │       ├── providers/          # OpenAI / Anthropic / 兼容接口适配
│   │       ├── models.ts           # 模型配置、连接测试
│   │       ├── embedding.ts        # embedding 调用封装
│   │       └── token-counter.ts    # token 估算
│   │
│   ├── knowledge/                  # @app/knowledge
│   │   └── src/
│   │       ├── parser/             # PDF / DOCX / TXT / MD 解析
│   │       ├── chunker/            # 按段落+标题切分
│   │       ├── vector-store.ts     # LanceDB 封装
│   │       └── retriever.ts        # 关键词 + 向量检索 + 重排序
│   │
│   └── agent/                      # @app/agent
│       └── src/
│           ├── planner.ts          # 生成写作计划
│           ├── writer.ts           # 分段生成正文
│           ├── sub-agents/
│           │   ├── fact-check.ts   # 事实校正 Agent
│           │   └── polish.ts       # 语言润色 Agent
│           └── pipeline.ts         # 编排主流程
│
├── apps/
│   └── desktop/                    # @app/desktop
│       ├── electron.vite.config.ts
│       ├── src/
│       │   ├── main/               # Electron 主进程
│       │   │   ├── index.ts        # 入口、窗口管理
│       │   │   ├── ipc/            # IPC handler 注册
│       │   │   ├── db/             # Drizzle schema + migrations
│       │   │   └── services/       # 文件服务、keychain
│       │   ├── preload/
│       │   │   └── index.ts        # contextBridge
│       │   └── renderer/           # React SPA
│       │       ├── pages/           # Writing, Knowledge, History, Settings
│       │       ├── components/     # writing/, knowledge/, editor/, ui/
│       │       ├── hooks/
│       │       ├── store/          # Zustand stores
│       │       └── lib/
│       └── resources/
│
└── tests/
    ├── unit/
    └── e2e/
```

### 架构约束

- `packages/` 下所有包不依赖 Electron，只依赖 Node.js API。保证后续迁 Tauri 或拆服务端时可直接复用。
- renderer 不直接调用 AI API。所有调用走 IPC → main process → packages。API Key 只存主进程。

## 5. 数据模型

### 5.1 SQLite 表

```sql
-- 知识库
CREATE TABLE knowledge_bases (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  description   TEXT DEFAULT '',
  embedding_model TEXT DEFAULT 'text-embedding-3-small',
  document_count INTEGER DEFAULT 0,
  storage_size  INTEGER DEFAULT 0,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);

-- 文档
CREATE TABLE documents (
  id                 TEXT PRIMARY KEY,
  knowledge_base_id  TEXT NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
  file_name          TEXT NOT NULL,
  file_type          TEXT NOT NULL,          -- 'pdf' | 'docx' | 'txt' | 'md'
  file_path          TEXT NOT NULL,
  file_hash          TEXT NOT NULL,          -- sha256 去重
  status             TEXT DEFAULT 'pending', -- 'pending'|'parsing'|'chunking'|'embedding'|'ready'|'error'
  chunk_count        INTEGER DEFAULT 0,
  created_at         TEXT NOT NULL,
  updated_at         TEXT NOT NULL
);

-- 切片
CREATE TABLE document_chunks (
  id                 TEXT PRIMARY KEY,
  document_id        TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  knowledge_base_id  TEXT NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
  chunk_index        INTEGER NOT NULL,
  content            TEXT NOT NULL,
  token_count        INTEGER DEFAULT 0,
  metadata           TEXT DEFAULT '{}',      -- JSON: {heading, page, section}
  lance_row_id       TEXT,
  created_at         TEXT NOT NULL
);

-- 写作项目
CREATE TABLE writing_projects (
  id                 TEXT PRIMARY KEY,
  title              TEXT NOT NULL,
  writing_type       TEXT NOT NULL,
  target_words       INTEGER DEFAULT 2000,
  style              TEXT DEFAULT 'formal',
  knowledge_base_id  TEXT REFERENCES knowledge_bases(id),
  status             TEXT DEFAULT 'draft',
  plan               TEXT,                   -- JSON: 写作计划
  created_at         TEXT NOT NULL,
  updated_at         TEXT NOT NULL
);

-- 写作版本
CREATE TABLE writing_versions (
  id                 TEXT PRIMARY KEY,
  project_id         TEXT NOT NULL REFERENCES writing_projects(id) ON DELETE CASCADE,
  version_number     INTEGER NOT NULL,
  content            TEXT NOT NULL,           -- Markdown 全文
  word_count         INTEGER DEFAULT 0,
  change_summary     TEXT DEFAULT '',
  created_at         TEXT NOT NULL
);

-- 设置
CREATE TABLE settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

### 5.2 向量存储 (LanceDB)

```text
~/.writing-app/
├── app.db                    # SQLite
├── lancedb/
│   ├── kb_{knowledge_base_id}.lance/
│   └── ...
├── documents/                # 上传文件副本
│   └── {knowledge_base_id}/
│       └── {document_id}.{ext}
└── settings.json
```

- 每个知识库 = 一个 LanceDB table
- Schema: `{id, chunk_id, vector(1536), content, metadata}`
- 索引: IVFPQ

### 5.3 API Key 存储

使用 Electron `safeStorage` 加密存储到系统钥匙串（macOS Keychain / Windows DPAPI）。不写入 SQLite 或明文文件。

## 6. Agent 工作流

### 6.1 主流程

```
用户输入主题/要求
      │
      ▼
  1. 写作计划 (planner.ts)
     → LLM 分析任务 + 检索知识库 → 生成计划 JSON
      │
      │ 用户确认/修改
      ▼
  2. 分段生成 (writer.ts)
     → 逐 section: RAG检索 → LLM 生成初稿 (带字数+风格约束)
     → 流式推送到 renderer
      │
      ▼
  3. 子 Agent 润色 (pipeline.ts)
     → 事实校正 → 语言润色 → 字数微调
      │
      ▼
  4. 合并 + 全文一致性检查 → 保存版本
```

### 6.2 子 Agent

**事实校正 Agent (fact-check.ts)**：
- 输入：段落 + 该段检索到的知识库原文
- 逐句对照知识库，修正编造的数字/日期/人名/政策
- 不新增内容，只修正或标记"无法确认"

**语言润色 Agent (polish.ts)**：
- 输入：段落 + 目标风格
- 优化表达但不改变事实内容
- 不做字数调整

### 6.3 字数控制（三层）

| 阶段 | 方法 | 容差 |
|------|------|------|
| 计划 | LLM 分配 section 字数预算 | — |
| 生成 | Prompt 带目标字数 + 约束 | ±20% 每段 |
| 润色 | 统计实际字数，过长触发压缩 prompt | ±10% 全文 |

### 6.4 核心接口

```typescript
// packages/agent/src/pipeline.ts

interface WritingRequest {
  topic: string;
  type: WritingType;
  style: Style;
  targetWords: number;
  knowledgeBaseId?: string;
  userOutline?: string;
}

interface WritingPlan {
  goal: string;
  audience: string;
  sections: SectionPlan[];
  totalWordBudget: number;
  missingInfo?: string[];
}

interface SectionPlan {
  title: string;
  targetWords: number;
  keywords: string[];
  needsRAG: boolean;
}

interface PipelineContext {
  aiProvider: AiProvider;
  knowledgeRetriever: Retriever;
  onPlanReady: (plan: WritingPlan) => void;
  onSectionOutput: (section: SectionOutput) => void;
  onProgress: (percent: number) => void;
}

async function runWritingPipeline(
  request: WritingRequest,
  context: PipelineContext,
): Promise<string>;
```

### 6.5 RAG 管线

```
上传文件 → parser → chunker → embedding → LanceDB → retriever (写作时检索)
```

- **Parser**: pdf-parse / mammoth / 原生
- **Chunker**: 按段落+标题层级切分，max 1000 chars/chunk，重叠 100 chars
- **Embedding**: 调用用户配置的 embedding API，默认 1536-d
- **Retriever**: 关键词 (SQLite FTS) + 向量检索 (LanceDB) → 重排序 → top 5

## 7. IPC 通信

### 7.1 通道一览

| 领域 | 通道 | 方向 | 说明 |
|------|------|------|------|
| 知识库 | `kb:list` | renderer→main | 列表 |
| | `kb:create` | renderer→main | 创建 |
| | `kb:delete` | renderer→main | 删除 |
| | `kb:upload` | renderer→main | 上传+解析+索引 |
| | `kb:upload-progress` | main→renderer | 进度推送 |
| | `kb:search` | renderer→main | 测试检索 |
| 写作 | `writing:start` | renderer→main | 触发 pipeline |
| | `writing:cancel` | renderer→main | 取消 |
| | `writing:plan` | main→renderer | 计划就绪 |
| | `writing:section` | main→renderer | 逐段流式推送 |
| | `writing:progress` | main→renderer | 进度百分比 |
| | `writing:done` | main→renderer | 完成 |
| | `writing:error` | main→renderer | 错误 |
| | `writing:retry-section` | renderer→main | 重写某段 |
| 版本 | `version:list/get/restore` | renderer→main | 版本管理 |
| 导出 | `export:md/docx` | renderer→main | 导出文件 |
| 设置 | `settings:get/set` | renderer→main | 设置读写 |
| | `apikey:set/test` | renderer→main | API Key 管理 |

### 7.2 通信模式

- **Request-Response**: `ipcRenderer.invoke()` → handler 返回结果
- **Streaming Push**: main 用 `webContents.send()` 单向推送，renderer 用 `ipcRenderer.on()` 监听

### 7.3 安全

- renderer 不直接访问 Node.js API
- API Key 只在 main process 内存中
- 文件选择用 `dialog.showOpenDialog`
- IPC handler 入口参数用 zod 校验

## 8. UI 设计

### 8.1 路由

```
/                    →  写作工作台（首页）
/knowledge           →  知识库列表
/knowledge/:id       →  知识库详情
/history             →  历史写作项目
/history/:id         →  项目详情 & 版本
/settings            →  设置
```

### 8.2 核心页面

**写作工作台**：主题输入 + 写作类型/篇幅/风格/知识库选择 + 高级设置（收起） + 开始写作

**写作中**：左侧写作计划（章节进度），右侧流式输出正文

**知识库列表**：卡片式展示，每个卡片显示名称/文档数/更新时间，操作入口

### 8.3 组件树

```
App
├── Layout (Sidebar + Content)
├── WritingPage
│   ├── WritingForm
│   ├── WritingPlanPanel
│   ├── WritingOutput
│   └── WritingToolbar
├── KnowledgeListPage
├── KnowledgeDetailPage
│   ├── DocumentList
│   ├── UploadButton
│   └── UploadProgressPanel
├── HistoryPage / HistoryDetailPage
└── SettingsPage
    ├── ApiKeyConfig
    ├── ModelSelect
    └── GeneralSettings
```

### 8.4 状态管理 (Zustand)

**writingStore**: project, plan, sections, currentSection, status, error
**knowledgeStore**: bases, currentBase, documents, uploadProgress
**settingsStore**: apiKey (masked), baseUrl, writingModel, embeddingModel

## 9. 开发阶段

### Phase 0: 脚手架搭建
- pnpm workspace monorepo
- Electron + Vite + React + Tailwind 初始化
- packages/core 类型和 IPC 通道定义

### Phase 1: 模型接入
- packages/ai 提供商适配
- API Key 安全存储
- 连接测试

### Phase 2: 知识库
- packages/knowledge 解析/切片/向量化管线
- LanceDB 封装
- 检索器实现

### Phase 3: Agent 写作
- packages/agent 计划/写作/子Agent
- 流式输出

### Phase 4: UI 页面
- 写作工作台
- 知识库管理
- 历史/设置

### Phase 5: 导出与完善
- Markdown/DOCX 导出
- 局部编辑
- E2E 测试
