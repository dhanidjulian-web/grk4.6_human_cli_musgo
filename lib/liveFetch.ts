import { apiFetch } from './http';
import { github } from './github';
import { LineKind, TerminalLine } from './types';

function L(kind: LineKind, text: string): Omit<TerminalLine, 'id' | 'ts'> {
  return { kind, text };
}

export function extractUrl(raw: string): string | null {
  const m = raw.match(/https?:\/\/[^\s]+/i);
  if (m) return m[0].replace(/[),.]+$/, '');
  return null;
}

export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function fetchPage(url: string): Promise<Omit<TerminalLine, 'id' | 'ts'>[]> {
  const started = Date.now();
  const r = await apiFetch<string>(url, { headers: { Accept: 'text/html,text/plain,*/*' } });
  const ms = Date.now() - started;
  if (!r.ok) {
    return [
      L('cmd', `$ GET ${url}`),
      L('err', `  ${r.status || 0}  ${r.error}`),
    ];
  }
  const raw = typeof r.data === 'string' ? r.data : JSON.stringify(r.data);
  const text = stripHtml(raw).slice(0, 2400);
  const title = (raw.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1]?.replace(/\s+/g, ' ').trim();
  return [
    L('cmd', `$ GET ${url}`),
    L('ok', `  ${r.status}  ${raw.length}B  ${ms}ms`),
    L('head', `  ${title || url}`),
    ...text.split(/(?<=\.)\s/).slice(0, 18).map((p) => L('out', `  ${p.trim()}`)).filter((l) => l.text.trim().length > 3),
  ];
}

export async function loadRemoteText(url: string): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const r = await apiFetch<string>(url, { headers: { Accept: 'text/plain,text/markdown,text/html,*/*' } });
  if (!r.ok) return { ok: false, error: r.error || 'fetch gagal' };
  const raw = typeof r.data === 'string' ? r.data : JSON.stringify(r.data);
  if (/<html/i.test(raw)) return { ok: true, text: stripHtml(raw).slice(0, 100 * 1024) };
  return { ok: true, text: raw.slice(0, 100 * 1024) };
}

export async function loadGithubFile(
  token: string | undefined,
  spec: string
): Promise<{ ok: true; text: string; path: string } | { ok: false; error: string }> {
  const m =
    spec.match(/github\.com\/([^/]+)\/([^/]+)(?:\/blob\/[^/]+)?\/(.+)/i) ||
    spec.match(/^([^/\s]+)\/([^#\s/]+)#(.+)$/) ||
    spec.match(/^([^/\s]+)\/([^#\s/]+)\/(.+)$/);
  if (!m) return { ok: false, error: 'format: owner/repo/path/SKILL.md atau URL github.com/…' };
  const owner = m[1];
  const repo = m[2].replace(/\.git$/, '');
  const path = m[3];
  const r = await github.contents(token, owner, repo, path);
  if (!r.ok) return { ok: false, error: r.error || 'github contents gagal' };
  const file = Array.isArray(r.data) ? null : r.data;
  if (!file || file.type !== 'file') return { ok: false, error: 'bukan file' };
  const text = github.decodeFile(file);
  if (!text) return { ok: false, error: 'decode gagal' };
  return { ok: true, text, path: `${owner}/${repo}/${path}` };
}

export async function fireWebhook(url: string, body: unknown, token?: string) {
  return apiFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}
