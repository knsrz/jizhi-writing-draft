export interface ProviderPreset {
  id: string;
  name: string;
  description: string;
  baseUrl: string;
  writingModel: string;
  embeddingModel: string;
  badge: string;
}

export interface ProviderConfigDraft {
  provider: string;
  baseUrl: string;
  writingModel: string;
  embeddingModel: string;
}

export interface ModelEndpointDraft {
  provider: string;
  baseUrl: string;
  model: string;
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: '官方 OpenAI 兼容接口，适合通用写作与长文润色。',
    baseUrl: 'https://api.openai.com/v1',
    writingModel: 'gpt-4o',
    embeddingModel: 'text-embedding-3-small',
    badge: '官方',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: '中文写作性价比高，适合报告、总结和方案草稿。',
    baseUrl: 'https://api.deepseek.com',
    writingModel: 'deepseek-chat',
    embeddingModel: 'text-embedding-3-small',
    badge: '中文',
  },
  {
    id: 'siliconflow',
    name: 'SiliconFlow',
    description: 'OpenAI 兼容聚合接口，便于接入多种国产与开源模型。',
    baseUrl: 'https://api.siliconflow.cn/v1',
    writingModel: 'Qwen/Qwen3-235B-A22B-Instruct-2507',
    embeddingModel: 'BAAI/bge-m3',
    badge: '聚合',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    description: '多模型路由入口，适合快速切换不同供应商模型。',
    baseUrl: 'https://openrouter.ai/api/v1',
    writingModel: 'openai/gpt-4o',
    embeddingModel: 'text-embedding-3-small',
    badge: '路由',
  },
  {
    id: 'ollama',
    name: 'Ollama',
    description: '本地 OpenAI 兼容接口，适合离线演示或私有模型。',
    baseUrl: 'http://localhost:11434/v1',
    writingModel: 'qwen2.5:7b',
    embeddingModel: 'nomic-embed-text',
    badge: '本地',
  },
  {
    id: 'custom',
    name: '自定义',
    description: '手动填写任意 OpenAI 兼容接口地址与模型名称。',
    baseUrl: '',
    writingModel: '',
    embeddingModel: '',
    badge: '高级',
  },
];

export function getProviderPreset(providerId: string): ProviderPreset | undefined {
  return PROVIDER_PRESETS.find((preset) => preset.id === providerId);
}

export function applyProviderPreset(
  providerId: string,
  current?: ProviderConfigDraft,
): ProviderConfigDraft {
  const preset = getProviderPreset(providerId);

  if (!preset || preset.id === 'custom') {
    return {
      provider: providerId,
      baseUrl: current?.baseUrl ?? '',
      writingModel: current?.writingModel ?? '',
      embeddingModel: current?.embeddingModel ?? '',
    };
  }

  return {
    provider: preset.id,
    baseUrl: preset.baseUrl,
    writingModel: preset.writingModel,
    embeddingModel: preset.embeddingModel,
  };
}

export function applyWritingProviderPreset(
  providerId: string,
  current?: ModelEndpointDraft,
): ModelEndpointDraft {
  const preset = getProviderPreset(providerId);

  if (!preset || preset.id === 'custom') {
    return {
      provider: providerId,
      baseUrl: current?.baseUrl ?? '',
      model: current?.model ?? '',
    };
  }

  return {
    provider: preset.id,
    baseUrl: preset.baseUrl,
    model: preset.writingModel,
  };
}

export function applyEmbeddingProviderPreset(
  providerId: string,
  current?: ModelEndpointDraft,
): ModelEndpointDraft {
  const preset = getProviderPreset(providerId);

  if (!preset || preset.id === 'custom') {
    return {
      provider: providerId,
      baseUrl: current?.baseUrl ?? '',
      model: current?.model ?? '',
    };
  }

  return {
    provider: preset.id,
    baseUrl: preset.baseUrl,
    model: preset.embeddingModel,
  };
}
