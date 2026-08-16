import { apiFetch } from './http';
import { ExtraPlatform, ModelProvider } from './types';
import { PROVIDER_MAP } from './aiCatalog';

export interface KeyCheck {
  ok: boolean;
  message: string;
}

function modelsUrl(provider: string, extra?: ExtraPlatform): string | null {
  if (extra?.endpoint) {
    return extra.endpoint.replace(/\/chat\/completions\/?$/, '/models');
  }
  switch (provider) {
    case 'groq':
      return 'https://api.groq.com/openai/v1/models';
    case 'openrouter':
      return 'https://openrouter.ai/api/v1/models';
    case 'mistral':
      return 'https://api.mistral.ai/v1/models';
    case 'cerebras':
      return 'https://api.cerebras.ai/v1/models';
    case 'together':
      return 'https://api.together.xyz/v1/models';
    case 'github':
      return 'https://models.github.ai/inference/models';
    case 'huggingface':
      return 'https://router.huggingface.co/v1/models';
    case 'nvidia':
      return 'https://integrate.api.nvidia.com/v1/models';
    case 'sambanova':
      return 'https://api.sambanova.ai/v1/models';
    case 'fireworks':
      return 'https://api.fireworks.ai/inference/v1/models';
    case 'deepseek':
      return 'https://api.deepseek.com/models';
    case 'perplexity':
      return 'https://api.perplexity.ai/models';
    case 'siliconflow':
      return 'https://api.siliconflow.cn/v1/models';
    case 'novita':
      return 'https://api.novita.ai/v3/openai/models';
    case 'hyperbolic':
      return 'https://api.hyperbolic.xyz/v1/models';
    case 'chutes':
      return 'https://llm.chutes.ai/v1/models';
    case 'featherless':
      return 'https://api.featherless.ai/v1/models';
    case 'deepinfra':
      return 'https://api.deepinfra.com/v1/openai/models';
    case 'moonshot':
      return 'https://api.moonshot.cn/v1/models';
    case 'qwen':
      return 'https://dashscope.aliyuncs.com/compatible-mode/v1/models';
    case 'glm':
      return 'https://open.bigmodel.cn/api/paas/v4/models';
    case 'minimax':
      return 'https://api.minimax.io/v1/models';
    case 'replicate':
      return 'https://api.replicate.com/v1/models';
    case 'cohere':
      return 'https://api.cohere.com/v1/models';
    case 'custom':
      return extra?.endpoint || null;
    default:
      return extra?.endpoint || null;
  }
}

export async function validateApiKey(
  provider: ModelProvider,
  token: string,
  extras: ExtraPlatform[] = []
): Promise<KeyCheck> {
  const t = token.trim();
  if (!t) return { ok: false, message: 'API key kosong' };

  if (provider === 'pollinations') return { ok: true, message: 'Pollinations tidak butuh key' };
  if (provider === 'local-gguf') return { ok: true, message: 'GGUF lokal — tidak divalidasi remotely' };
  if (provider === 'ollama') {
    const r = await apiFetch('http://127.0.0.1:11434/api/tags');
    return r.ok ? { ok: true, message: 'Ollama merespons' } : { ok: false, message: r.error || 'Ollama tidak terjangkau' };
  }
  if (provider === 'lmstudio') {
    const r = await apiFetch('http://127.0.0.1:1234/v1/models');
    return r.ok ? { ok: true, message: 'LM Studio merespons' } : { ok: false, message: r.error || 'LM Studio tidak terjangkau' };
  }

  if (provider === 'gemini') {
    const r = await apiFetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(t)}`);
    if (!r.ok) return { ok: false, message: r.error || `Gemini ${r.status}` };
    return { ok: true, message: 'Gemini key valid' };
  }

  if (provider === 'cloudflare-ai') {
    const r = await apiFetch('https://api.cloudflare.com/client/v4/user/tokens/verify', {
      headers: { Authorization: `Bearer ${t}` },
    });
    if (!r.ok) return { ok: false, message: r.error || `Cloudflare ${r.status}` };
    return { ok: true, message: 'Cloudflare token valid' };
  }

  const extra = extras.find((e) => e.id === provider);
  const url = modelsUrl(provider, extra);
  if (!url) return { ok: false, message: 'Tidak ada endpoint validasi untuk platform ini' };

  const r = await apiFetch(url, {
    headers: {
      Authorization: `Bearer ${t}`,
      Accept: 'application/json',
    },
  });
  if (!r.ok) {
    return { ok: false, message: r.error || `HTTP ${r.status}` };
  }
  const label = extra?.label || PROVIDER_MAP[provider]?.label || provider;
  return { ok: true, message: `${label} key valid` };
}
