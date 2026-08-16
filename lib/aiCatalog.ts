import { ModelItem, ModelProvider } from './types';

export const MAX_AGENTS = 30;
export const MAX_INSTRUCTION = 8000;
export const MAX_FALLBACK = 15;

export const ROUTE_MODELS = [
  { id: 'route-auto-free', name: 'Auto Free', notes: 'Utamakan kuota gratis / tanpa key' },
  { id: 'route-auto-byok', name: 'Auto BYOK', notes: 'Utamakan model ber-API-key valid' },
  { id: 'route-auto-best', name: 'Auto Best', notes: 'Aktif + fallback rantai hingga 15' },
] as const;

export interface ProviderMeta {
  id: ModelProvider;
  label: string;
  tier: 'free' | 'freemium';
  blurb: string;
  keyHint: string;
  docs: string;
  keyUrl: string;
  founderAdd: boolean;
}

export const AI_PROVIDERS: ProviderMeta[] = [
  { id: 'groq', label: 'Groq', tier: 'freemium', blurb: 'LPU cepat · Llama / Qwen / Mixtral', keyHint: 'gsk_…', docs: 'https://console.groq.com/keys', keyUrl: 'https://console.groq.com/keys', founderAdd: true },
  { id: 'openrouter', label: 'OpenRouter', tier: 'free', blurb: 'Ratusan model, banyak :free', keyHint: 'sk-or-…', docs: 'https://openrouter.ai/settings/keys', keyUrl: 'https://openrouter.ai/settings/keys', founderAdd: true },
  { id: 'gemini', label: 'Google AI Studio', tier: 'free', blurb: 'Gemini Flash kuota harian', keyHint: 'AIza…', docs: 'https://aistudio.google.com/apikey', keyUrl: 'https://aistudio.google.com/apikey', founderAdd: true },
  { id: 'mistral', label: 'Mistral', tier: 'freemium', blurb: 'La Plateforme · trial + free experiments', keyHint: '…', docs: 'https://console.mistral.ai/api-keys', keyUrl: 'https://console.mistral.ai/api-keys', founderAdd: true },
  { id: 'cerebras', label: 'Cerebras', tier: 'free', blurb: 'Inference gratis · Llama', keyHint: 'csk-…', docs: 'https://cloud.cerebras.ai', keyUrl: 'https://cloud.cerebras.ai', founderAdd: true },
  { id: 'github', label: 'GitHub Models', tier: 'free', blurb: 'Marketplace model via PAT', keyHint: 'github_pat_…', docs: 'https://github.com/settings/tokens', keyUrl: 'https://github.com/settings/tokens?type=beta', founderAdd: true },
  { id: 'together', label: 'Together', tier: 'freemium', blurb: 'Kredit awal · open models', keyHint: '…', docs: 'https://api.together.xyz/settings/api-keys', keyUrl: 'https://api.together.xyz/settings/api-keys', founderAdd: true },
  { id: 'huggingface', label: 'Hugging Face', tier: 'free', blurb: 'Inference API + serverless', keyHint: 'hf_…', docs: 'https://huggingface.co/settings/tokens', keyUrl: 'https://huggingface.co/settings/tokens/new', founderAdd: true },
  { id: 'cohere', label: 'Cohere', tier: 'freemium', blurb: 'Trial Command-R', keyHint: '…', docs: 'https://dashboard.cohere.com/api-keys', keyUrl: 'https://dashboard.cohere.com/api-keys', founderAdd: true },
  { id: 'cloudflare-ai', label: 'Cloudflare Workers AI', tier: 'free', blurb: 'Workers AI kuota harian', keyHint: 'CF token', docs: 'https://dash.cloudflare.com/profile/api-tokens', keyUrl: 'https://dash.cloudflare.com/profile/api-tokens', founderAdd: true },
  { id: 'nvidia', label: 'NVIDIA NIM', tier: 'free', blurb: 'build.nvidia.com credits', keyHint: 'nvapi-…', docs: 'https://build.nvidia.com/settings/api-keys', keyUrl: 'https://build.nvidia.com/settings/api-keys', founderAdd: true },
  { id: 'sambanova', label: 'SambaNova', tier: 'free', blurb: 'Cloud free tier Llama', keyHint: '…', docs: 'https://cloud.sambanova.ai', keyUrl: 'https://cloud.sambanova.ai/apis', founderAdd: true },
  { id: 'fireworks', label: 'Fireworks', tier: 'freemium', blurb: 'Kredit onboarding', keyHint: 'fw_…', docs: 'https://fireworks.ai/account/api-keys', keyUrl: 'https://fireworks.ai/account/api-keys', founderAdd: true },
  { id: 'deepseek', label: 'DeepSeek', tier: 'freemium', blurb: 'Kuota murah / trial chat', keyHint: 'sk-…', docs: 'https://platform.deepseek.com/api_keys', keyUrl: 'https://platform.deepseek.com/api_keys', founderAdd: true },
  { id: 'perplexity', label: 'Perplexity', tier: 'freemium', blurb: 'Sonar online · trial', keyHint: 'pplx-…', docs: 'https://www.perplexity.ai/settings/api', keyUrl: 'https://www.perplexity.ai/settings/api', founderAdd: true },
  { id: 'pollinations', label: 'Pollinations', tier: 'free', blurb: 'Text + image tanpa key', keyHint: '(opsional)', docs: 'https://pollinations.ai', keyUrl: 'https://enter.pollinations.ai', founderAdd: true },
  { id: 'chutes', label: 'Chutes', tier: 'free', blurb: 'Open inference gateway', keyHint: 'cpk_…', docs: 'https://chutes.ai', keyUrl: 'https://chutes.ai', founderAdd: true },
  { id: 'siliconflow', label: 'SiliconFlow', tier: 'freemium', blurb: 'Kredit gratis Qwen/DeepSeek', keyHint: 'sk-…', docs: 'https://cloud.siliconflow.cn/account/ak', keyUrl: 'https://cloud.siliconflow.cn/account/ak', founderAdd: true },
  { id: 'novita', label: 'Novita', tier: 'freemium', blurb: 'Kredit awal LLM + image', keyHint: '…', docs: 'https://novita.ai', keyUrl: 'https://novita.ai/settings', founderAdd: true },
  { id: 'hyperbolic', label: 'Hyperbolic', tier: 'freemium', blurb: 'Kredit GPU inference', keyHint: '…', docs: 'https://app.hyperbolic.xyz', keyUrl: 'https://app.hyperbolic.xyz/settings', founderAdd: true },
  { id: 'ollama', label: 'Ollama', tier: 'free', blurb: 'Lokal · localhost:11434', keyHint: '(tidak perlu)', docs: 'https://ollama.com', keyUrl: 'https://ollama.com/download', founderAdd: true },
  { id: 'lmstudio', label: 'LM Studio', tier: 'free', blurb: 'Lokal OpenAI API :1234', keyHint: '(tidak perlu)', docs: 'https://lmstudio.ai', keyUrl: 'https://lmstudio.ai', founderAdd: true },
  { id: 'featherless', label: 'Featherless', tier: 'freemium', blurb: 'Kredit gratis open models', keyHint: '…', docs: 'https://featherless.ai', keyUrl: 'https://featherless.ai', founderAdd: true },
  { id: 'deepinfra', label: 'DeepInfra', tier: 'freemium', blurb: 'Kredit awal serverless', keyHint: '…', docs: 'https://deepinfra.com/dash/api_keys', keyUrl: 'https://deepinfra.com/dash/api_keys', founderAdd: true },
  { id: 'moonshot', label: 'Moonshot / Kimi', tier: 'freemium', blurb: 'Kimi kuota trial', keyHint: 'sk-…', docs: 'https://platform.moonshot.cn/console/api-keys', keyUrl: 'https://platform.moonshot.cn/console/api-keys', founderAdd: true },
  { id: 'qwen', label: 'Qwen / DashScope', tier: 'freemium', blurb: 'Alibaba Cloud Model Studio', keyHint: 'sk-…', docs: 'https://dashscope.console.aliyun.com/apiKey', keyUrl: 'https://dashscope.console.aliyun.com/apiKey', founderAdd: true },
  { id: 'glm', label: 'Zhipu GLM', tier: 'freemium', blurb: 'GLM-4 trial', keyHint: '…', docs: 'https://open.bigmodel.cn/usercenter/apikeys', keyUrl: 'https://open.bigmodel.cn/usercenter/apikeys', founderAdd: true },
  { id: 'minimax', label: 'MiniMax', tier: 'freemium', blurb: 'abab / M2 trial', keyHint: '…', docs: 'https://platform.minimax.io', keyUrl: 'https://platform.minimax.io/user-center/basic-information/interface-key', founderAdd: true },
  { id: 'replicate', label: 'Replicate', tier: 'freemium', blurb: 'Kredit onboarding', keyHint: 'r8_…', docs: 'https://replicate.com/account/api-tokens', keyUrl: 'https://replicate.com/account/api-tokens', founderAdd: true },
  { id: 'local-gguf', label: 'Local GGUF', tier: 'free', blurb: 'File .gguf di perangkat', keyHint: '(path)', docs: '', keyUrl: '', founderAdd: true },
  { id: 'custom', label: 'Custom / Founder', tier: 'freemium', blurb: 'Endpoint OpenAI-compatible manual', keyHint: 'bearer', docs: '', keyUrl: '', founderAdd: true },
];

export const PROVIDER_MAP: Record<string, ProviderMeta> = AI_PROVIDERS.reduce((acc, p) => {
  acc[p.id] = p;
  return acc;
}, {} as Record<string, ProviderMeta>);

export function keyPageFor(id: string, extras?: { id: string; keyUrl?: string; label?: string }[]): string {
  const e = extras?.find((x) => x.id === id);
  if (e?.keyUrl) return e.keyUrl;
  const built = PROVIDER_MAP[id]?.keyUrl || PROVIDER_MAP[id]?.docs || '';
  if (built) return built;
  const q = encodeURIComponent(`${e?.label || id} create API key`);
  return `https://www.google.com/search?q=${q}`;
}

export interface CatalogModel {
  name: string;
  provider: ModelProvider;
  modelId: string;
  contextWindow: number;
  notes: string;
  kind: 'local' | 'external';
  path?: string;
  fallbackOrder?: number;
  enabled?: boolean;
}

export const CATALOG_MODELS: CatalogModel[] = [
  { name: 'Groq Llama 3.3 70B', provider: 'groq', modelId: 'llama-3.3-70b-versatile', contextWindow: 128000, notes: 'Freemium · cepat · chat & code', kind: 'external', enabled: true },
  { name: 'Groq Llama 4 Scout', provider: 'groq', modelId: 'meta-llama/llama-4-scout-17b-16e-instruct', contextWindow: 131072, notes: 'Freemium Groq', kind: 'external' },
  { name: 'OpenRouter Llama 3.3 Free', provider: 'openrouter', modelId: 'meta-llama/llama-3.3-70b-instruct:free', contextWindow: 131072, notes: 'Free tier OpenRouter', kind: 'external', fallbackOrder: 1 },
  { name: 'OpenRouter Gemma 3 27B Free', provider: 'openrouter', modelId: 'google/gemma-3-27b-it:free', contextWindow: 131072, notes: 'Free · multimodal text', kind: 'external' },
  { name: 'OpenRouter Qwen3 32B Free', provider: 'openrouter', modelId: 'qwen/qwen3-32b:free', contextWindow: 40960, notes: 'Free · reasoning/code', kind: 'external' },
  { name: 'OpenRouter DeepSeek R1 Free', provider: 'openrouter', modelId: 'deepseek/deepseek-r1:free', contextWindow: 163840, notes: 'Free · chain-of-thought', kind: 'external' },
  { name: 'Gemini 2.0 Flash', provider: 'gemini', modelId: 'gemini-2.0-flash', contextWindow: 1000000, notes: 'Free quota AI Studio', kind: 'external', fallbackOrder: 2 },
  { name: 'Gemini 2.5 Flash Lite', provider: 'gemini', modelId: 'gemini-2.5-flash-lite', contextWindow: 1000000, notes: 'Free · hemat kuota', kind: 'external' },
  { name: 'Mistral Small', provider: 'mistral', modelId: 'mistral-small-latest', contextWindow: 32000, notes: 'Freemium La Plateforme', kind: 'external' },
  { name: 'Cerebras Llama 3.3 70B', provider: 'cerebras', modelId: 'llama-3.3-70b', contextWindow: 128000, notes: 'Free inference', kind: 'external' },
  { name: 'GitHub GPT-4o mini', provider: 'github', modelId: 'gpt-4o-mini', contextWindow: 128000, notes: 'Free via GitHub Models', kind: 'external' },
  { name: 'Together Llama 3.2 11B', provider: 'together', modelId: 'meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo', contextWindow: 131072, notes: 'Freemium credits', kind: 'external' },
  { name: 'HF Qwen2.5 72B', provider: 'huggingface', modelId: 'Qwen/Qwen2.5-72B-Instruct', contextWindow: 32768, notes: 'Free serverless (antrian)', kind: 'external' },
  { name: 'Cohere Command R', provider: 'cohere', modelId: 'command-r', contextWindow: 128000, notes: 'Trial / free tier', kind: 'external' },
  { name: 'CF Llama 3.1 8B', provider: 'cloudflare-ai', modelId: '@cf/meta/llama-3.1-8b-instruct', contextWindow: 8192, notes: 'Workers AI free', kind: 'external' },
  { name: 'NVIDIA Llama 3.1 8B', provider: 'nvidia', modelId: 'meta/llama-3.1-8b-instruct', contextWindow: 128000, notes: 'build.nvidia.com free', kind: 'external' },
  { name: 'SambaNova Llama 3.3 70B', provider: 'sambanova', modelId: 'Meta-Llama-3.3-70B-Instruct', contextWindow: 128000, notes: 'Cloud free tier', kind: 'external' },
  { name: 'Fireworks Llama 3.3 70B', provider: 'fireworks', modelId: 'accounts/fireworks/models/llama-v3p3-70b-instruct', contextWindow: 131072, notes: 'Onboarding credits', kind: 'external' },
  { name: 'DeepSeek Chat', provider: 'deepseek', modelId: 'deepseek-chat', contextWindow: 64000, notes: 'Freemium murah', kind: 'external' },
  { name: 'Perplexity Sonar', provider: 'perplexity', modelId: 'sonar', contextWindow: 127000, notes: 'Freemium + web', kind: 'external' },
  { name: 'Pollinations Text', provider: 'pollinations', modelId: 'openai', contextWindow: 8192, notes: 'Free · tanpa API key', kind: 'external' },
  { name: 'Chutes DeepSeek V3', provider: 'chutes', modelId: 'deepseek-ai/DeepSeek-V3', contextWindow: 64000, notes: 'Free gateway', kind: 'external' },
  { name: 'SiliconFlow Qwen2.5 7B', provider: 'siliconflow', modelId: 'Qwen/Qwen2.5-7B-Instruct', contextWindow: 32768, notes: 'Kredit gratis', kind: 'external' },
  { name: 'Novita DeepSeek V3', provider: 'novita', modelId: 'deepseek/deepseek-v3-0324', contextWindow: 64000, notes: 'Kredit awal', kind: 'external' },
  { name: 'Hyperbolic Llama 3.3 70B', provider: 'hyperbolic', modelId: 'meta-llama/Llama-3.3-70B-Instruct', contextWindow: 131072, notes: 'Freemium GPU', kind: 'external' },
  { name: 'Ollama Llama 3.2', provider: 'ollama', modelId: 'llama3.2', contextWindow: 131072, notes: 'Lokal gratis · ollama serve', kind: 'local' },
  { name: 'LM Studio Local', provider: 'lmstudio', modelId: 'local-model', contextWindow: 8192, notes: 'localhost:1234', kind: 'local', path: 'http://127.0.0.1:1234/v1/chat/completions' },
  { name: 'Featherless Llama 3.1 8B', provider: 'featherless', modelId: 'meta-llama/Meta-Llama-3.1-8B-Instruct', contextWindow: 131072, notes: 'Freemium', kind: 'external' },
  { name: 'DeepInfra Llama 3.3 70B', provider: 'deepinfra', modelId: 'meta-llama/Llama-3.3-70B-Instruct', contextWindow: 131072, notes: 'Kredit awal', kind: 'external' },
  { name: 'Kimi K2', provider: 'moonshot', modelId: 'kimi-k2-turbo-preview', contextWindow: 256000, notes: 'Freemium Moonshot', kind: 'external' },
  { name: 'Qwen Plus', provider: 'qwen', modelId: 'qwen-plus', contextWindow: 131072, notes: 'DashScope trial', kind: 'external' },
  { name: 'GLM-4 Flash', provider: 'glm', modelId: 'glm-4-flash', contextWindow: 128000, notes: 'Zhipu free/flash', kind: 'external' },
  { name: 'MiniMax M2', provider: 'minimax', modelId: 'MiniMax-M2', contextWindow: 204800, notes: 'Trial MiniMax', kind: 'external' },
  { name: 'Replicate Llama 3.1 8B', provider: 'replicate', modelId: 'meta/meta-llama-3.1-8b-instruct', contextWindow: 131072, notes: 'Kredit onboarding', kind: 'external' },
  { name: 'Local Qwen2.5 Coder 7B', provider: 'local-gguf', modelId: 'qwen2.5-coder-7b-instruct-q4_k_m', contextWindow: 32768, notes: 'GGUF offline', kind: 'local', path: '/models/qwen2.5-coder-7b-instruct-q4_k_m.gguf', fallbackOrder: 5, enabled: false },
];

export function catalogToModel(c: CatalogModel, i = 0): ModelItem {
  return {
    id: `m_${c.provider}_${c.modelId}`.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 48),
    name: c.name,
    provider: c.provider,
    modelId: c.modelId,
    kind: c.kind,
    path: c.path,
    contextWindow: c.contextWindow,
    enabled: c.enabled ?? false,
    isFallback: typeof c.fallbackOrder === 'number',
    fallbackOrder: c.fallbackOrder || 0,
    keyIds: [],
    routing: 'manual',
    notes: c.notes,
    createdAt: Date.now() + i,
  };
}

export function seedModels(): ModelItem[] {
  const fbNames = [
    'Pollinations Text',
    'OpenRouter Llama 3.3 Free',
    'OpenRouter Gemma 3 27B Free',
    'OpenRouter Qwen3 32B Free',
    'Gemini 2.0 Flash',
    'Gemini 2.5 Flash Lite',
    'Groq Llama 3.3 70B',
    'Cerebras Llama 3.3 70B',
    'GitHub GPT-4o mini',
    'DeepSeek Chat',
    'Mistral Small',
    'HF Qwen2.5 72B',
    'GLM-4 Flash',
    'Ollama Llama 3.2',
    'Local Qwen2.5 Coder 7B',
  ];
  const alwaysOn: ModelItem = {
    id: 'm_local_always_on',
    name: 'Local Admin Kernel',
    provider: 'local-gguf',
    modelId: 'humancli-admin-kernel',
    kind: 'local',
    path: '/models/humancli-admin-kernel.gguf',
    contextWindow: 32768,
    enabled: true,
    isFallback: true,
    fallbackOrder: 0,
    keyIds: [],
    routing: 'manual',
    notes: 'ALWAYS ON · System Admin + Swarm Orchestrator · tanpa API key',
    createdAt: Date.now(),
  };
  const rest = CATALOG_MODELS.map((c, i) => {
    const m = catalogToModel(c, i);
    const idx = fbNames.indexOf(c.name);
    if (idx >= 0) {
      m.isFallback = true;
      m.fallbackOrder = idx + 1;
      m.enabled = c.name !== 'Local Qwen2.5 Coder 7B';
    }
    if (c.name === 'Groq Llama 3.3 70B' || c.name === 'Pollinations Text') m.enabled = true;
    return m;
  });
  return [alwaysOn, ...rest];
}
