import { LineKind, ProfileConfig, SandboxFile, SkillItem, SourceItem, TerminalLine } from './types';
import { extractUrl, fetchPage, stripHtml } from './liveFetch';
import { apiFetch } from './http';

export const CORE_TOOLS = [
  { id: 'read', name: 'read', description: 'Baca file library / sandbox', enabled: true },
  { id: 'edit', name: 'edit', description: 'Sunting file sandbox', enabled: true },
  { id: 'bash', name: 'bash', description: 'Shell lewat konektor VPS/SSH', enabled: true },
  { id: 'glob', name: 'glob', description: 'Cari path/file by pola', enabled: true },
  { id: 'grep', name: 'grep', description: 'Cari teks di library & sandbox', enabled: true },
  { id: 'list', name: 'list', description: 'Daftar file, skill, agent', enabled: true },
  { id: 'task', name: 'task', description: 'Delegasi tugas ke agent swarm', enabled: true },
  { id: 'skill', name: 'skill', description: 'Load / daftar SKILL.md', enabled: true },
  { id: 'webfetch', name: 'webfetch', description: 'GET URL live', enabled: true },
  { id: 'websearch', name: 'websearch', description: 'Cari web (DuckDuckGo)', enabled: true },
  { id: 'codesearch', name: 'codesearch', description: 'Cari di kode/sumber workspace', enabled: true },
  { id: 'mcp', name: 'mcp', description: 'MCP server terpasang', enabled: true },
  { id: 'generator', name: 'generator', description: 'Generate teks/gambar/dokumen', enabled: true },
  { id: 'execute', name: 'execute', description: 'Eksekusi intent live (GitHub/deploy)', enabled: true },
] as const;

export const LOCAL_ADMIN_MODEL_ID = 'm_local_always_on';

function L(kind: LineKind, text: string): Omit<TerminalLine, 'id' | 'ts'> {
  return { kind, text };
}

export interface ToolCtx {
  profile: ProfileConfig;
  sources: SourceItem[];
  skills: SkillItem[];
  sandbox: SandboxFile[];
}

function enabled(profile: ProfileConfig, name: string): boolean {
  const t = profile.tools.find((x) => x.name === name);
  return t ? t.enabled : true;
}

export async function runCoreTools(raw: string, ctx: ToolCtx): Promise<Omit<TerminalLine, 'id' | 'ts'>[]> {
  const t = raw.toLowerCase();
  const out: Omit<TerminalLine, 'id' | 'ts'>[] = [];
  const on = ctx.profile.tools.filter((x) => x.enabled).map((x) => x.name);

  if (enabled(ctx.profile, 'list') && (/\b(list|daftar file|ls library|ls sandbox)\b/.test(t))) {
    out.push(L('head', '  TOOL  list'));
    out.push(L('out', `  library  ${ctx.sources.length}`));
    ctx.sources.slice(0, 12).forEach((s) => out.push(L('out', `  - ${s.folder || '/'} ${s.name}`)));
    out.push(L('out', `  sandbox  ${ctx.sandbox.length}`));
    ctx.sandbox.slice(0, 8).forEach((s) => out.push(L('out', `  - ${s.path}`)));
  }

  if (enabled(ctx.profile, 'read') && /\b(read |baca |cat )\b/.test(t)) {
    const q = raw.replace(/.*(read|baca|cat)\s+/i, '').trim();
    const hit =
      ctx.sandbox.find((s) => s.path.includes(q) || q.includes(s.path)) ||
      ctx.sources.find((s) => s.name.toLowerCase().includes(q.toLowerCase().slice(0, 40)));
    out.push(L('head', '  TOOL  read'));
    if (hit && 'path' in hit) {
      out.push(L('ok', `  ${hit.path}`));
      hit.content.split('\n').slice(0, 24).forEach((ln) => out.push(L('code', `  ${ln}`)));
    } else if (hit && 'name' in hit) {
      out.push(L('ok', `  ${hit.name}`));
      (hit.content || '').split('\n').slice(0, 24).forEach((ln) => out.push(L('code', `  ${ln}`)));
    } else {
      out.push(L('warn', `  tidak ketemu: ${q.slice(0, 80)}`));
    }
  }

  if (enabled(ctx.profile, 'grep') && /\b(grep |cari teks|search in)\b/.test(t)) {
    const q = raw.replace(/.*(grep|cari teks|search in)\s+/i, '').trim().slice(0, 40).toLowerCase();
    out.push(L('head', `  TOOL  grep  ${q}`));
    let n = 0;
    for (const s of ctx.sources) {
      if ((s.content || '').toLowerCase().includes(q)) {
        out.push(L('ok', `  ${s.name}`));
        n++;
      }
      if (n >= 12) break;
    }
    for (const s of ctx.sandbox) {
      if (s.content.toLowerCase().includes(q)) {
        out.push(L('ok', `  ${s.path}`));
        n++;
      }
      if (n >= 16) break;
    }
    if (!n) out.push(L('dim', '  0 hit'));
  }

  if (enabled(ctx.profile, 'glob') && /\b(glob |find file|cari file)\b/.test(t)) {
    const q = raw.replace(/.*(glob|find file|cari file)\s+/i, '').trim().toLowerCase();
    out.push(L('head', `  TOOL  glob  ${q}`));
    [...ctx.sources.map((s) => s.name), ...ctx.sandbox.map((s) => s.path)]
      .filter((n) => n.toLowerCase().includes(q.replace('*', '')))
      .slice(0, 16)
      .forEach((n) => out.push(L('out', `  ${n}`)));
  }

  if (enabled(ctx.profile, 'skill') && /\b(skill|skill\.md)\b/.test(t)) {
    out.push(L('head', '  TOOL  skill'));
    ctx.skills.filter((s) => s.enabled).forEach((s) => out.push(L('ok', `  ${s.name}  ·  ${s.origin}`)));
  }

  if (enabled(ctx.profile, 'mcp') && /\bmcp\b/.test(t)) {
    out.push(L('head', '  TOOL  mcp'));
    ctx.profile.mcp.forEach((m) => out.push(L(m.enabled ? 'ok' : 'dim', `  ${m.name}  ${m.command}`)));
  }

  if (enabled(ctx.profile, 'task') && /\b(task |delegasi|swarm)\b/.test(t)) {
    out.push(L('head', '  TOOL  task'));
    ctx.profile.agents.slice(0, 10).forEach((a) => out.push(L('out', `  ${a.kind || 'worker'}  ${a.name}`)));
  }

  if (enabled(ctx.profile, 'bash') && /\b(bash |shell |jalankan perintah)\b/.test(t)) {
    out.push(L('head', '  TOOL  bash'));
    out.push(L('warn', '  tidak ada PTY lokal. Pasang konektor SSH/VPS di Ship.'));
  }

  const url = extractUrl(raw);
  if (enabled(ctx.profile, 'webfetch') && url && /\b(fetch|buka|webfetch|http)\b/.test(t)) {
    out.push(L('head', '  TOOL  webfetch'));
    const page = await fetchPage(url);
    out.push(...page);
  }

  if (enabled(ctx.profile, 'websearch') && /\b(websearch|cari web|search web)\b/.test(t)) {
    const q = raw.replace(/.*(websearch|cari web|search web)\s+/i, '').trim() || raw;
    out.push(L('head', `  TOOL  websearch  ${q.slice(0, 60)}`));
    const r = await apiFetch<string>(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`, {
      headers: { Accept: 'text/html' },
    });
    if (!r.ok) {
      out.push(L('err', `  ${r.error}`));
    } else {
      const html = typeof r.data === 'string' ? r.data : '';
      const titles = [...html.matchAll(/class="result__a"[^>]*>([^<]+)/g)].map((m) => m[1]);
      titles.slice(0, 8).forEach((title) => out.push(L('out', `  • ${stripHtml(title)}`)));
      if (!titles.length) out.push(L('dim', `  ${stripHtml(html).slice(0, 240)}`));
    }
  }

  if (enabled(ctx.profile, 'codesearch') && /\b(codesearch|cari kode|search code)\b/.test(t)) {
    const q = raw.replace(/.*(codesearch|cari kode|search code)\s+/i, '').trim().toLowerCase().slice(0, 40);
    out.push(L('head', `  TOOL  codesearch  ${q}`));
    let n = 0;
    for (const s of [...ctx.sandbox, ...ctx.sources.map((x) => ({ path: x.name, content: x.content }))]) {
      const lines = (s.content || '').split('\n');
      lines.forEach((ln, i) => {
        if (n < 14 && ln.toLowerCase().includes(q)) {
          out.push(L('code', `  ${s.path}:${i + 1}  ${ln.slice(0, 100)}`));
          n++;
        }
      });
    }
    if (!n) out.push(L('dim', '  0 hit'));
  }

  if (enabled(ctx.profile, 'generator') && /\b(generator|generate )\b/.test(t)) {
    out.push(L('head', '  TOOL  generator'));
    out.push(L('info', '  multimodal: text / dokumen / image / video — tab Studio atau mode GEN'));
  }

  if (out.length) {
    out.unshift(L('dim', `  tools on  ${on.join(', ') || '—'}`));
  }
  return out;
}
