import { createModelEntry, filterModelEntriesForEndpoint, type SavedModelEntry } from '@app/core';
import {
  Brain,
  CheckCircle2,
  Database,
  KeyRound,
  PlugZap,
  RotateCw,
  Save,
  Server,
  ShieldCheck,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  applyEmbeddingProviderPreset,
  applyWritingProviderPreset,
  PROVIDER_PRESETS,
} from '../lib/provider-presets';
import { cn } from '../lib/utils';
import { useSettingsStore } from '../store/settings';

type SettingsSection = 'writing' | 'embedding';

const settingsSections = [
  {
    id: 'writing',
    title: '模型与 API 配置',
    description: '用于规划、起草、事实核查与润色。',
    icon: Brain,
  },
  {
    id: 'embedding',
    title: '嵌入模型设置',
    description: '用于知识库解析、向量化与检索。',
    icon: Database,
  },
] as const;

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('writing');
  const [writingApiKey, setWritingApiKey] = useState('');
  const [embeddingApiKey, setEmbeddingApiKey] = useState('');
  const {
    writing,
    embedding,
    saving,
    testing,
    testResult,
    setWritingConfig,
    setEmbeddingConfig,
    saveWritingApiKey,
    saveEmbeddingApiKey,
    selectWritingModel,
    selectEmbeddingModel,
    testWritingConnection,
    testEmbeddingConnection,
    loadSettings,
  } = useSettingsStore();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const activeMeta = settingsSections.find((section) => section.id === activeSection);
  const keyStatusText =
    activeSection === 'writing'
      ? writing.apiKeySet
        ? '写作 Key 已保存'
        : '写作 Key 未保存'
      : embedding.apiKeySet
        ? '嵌入 Key 已保存'
        : '嵌入 Key 未保存';

  return (
    <div className="min-h-full bg-[#eef4fb] text-slate-950">
      <header className="border-b border-white/70 bg-white/80 px-8 py-5 shadow-sm shadow-slate-200/60 backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              Settings
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">设置</h1>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm text-emerald-700">
            <ShieldCheck className="h-4 w-4" />
            {keyStatusText}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-[280px_minmax(0,1fr)] gap-6 p-8">
        <aside className="space-y-2">
          {settingsSections.map((section) => {
            const Icon = section.icon;
            const isActive = section.id === activeSection;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  'flex w-full items-start gap-3 rounded-2xl border p-4 text-left shadow-sm shadow-slate-200/50 transition-colors',
                  isActive
                    ? 'border-blue-300 bg-white ring-2 ring-blue-100'
                    : 'border-slate-200/80 bg-white hover:border-blue-200 hover:bg-blue-50/50',
                )}
              >
                <span
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                    isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500',
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-900">
                    {section.title}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">
                    {section.description}
                  </span>
                </span>
              </button>
            );
          })}
        </aside>

        <section className="min-w-0">
          {activeSection === 'writing' ? (
            <EndpointSettings
              title={activeMeta?.title ?? '模型与 API 配置'}
              description="写作模型可以使用 OpenAI、DeepSeek、OpenRouter 或任意兼容接口。"
              endpoint={writing}
              apiKey={writingApiKey}
              apiKeyPlaceholder={writing.apiKeySet ? '已安全保存，输入新 Key 可覆盖' : 'sk-...'}
              saving={saving === 'writing'}
              testing={testing === 'writing'}
              testResult={testResult.writing}
              modelLabel="写作模型"
              modelPlaceholder="gpt-4o"
              activeModelId={createModelEntry('writing', writing).id}
              onApiKeyChange={setWritingApiKey}
              onPresetSelect={(providerId) =>
                setWritingConfig(
                  applyWritingProviderPreset(providerId, {
                    provider: writing.provider,
                    baseUrl: writing.baseUrl,
                    model: writing.model,
                  }),
                )
              }
              onChange={setWritingConfig}
              onSelectModel={(modelConfigId) => void selectWritingModel(modelConfigId)}
              onSave={() => saveWritingApiKey(writingApiKey)}
              onTest={() => testWritingConnection(writingApiKey)}
            />
          ) : (
            <EndpointSettings
              title={activeMeta?.title ?? '嵌入模型设置'}
              description="嵌入模型可以独立选择厂商，知识库向量化和检索只使用这里的配置。"
              endpoint={embedding}
              apiKey={embeddingApiKey}
              apiKeyPlaceholder={embedding.apiKeySet ? '已安全保存，输入新 Key 可覆盖' : 'sk-...'}
              saving={saving === 'embedding'}
              testing={testing === 'embedding'}
              testResult={testResult.embedding}
              modelLabel="嵌入模型"
              modelPlaceholder="text-embedding-3-small"
              activeModelId={createModelEntry('embedding', embedding).id}
              onApiKeyChange={setEmbeddingApiKey}
              onPresetSelect={(providerId) =>
                setEmbeddingConfig(
                  applyEmbeddingProviderPreset(providerId, {
                    provider: embedding.provider,
                    baseUrl: embedding.baseUrl,
                    model: embedding.model,
                  }),
                )
              }
              onChange={setEmbeddingConfig}
              onSelectModel={(modelConfigId) => void selectEmbeddingModel(modelConfigId)}
              onSave={() => saveEmbeddingApiKey(embeddingApiKey)}
              onTest={() => testEmbeddingConnection(embeddingApiKey)}
            />
          )}
        </section>
      </div>
    </div>
  );
}

function EndpointSettings({
  title,
  description,
  endpoint,
  apiKey,
  apiKeyPlaceholder,
  saving,
  testing,
  testResult,
  modelLabel,
  modelPlaceholder,
  activeModelId,
  onApiKeyChange,
  onPresetSelect,
  onChange,
  onSelectModel,
  onSave,
  onTest,
}: {
  title: string;
  description: string;
  endpoint: {
    provider: string;
    baseUrl: string;
    model: string;
    models: SavedModelEntry[];
    apiKeySet: boolean;
  };
  apiKey: string;
  apiKeyPlaceholder: string;
  saving: boolean;
  testing: boolean;
  testResult: { success: boolean; latencyMs: number; error?: string } | null;
  modelLabel: string;
  modelPlaceholder: string;
  activeModelId: string;
  onApiKeyChange: (value: string) => void;
  onPresetSelect: (providerId: string) => void;
  onChange: (config: Partial<{ provider: string; baseUrl: string; model: string }>) => void;
  onSelectModel: (modelConfigId: string) => void;
  onSave: () => void;
  onTest: () => void;
}) {
  const selectedPreset = useMemo(
    () =>
      PROVIDER_PRESETS.find((preset) => preset.id === endpoint.provider) ?? PROVIDER_PRESETS.at(-1),
    [endpoint.provider],
  );
  const providerModels = useMemo(
    () => filterModelEntriesForEndpoint(endpoint.models, endpoint),
    [endpoint],
  );

  return (
    <div className="grid grid-cols-[300px_minmax(0,1fr)] gap-6">
      <div className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-700">API 预设</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">选择供应商后仍可手动调整。</p>
        </div>

        <div className="space-y-2">
          {PROVIDER_PRESETS.map((preset) => {
            const isActive =
              preset.id === endpoint.provider || (preset.id === 'custom' && !selectedPreset);
            return (
              <button
                type="button"
                key={preset.id}
                onClick={() => onPresetSelect(preset.id)}
                className={cn(
                  'w-full rounded-2xl border border-slate-200/80 bg-white p-4 text-left transition-colors',
                  isActive
                    ? 'border-blue-300 bg-white ring-2 ring-blue-100'
                    : 'hover:border-blue-200 hover:bg-blue-50/50',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">{preset.name}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
                        {preset.badge}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-500">{preset.description}</p>
                  </div>
                  {isActive && <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-600" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-6">
        <div className="border-b border-slate-200 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="text-sm text-slate-500">{description}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="col-span-2 block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Base URL</span>
            <input
              type="text"
              value={endpoint.baseUrl}
              onChange={(e) => onChange({ baseUrl: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="https://api.openai.com/v1"
            />
          </label>

          <label className="col-span-2 block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">{modelLabel}</span>
            <input
              type="text"
              value={endpoint.model}
              onChange={(e) => onChange({ model: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder={modelPlaceholder}
            />
          </label>

          <label className="col-span-2 block">
            <span className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700">
              <KeyRound className="h-4 w-4" />
              API Key
            </span>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => onApiKeyChange(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder={apiKeyPlaceholder}
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-5">
          <button
            type="button"
            onClick={onSave}
            disabled={saving || !endpoint.baseUrl.trim() || !endpoint.model.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? <RotateCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? '保存中' : '保存配置'}
          </button>
          <button
            type="button"
            onClick={onTest}
            disabled={
              testing ||
              (!endpoint.apiKeySet && !apiKey.trim()) ||
              !endpoint.baseUrl.trim() ||
              !endpoint.model.trim()
            }
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50/50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {testing ? (
              <RotateCw className="h-4 w-4 animate-spin" />
            ) : (
              <PlugZap className="h-4 w-4" />
            )}
            {testing ? '测试中' : '测试连接'}
          </button>
          {testResult && (
            <span
              className={cn(
                'rounded-full px-3 py-1.5 text-sm',
                testResult.success ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700',
              )}
            >
              {testResult.success
                ? `连接成功，延迟 ${testResult.latencyMs}ms`
                : `连接失败：${testResult.error}`}
            </span>
          )}
        </div>

        <div className="border-t border-slate-200 pt-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">已保存模型</h3>
              <p className="mt-1 text-xs text-slate-500">保存配置后会自动加入列表。</p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-500">
              {providerModels.length}
            </span>
          </div>

          {providerModels.length > 0 ? (
            <div className="space-y-2">
              {providerModels.map((model) => {
                const isActive = model.id === activeModelId;
                return (
                  <button
                    type="button"
                    key={model.id}
                    onClick={() => onSelectModel(model.id)}
                    className={cn(
                      'flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors',
                      isActive
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-slate-900">
                        {model.name}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-slate-500">
                        {model.provider} · {model.baseUrl}
                      </span>
                    </span>
                    {isActive && <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-600" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              暂无已保存模型
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
