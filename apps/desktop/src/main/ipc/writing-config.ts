export interface RuntimeModelConfig {
  provider: string;
  baseUrl: string;
  apiKey: string;
  model: string;
}

export function hasUsableApiConfig(
  config: RuntimeModelConfig | null,
): config is RuntimeModelConfig {
  return Boolean(config?.baseUrl.trim() && config.apiKey.trim() && config.model.trim());
}
