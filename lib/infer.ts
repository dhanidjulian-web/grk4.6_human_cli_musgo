import { ApiKeyEntry, ModelItem, ModelProvider } from './types';
import { apiFetch } from './http';

export interface ChatTurn {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface InferOk {
  ok: true;
  text: string;
  used: string;
  provider: ModelProvider;
  keyLabel?: string;
}

export interface InferErr {
  ok: false;
  error: string;
  tried: string[];
}

function openaiBody(model: string, messages: ChatTurn[]) {
  return JSON.stringify({ model, messages, temperature: 0.4, max_tokens: 1800 });
}

function extractOpenAI(data: unknown): string {
  const d = data as {
    choices?: Array<{ message?: { content?: string }; text?: string }>;
    output_text?: string;
    text?: string;
    message?: { content?: string } | string;
  };
  const c = d?.choices?.[0];
  if (c?.message?.content) return c.message.content;
  if (c?.text) return c.text;
  if (typeof d?.output_text === 'string') return d.output_text;
  if (typeof d?.text === 'string') return d.text;
  if (typeof d?.message === 'string') return d.message;
  return '';
}

async function callOpenAI(
  url: string,
  token: string | undefined,
  model: string,
  messages: ChatTurn[],
  extraHeaders?: Record<string, string>
): Promise<{ ok: boolean; text?: string; error?: string }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };
  const r = await apiFetch<unknown>(url, { method: 'POST', headers, body: openaiBody(model, messages) });
  if (!r.ok) return { ok: false, error: r.error };
  const text = extractOpenAI(r.data).trim();
  if (!text) return { ok: false, error: 'respons kosong' };
  return { ok: true, text };
}

async function callGemini(token: string, modelId: string, messages: ChatTurn[]) {
  const sys = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n');
  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}:generateContent?key=${encodeURIComponent(token)}`;
  const r = await apiFetch<{ candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: sys ? { parts: [{ text: sys }] } : undefined,
      contents,
    }),
  });
  if (!r.ok) return { ok: false as const, error: r.error || 'gemini gagal' };
  const text = r.data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
  if (!text.trim()) return { ok: false as const, error: 'gemini kosong' };
  return { ok: true as const, text: text.trim() };
}

async function callCohere(token: string, model: string, messages: ChatTurn[]) {
  const r = await apiFetch<{ message?: { content?: Array<{ text?: string }> } | string; text?: string }>(
    'https://api.cohere.com/v2/chat',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages }),
    }
  );
  if (!r.ok) return { ok: false as const, error: r.error || 'cohere gagal' };
  const msg = r.data?.message;
  const text =
    typeof msg === 'string'
      ? msg
      : (msg?.content || []).map((c) => c.text || '').join('') || r.data?.text || '';
  if (!text.trim()) return { ok: false as const, error: 'cohere kosong' };
  return { ok: true as const, text: text.trim() };
}

async function callPollinations(messages: ChatTurn[]) {
  const prompt = messages.map((m) => `${m.role}: ${m.content}`).join('\n\n');
  const r = await apiFetch<string | { text?: string }>('https://text.pollinations.ai/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, prompt, model: 'openai' }),
  });
  if (!r.ok) {
    const g = await apiFetch<string>(`https://text.pollinations.ai/${encodeURIComponent(prompt.slice(0, 1200))}`);
    if (!g.ok) return { ok: false as const, error: g.error || r.error || 'pollinations gagal' };
    const t = typeof g.data === 'string' ? g.data : '';
    return t.trim() ? { ok: true as const, text: t.trim() } : { ok: false as const, error: 'pollinations kosong' };
  }
  const t = typeof r.data === 'string' ? r.data : (r.data as { text?: string })?.text || '';
  if (!t.trim()) return { ok: false as const, error: 'pollinations kosong' };
  return { ok: true as const, text: t.trim() };
}

function endpointFor(p: ModelProvider, model: ModelItem): string | null {
  switch (p) {
    case 'groq':
      return 'https://api.groq.com/openai/v1/chat/completions';
    case 'openrouter':
      return 'https://openrouter.ai/api/v1/chat/completions';
    case 'mistral':
      return 'https://api.mistral.ai/v1/chat/completions';
    case 'cerebras':
      return 'https://api.cerebras.ai/v1/chat/completions';
    case 'together':
      return 'https://api.together.xyz/v1/chat/completions';
    case 'github':
      return 'https://models.github.ai/inference/chat/completions';
    case 'huggingface':
      return 'https://router.huggingface.co/v1/chat/completions';
    case 'nvidia':
      return 'https://integrate.api.nvidia.com/v1/chat/completions';
    case 'sambanova':
      return 'https://api.sambanova.ai/v1/chat/completions';
    case 'fireworks':
      return 'https://api.fireworks.ai/inference/v1/chat/completions';
    case 'deepseek':
      return 'https://api.deepseek.com/chat/completions';
    case 'perplexity':
      return 'https://api.perplexity.ai/chat/completions';
    case 'siliconflow':
      return 'https://api.siliconflow.cn/v1/chat/completions';
    case 'novita':
      return 'https://api.novita.ai/v3/openai/chat/completions';
    case 'hyperbolic':
      return 'https://api.hyperbolic.xyz/v1/chat/completions';
    case 'chutes':
      return 'https://llm.chutes.ai/v1/chat/completions';
    case 'ollama':
      return (model.path || 'http://127.0.0.1:11434').replace(/\/$/, '') + '/v1/chat/completions';
    case 'lmstudio':
      return model.path || 'http://127.0.0.1:1234/v1/chat/completions';
    case 'featherless':
      return 'https://api.featherless.ai/v1/chat/completions';
    case 'deepinfra':
      return 'https://api.deepinfra.com/v1/openai/chat/completions';
    case 'moonshot':
      return 'https://api.moonshot.cn/v1/chat/completions';
    case 'qwen':
      return 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
    case 'glm':
      return 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
    case 'minimax':
      return 'https://api.minimax.io/v1/text/chatcompletion_v2';
    case 'replicate':
      return 'https://openai-proxy.replicate.com/v1/chat/completions';
    case 'custom':
      return model.path || null;
    default:
      return model.path || null;
  }
}

function pickKeys(model: ModelItem, keys: ApiKeyEntry[]): ApiKeyEntry[] {
  const pool = model.keyIds.length
    ? keys.filter((k) => model.keyIds.includes(k.id))
    : keys.filter((k) => k.provider === model.provider);
  if (model.routing === 'random' && pool.length > 1) {
    const copy = [...pool];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
  return pool;
}

function orderModels(models: ModelItem[], activeId?: string): ModelItem[] {
  const enabled = models.filter((m) => m.enabled);
  const active = enabled.find((m) => m.id === activeId);
  const rest = enabled.filter((m) => m.id !== activeId);
  const fb = rest.filter((m) => m.isFallback).sort((a, b) => a.fallbackOrder - b.fallbackOrder);
  const other = rest.filter((m) => !m.isFallback);
  const out: ModelItem[] = [];
  if (active) out.push(active);
  out.push(...other, ...fb);
  const poll = models.find((m) => m.provider === 'pollinations');
  if (poll && !out.some((m) => m.id === poll.id)) out.push(poll);
  return out.slice(0, 15);
}

function routeChain(models: ModelItem[], keys: ApiKeyEntry[], routeId?: string, activeId?: string): ModelItem[] {
  const base = orderModels(models, activeId);
  if (routeId === 'route-auto-free') {
    const freeFirst = [...base].sort((a, b) => {
      const af = a.provider === 'pollinations' || a.notes.toLowerCase().includes('free') ? 0 : 1;
      const bf = b.provider === 'pollinations' || b.notes.toLowerCase().includes('free') ? 0 : 1;
      return af - bf;
    });
    return freeFirst.slice(0, 15);
  }
  if (routeId === 'route-auto-byok') {
    const keyed = base.filter((m) => keys.some((k) => k.valid && (m.keyIds.includes(k.id) || k.provider === m.provider)));
    const rest = base.filter((m) => !keyed.includes(m));
    return [...keyed, ...rest].slice(0, 15);
  }
  return base;
}

export async function inferChat(opts: {
  models: ModelItem[];
  keys: ApiKeyEntry[];
  getKey: (id: string) => Promise<string | null>;
  messages: ChatTurn[];
  activeModelId?: string;
  routeId?: string;
}): Promise<InferOk | InferErr> {
  const chain = routeChain(opts.models, opts.keys, opts.routeId, opts.activeModelId);
  const tried: string[] = [];
  if (chain.length === 0) {
    return { ok: false, error: 'Tidak ada model aktif. Founder: Models → aktifkan / tambah manual.', tried };
  }

  for (const model of chain) {
    if (model.provider === 'local-gguf') {
      tried.push(`${model.name}: GGUF butuh runtime native — dilewati`);
      continue;
    }
    if (model.provider === 'pollinations') {
      tried.push(model.name);
      const r = await callPollinations(opts.messages);
      if (r.ok) return { ok: true, text: r.text, used: model.name, provider: 'pollinations' };
      tried.push(`pollinations: ${r.error}`);
      continue;
    }
    if (model.provider === 'cloudflare-ai') {
      tried.push(`${model.name}: butuh account id Cloudflare di path model`);
      continue;
    }

    const keyPool = pickKeys(model, opts.keys);
    const needsKey = model.provider !== 'ollama' && model.provider !== 'lmstudio';
    if (needsKey && keyPool.length === 0) {
      tried.push(`${model.name}: tidak ada API key (${model.provider})`);
      continue;
    }
    const keysToTry = keyPool.length ? keyPool : [undefined];

    for (const keyEnt of keysToTry) {
      const token = keyEnt ? await opts.getKey(keyEnt.id) : undefined;
      if (needsKey && !token) {
        tried.push(`${model.name}/${keyEnt?.label || '?'}: key kosong`);
        continue;
      }
      tried.push(`${model.name}${keyEnt ? ' · ' + keyEnt.label : ''}`);

      let r: { ok: boolean; text?: string; error?: string };
      if (model.provider === 'gemini') {
        r = await callGemini(token!, model.modelId, opts.messages);
      } else if (model.provider === 'cohere') {
        r = await callCohere(token!, model.modelId, opts.messages);
      } else {
        const url = endpointFor(model.provider, model);
        if (!url) {
          r = { ok: false, error: 'endpoint tidak dikenal' };
        } else {
          const extra =
            model.provider === 'openrouter'
              ? { 'HTTP-Referer': 'https://human-cli.local', 'X-Title': 'Human CLI' }
              : undefined;
          r = await callOpenAI(url, token, model.modelId, opts.messages, extra);
        }
      }
      if (r.ok && r.text) {
        return {
          ok: true,
          text: r.text,
          used: model.name,
          provider: model.provider,
          keyLabel: keyEnt?.label,
        };
      }
      tried.push(`  fail: ${r.error}`);
    }
  }

  return {
    ok: false,
    error: 'Semua model/key gagal. Cek API key (boleh beberapa per platform) dan fallback.',
    tried,
  };
}

export function pollinationsImageUrl(prompt: string): string {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?nologo=true&width=768&height=768`;
}
