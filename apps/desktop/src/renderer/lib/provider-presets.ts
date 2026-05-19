export interface ProviderLinks {
  docs: string;
  models: string;
  apiKey?: string;
  official?: string;
}

export interface ProviderPreset {
  id: string;
  name: string;
  description: string;
  baseUrl: string;
  writingModel: string;
  embeddingModel: string;
  badge: string;
  links: ProviderLinks;
  writingModels?: string[];
  embeddingModels?: string[];
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
    description: '官方 OpenAI API，适合高质量写作、规划与通用 embedding。',
    baseUrl: 'https://api.openai.com/v1',
    writingModel: 'gpt-5.1',
    embeddingModel: 'text-embedding-3-small',
    badge: '官方',
    links: {
      official: 'https://openai.com/',
      apiKey: 'https://platform.openai.com/api-keys',
      docs: 'https://platform.openai.com/docs',
      models: 'https://platform.openai.com/docs/models',
    },
    writingModels: ['gpt-5.1', 'gpt-5', 'gpt-5-mini', 'gpt-4.1'],
    embeddingModels: ['text-embedding-3-small', 'text-embedding-3-large', 'text-embedding-ada-002'],
  },
  {
    id: 'gemini',
    name: 'Gemini',
    description: 'Google Gemini OpenAI 兼容接口，适合长上下文与多模态写作。',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    writingModel: 'gemini-2.5-flash',
    embeddingModel: 'gemini-embedding-001',
    badge: 'Google',
    links: {
      official: 'https://gemini.google.com/',
      apiKey: 'https://aistudio.google.com/app/apikey',
      docs: 'https://ai.google.dev/gemini-api/docs/openai',
      models: 'https://ai.google.dev/gemini-api/docs/models/gemini',
    },
    writingModels: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-3-flash-preview'],
    embeddingModels: ['gemini-embedding-001', 'gemini-embedding-2-preview'],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: 'DeepSeek OpenAI 兼容接口，适合中文写作、推理和方案草稿。',
    baseUrl: 'https://api.deepseek.com',
    writingModel: 'deepseek-v4-flash',
    embeddingModel: '',
    badge: '中文',
    links: {
      official: 'https://deepseek.com/',
      apiKey: 'https://platform.deepseek.com/api_keys',
      docs: 'https://api-docs.deepseek.com/',
      models: 'https://api-docs.deepseek.com/quick_start/pricing',
    },
    writingModels: ['deepseek-v4-flash', 'deepseek-v4-pro', 'deepseek-chat', 'deepseek-reasoner'],
  },
  {
    id: 'siliconflow',
    name: 'SiliconFlow',
    description: '国产与开源模型聚合平台，覆盖 Qwen、DeepSeek、BGE 等模型。',
    baseUrl: 'https://api.siliconflow.cn/v1',
    writingModel: 'Qwen/Qwen3-235B-A22B-Instruct-2507',
    embeddingModel: 'BAAI/bge-m3',
    badge: '聚合',
    links: {
      official: 'https://www.siliconflow.cn',
      apiKey: 'https://cloud.siliconflow.cn/account/ak',
      docs: 'https://docs.siliconflow.cn/',
      models: 'https://cloud.siliconflow.cn/models',
    },
    writingModels: [
      'Qwen/Qwen3-235B-A22B-Instruct-2507',
      'deepseek-ai/DeepSeek-V3',
      'deepseek-ai/DeepSeek-R1',
    ],
    embeddingModels: ['BAAI/bge-m3', 'Pro/BAAI/bge-m3', 'BAAI/bge-large-zh-v1.5'],
  },
  {
    id: 'dashscope',
    name: '阿里云百炼',
    description: '通义千问与阿里云模型服务，支持 OpenAI 兼容模式。',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    writingModel: 'qwen3.5-plus',
    embeddingModel: 'text-embedding-v3',
    badge: '阿里',
    links: {
      official: 'https://www.aliyun.com/product/bailian',
      apiKey: 'https://bailian.console.aliyun.com/?tab=model#/api-key',
      docs: 'https://help.aliyun.com/zh/model-studio/getting-started/',
      models: 'https://bailian.console.aliyun.com/?tab=model#/model-market',
    },
    writingModels: ['qwen3.5-plus', 'qwen3.5-flash', 'qwen3-max', 'deepseek-v3.2'],
    embeddingModels: ['text-embedding-v3', 'text-embedding-v2', 'text-embedding-v1'],
  },
  {
    id: 'zhipu',
    name: '智谱 GLM',
    description: '智谱 GLM 系列模型，适合中文写作、结构化输出和检索。',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    writingModel: 'glm-4.5',
    embeddingModel: 'embedding-3',
    badge: '智谱',
    links: {
      official: 'https://open.bigmodel.cn/',
      apiKey: 'https://open.bigmodel.cn/usercenter/apikeys',
      docs: 'https://docs.bigmodel.cn/',
      models: 'https://open.bigmodel.cn/modelcenter/square',
    },
    writingModels: ['glm-5', 'glm-4.7', 'glm-4.6', 'glm-4.5', 'glm-4.5-flash'],
    embeddingModels: ['embedding-3', 'embedding-2'],
  },
  {
    id: 'moonshot',
    name: 'Moonshot AI',
    description: 'Kimi/Moonshot 模型，适合长文档阅读、中文总结和资料整理。',
    baseUrl: 'https://api.moonshot.cn/v1',
    writingModel: 'kimi-k2.5',
    embeddingModel: '',
    badge: 'Kimi',
    links: {
      official: 'https://www.moonshot.cn/',
      apiKey: 'https://platform.moonshot.cn/console/api-keys',
      docs: 'https://platform.moonshot.cn/docs/',
      models: 'https://platform.moonshot.cn/docs/intro#%E6%A8%A1%E5%9E%8B%E5%88%97%E8%A1%A8',
    },
    writingModels: ['kimi-k2.5', 'kimi-k2-0711-preview', 'moonshot-v1-auto'],
  },
  {
    id: 'doubao',
    name: '火山方舟',
    description: '字节豆包与火山方舟模型，适合中文创作和企业知识场景。',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    writingModel: 'doubao-seed-1-8-251228',
    embeddingModel: 'Doubao-embedding-large',
    badge: '字节',
    links: {
      official: 'https://console.volcengine.com/ark/',
      apiKey: 'https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey',
      docs: 'https://www.volcengine.com/docs/82379/1182403',
      models: 'https://console.volcengine.com/ark/region:ark+cn-beijing/endpoint',
    },
    writingModels: [
      'doubao-seed-1-8-251228',
      'doubao-1-5-pro-32k-250115',
      'doubao-1-5-pro-256k-250115',
    ],
    embeddingModels: ['Doubao-embedding-large', 'Doubao-embedding', 'Doubao-embedding-vision'],
  },
  {
    id: 'minimax',
    name: 'MiniMax',
    description: 'MiniMax 文本模型，适合中文创作、长输出和角色化表达。',
    baseUrl: 'https://api.minimaxi.com/v1',
    writingModel: 'MiniMax-M2.5',
    embeddingModel: '',
    badge: '中文',
    links: {
      official: 'https://platform.minimaxi.com/',
      apiKey: 'https://platform.minimaxi.com/user-center/basic-information/interface-key',
      docs: 'https://platform.minimaxi.com/docs/api-reference/text-openai-api',
      models: 'https://platform.minimaxi.com/document/Models',
    },
    writingModels: ['MiniMax-M2.5', 'MiniMax-Text-01', 'abab6.5s-chat'],
  },
  {
    id: 'baidu-cloud',
    name: '百度千帆',
    description: '百度千帆 OpenAI 兼容接口，适合国产模型和企业云场景。',
    baseUrl: 'https://qianfan.baidubce.com/v2',
    writingModel: 'ernie-4.5-turbo-128k',
    embeddingModel: 'Embedding-V1',
    badge: '百度',
    links: {
      official: 'https://cloud.baidu.com/',
      apiKey: 'https://console.bce.baidu.com/iam/#/iam/apikey/list',
      docs: 'https://cloud.baidu.com/doc/index.html',
      models: 'https://cloud.baidu.com/doc/WENXINWORKSHOP/s/Fm2vrveyu',
    },
    writingModels: ['ernie-4.5-turbo-128k', 'ernie-4.5-turbo-vl', 'ernie-x1-turbo-32k'],
    embeddingModels: ['Embedding-V1', 'bge-large-zh'],
  },
  {
    id: 'hunyuan',
    name: '腾讯混元',
    description: '腾讯混元模型，适合中文办公写作和企业云部署。',
    baseUrl: 'https://api.hunyuan.cloud.tencent.com/v1',
    writingModel: 'hunyuan-turbos-latest',
    embeddingModel: 'hunyuan-embedding',
    badge: '腾讯',
    links: {
      official: 'https://cloud.tencent.com/product/hunyuan',
      apiKey: 'https://console.cloud.tencent.com/hunyuan/api-key',
      docs: 'https://cloud.tencent.com/document/product/1729/111007',
      models: 'https://cloud.tencent.com/document/product/1729/104753',
    },
    writingModels: ['hunyuan-turbos-latest', 'hunyuan-large', 'hunyuan-lite'],
    embeddingModels: ['hunyuan-embedding'],
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    description: '多模型路由入口，适合快速切换 OpenAI、Claude、Gemini 等模型。',
    baseUrl: 'https://openrouter.ai/api/v1',
    writingModel: 'openai/gpt-5.1',
    embeddingModel: '',
    badge: '路由',
    links: {
      official: 'https://openrouter.ai/',
      apiKey: 'https://openrouter.ai/settings/keys',
      docs: 'https://openrouter.ai/docs/quick-start',
      models: 'https://openrouter.ai/models',
    },
    writingModels: ['openai/gpt-5.1', 'anthropic/claude-sonnet-4.5', 'google/gemini-2.5-pro'],
  },
  {
    id: 'aihubmix',
    name: 'AiHubMix',
    description: '多模型聚合接口，适合用一个 Key 接入 OpenAI、Claude、Gemini 和开源模型。',
    baseUrl: 'https://aihubmix.com/v1',
    writingModel: 'gpt-5',
    embeddingModel: 'text-embedding-3-small',
    badge: '聚合',
    links: {
      official: 'https://aihubmix.com',
      apiKey: 'https://aihubmix.com',
      docs: 'https://doc.aihubmix.com/',
      models: 'https://aihubmix.com/models',
    },
    writingModels: ['gpt-5', 'gpt-5-mini', 'claude-sonnet-4-20250514', 'gemini-2.5-pro'],
    embeddingModels: ['text-embedding-3-small', 'text-embedding-3-large'],
  },
  {
    id: 'groq',
    name: 'Groq',
    description: '高速推理平台，适合开源模型的低延迟写作和改写。',
    baseUrl: 'https://api.groq.com/openai/v1',
    writingModel: 'llama-3.3-70b-versatile',
    embeddingModel: '',
    badge: '高速',
    links: {
      official: 'https://groq.com/',
      apiKey: 'https://console.groq.com/keys',
      docs: 'https://console.groq.com/docs/quickstart',
      models: 'https://console.groq.com/docs/models',
    },
    writingModels: [
      'llama-3.3-70b-versatile',
      'moonshotai/kimi-k2-instruct',
      'openai/gpt-oss-120b',
    ],
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    description: '欧洲主流模型厂商，适合多语言写作和轻量推理。',
    baseUrl: 'https://api.mistral.ai/v1',
    writingModel: 'mistral-large-latest',
    embeddingModel: 'mistral-embed',
    badge: '欧洲',
    links: {
      official: 'https://mistral.ai',
      apiKey: 'https://console.mistral.ai/api-keys/',
      docs: 'https://docs.mistral.ai',
      models: 'https://docs.mistral.ai/getting-started/models/models_overview',
    },
    writingModels: ['mistral-large-latest', 'pixtral-large-latest', 'ministral-8b-latest'],
    embeddingModels: ['mistral-embed'],
  },
  {
    id: 'grok',
    name: 'xAI Grok',
    description: 'xAI 官方 API，适合 Grok 系列模型写作与推理。',
    baseUrl: 'https://api.x.ai/v1',
    writingModel: 'grok-4',
    embeddingModel: '',
    badge: 'xAI',
    links: {
      official: 'https://x.ai/',
      apiKey: 'https://console.x.ai/',
      docs: 'https://docs.x.ai/',
      models: 'https://docs.x.ai/docs/models',
    },
    writingModels: ['grok-4', 'grok-3', 'grok-3-mini'],
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    description: '适合联网问答和资料检索型写作的 OpenAI 兼容接口。',
    baseUrl: 'https://api.perplexity.ai',
    writingModel: 'sonar-pro',
    embeddingModel: '',
    badge: '搜索',
    links: {
      official: 'https://perplexity.ai/',
      apiKey: 'https://www.perplexity.ai/settings/api',
      docs: 'https://docs.perplexity.ai/home',
      models: 'https://docs.perplexity.ai/guides/model-cards',
    },
    writingModels: ['sonar-pro', 'sonar', 'sonar-reasoning-pro'],
  },
  {
    id: 'together',
    name: 'Together AI',
    description: '开源模型托管平台，适合 Llama、Qwen、DeepSeek 等模型。',
    baseUrl: 'https://api.together.xyz/v1',
    writingModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    embeddingModel: '',
    badge: '开源',
    links: {
      official: 'https://www.together.ai/',
      apiKey: 'https://api.together.ai/settings/api-keys',
      docs: 'https://docs.together.ai/docs/introduction',
      models: 'https://docs.together.ai/docs/serverless-models',
    },
    writingModels: [
      'meta-llama/Llama-3.3-70B-Instruct-Turbo',
      'Qwen/Qwen3-235B-A22B-fp8-tput',
      'deepseek-ai/DeepSeek-V3',
    ],
  },
  {
    id: 'fireworks',
    name: 'Fireworks AI',
    description: '开源模型推理平台，适合高吞吐写作和团队实验。',
    baseUrl: 'https://api.fireworks.ai/inference/v1',
    writingModel: 'accounts/fireworks/models/llama-v3p1-405b-instruct',
    embeddingModel: '',
    badge: '推理',
    links: {
      official: 'https://fireworks.ai/',
      apiKey: 'https://fireworks.ai/account/api-keys',
      docs: 'https://docs.fireworks.ai/getting-started/introduction',
      models: 'https://fireworks.ai/dashboard/models',
    },
    writingModels: [
      'accounts/fireworks/models/llama-v3p1-405b-instruct',
      'accounts/fireworks/models/deepseek-v3',
    ],
  },
  {
    id: 'nvidia',
    name: 'NVIDIA NIM',
    description: 'NVIDIA NIM OpenAI 兼容接口，适合企业级开源模型推理。',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    writingModel: 'meta/llama-3.1-405b-instruct',
    embeddingModel: 'nvidia/nv-embedqa-e5-v5',
    badge: 'NIM',
    links: {
      official: 'https://build.nvidia.com/explore/discover',
      apiKey: 'https://build.nvidia.com/',
      docs: 'https://docs.api.nvidia.com/nim/reference/llm-apis',
      models: 'https://build.nvidia.com/nim',
    },
    writingModels: [
      'meta/llama-3.1-405b-instruct',
      'deepseek-ai/deepseek-r1',
      'mistralai/mixtral-8x22b-instruct-v0.1',
    ],
    embeddingModels: ['nvidia/nv-embedqa-e5-v5', 'nvidia/nv-embed-v1'],
  },
  {
    id: 'modelscope',
    name: 'ModelScope',
    description: '魔搭社区 API-Inference，适合中文开源模型与 BGE embedding。',
    baseUrl: 'https://api-inference.modelscope.cn/v1',
    writingModel: 'Qwen/Qwen3-235B-A22B-Instruct-2507',
    embeddingModel: 'BAAI/bge-m3',
    badge: '魔搭',
    links: {
      official: 'https://modelscope.cn',
      apiKey: 'https://modelscope.cn/my/myaccesstoken',
      docs: 'https://modelscope.cn/docs/model-service/API-Inference/intro',
      models: 'https://modelscope.cn/models',
    },
    writingModels: ['Qwen/Qwen3-235B-A22B-Instruct-2507', 'deepseek-ai/DeepSeek-V3'],
    embeddingModels: ['BAAI/bge-m3', 'BAAI/bge-large-zh-v1.5'],
  },
  {
    id: 'jina',
    name: 'Jina AI',
    description: '专注 embedding 与 rerank 的模型服务，适合知识库检索。',
    baseUrl: 'https://api.jina.ai/v1',
    writingModel: '',
    embeddingModel: 'jina-embeddings-v3',
    badge: '嵌入',
    links: {
      official: 'https://jina.ai',
      apiKey: 'https://jina.ai/',
      docs: 'https://jina.ai/embeddings/',
      models: 'https://jina.ai/embeddings/',
    },
    embeddingModels: ['jina-embeddings-v3', 'jina-embeddings-v2-base-zh', 'jina-clip-v1'],
  },
  {
    id: 'voyageai',
    name: 'Voyage AI',
    description: 'Anthropic 推荐的 embedding 服务，适合多语种和专业领域检索。',
    baseUrl: 'https://api.voyageai.com/v1',
    writingModel: '',
    embeddingModel: 'voyage-3-large',
    badge: '嵌入',
    links: {
      official: 'https://www.voyageai.com/',
      apiKey: 'https://dashboard.voyageai.com/organization/api-keys',
      docs: 'https://docs.voyageai.com/docs',
      models: 'https://docs.voyageai.com/docs',
    },
    embeddingModels: ['voyage-3-large', 'voyage-3', 'voyage-3-lite', 'voyage-code-3'],
  },
  {
    id: 'ollama',
    name: 'Ollama',
    description: '本地 OpenAI 兼容接口，适合离线演示和私有模型。',
    baseUrl: 'http://localhost:11434/v1',
    writingModel: 'qwen2.5:7b',
    embeddingModel: 'nomic-embed-text',
    badge: '本地',
    links: {
      official: 'https://ollama.com/',
      docs: 'https://github.com/ollama/ollama/tree/main/docs',
      models: 'https://ollama.com/library',
    },
    writingModels: ['qwen2.5:7b', 'llama3.1:8b', 'deepseek-r1:8b'],
    embeddingModels: ['nomic-embed-text', 'mxbai-embed-large', 'bge-m3'],
  },
  {
    id: 'lmstudio',
    name: 'LM Studio',
    description: '本地 OpenAI 兼容服务器，适合本机模型和局域网模型服务。',
    baseUrl: 'http://localhost:1234/v1',
    writingModel: 'local-model',
    embeddingModel: 'text-embedding-nomic-embed-text-v1.5',
    badge: '本地',
    links: {
      official: 'https://lmstudio.ai/',
      docs: 'https://lmstudio.ai/docs',
      models: 'https://lmstudio.ai/models',
    },
    writingModels: ['local-model'],
    embeddingModels: ['text-embedding-nomic-embed-text-v1.5', 'local-embedding-model'],
  },
  {
    id: 'custom',
    name: '自定义',
    description: '手动填写任意 OpenAI 兼容接口地址与模型名称。',
    baseUrl: '',
    writingModel: '',
    embeddingModel: '',
    badge: '高级',
    links: {
      docs: 'https://platform.openai.com/docs',
      models: 'https://platform.openai.com/docs/models',
    },
  },
];

export const WRITING_PROVIDER_PRESETS = PROVIDER_PRESETS.filter(
  (preset) => preset.id === 'custom' || Boolean(preset.writingModel),
);

export const EMBEDDING_PROVIDER_PRESETS = PROVIDER_PRESETS.filter(
  (preset) => preset.id === 'custom' || Boolean(preset.embeddingModel),
);

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

  if (!preset || preset.id === 'custom' || !preset.writingModel) {
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

  if (!preset || preset.id === 'custom' || !preset.embeddingModel) {
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
