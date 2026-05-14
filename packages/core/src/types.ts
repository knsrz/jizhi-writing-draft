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

export type Style =
  | 'formal'
  | 'concise'
  | 'professional'
  | 'friendly'
  | 'promotional'
  | 'government';

export type WritingStatus =
  | 'draft'
  | 'planning'
  | 'reviewing'
  | 'writing'
  | 'polishing'
  | 'done'
  | 'error';

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
  errorMessage?: string | null;
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

export interface WritingRequest {
  type: WritingType;
  topic: string;
  targetWords: number;
  style: Style;
  userOutline?: string;
  knowledgeBaseId?: string;
  modelConfigId?: string;
  plan?: WritingPlan;
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
