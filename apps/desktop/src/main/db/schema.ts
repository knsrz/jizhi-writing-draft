import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

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
  knowledgeBaseId: text('knowledge_base_id')
    .notNull()
    .references(() => knowledgeBases.id, { onDelete: 'cascade' }),
  fileName: text('file_name').notNull(),
  fileType: text('file_type').notNull(),
  filePath: text('file_path').notNull(),
  fileHash: text('file_hash').notNull(),
  status: text('status').default('pending'),
  errorMessage: text('error_message'),
  chunkCount: integer('chunk_count').default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const documentChunks = sqliteTable('document_chunks', {
  id: text('id').primaryKey(),
  documentId: text('document_id')
    .notNull()
    .references(() => documents.id, { onDelete: 'cascade' }),
  knowledgeBaseId: text('knowledge_base_id')
    .notNull()
    .references(() => knowledgeBases.id, { onDelete: 'cascade' }),
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
  projectId: text('project_id')
    .notNull()
    .references(() => writingProjects.id, { onDelete: 'cascade' }),
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
