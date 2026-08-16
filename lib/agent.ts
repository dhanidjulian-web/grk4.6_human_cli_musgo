import { AgentMode, AgentPersona, LineKind, ProfileConfig, SkillItem, SourceItem, TerminalLine } from './types';
import { uid } from './id';
import { getMode } from './modes';

export interface AgentContext {
  profile: ProfileConfig;
  skills: SkillItem[];
  sources: SourceItem[];
  activeModelName?: string;
  history: string[];
  agent?: AgentPersona;
}

export interface AgentResult {
  mode: AgentMode;
  reason: string;
  lines: Omit<TerminalLine, 'id' | 'ts'>[];
}

const URL_RE = /https?:\/\/[^\s]+/i;
const DOMAINISH = /\b([a-z0-9-]+\.)+(com|org|net|io|dev|id|ai|app|co)(\/\S*)?/i;

function hasAny(text: string, words: string[]): boolean {
  return words.some((w) => text.includes(w));
}

export function detectMode(raw: string, auto: boolean, locked: AgentMode): { mode: AgentMode; reason: string } {
  if (!auto && locked !== 'auto') {
    return { mode: locked, reason: `Manual lock → ${getMode(locked).short}` };
  }

  const t = raw.toLowerCase();

  if (hasAny(t, ['gambar', 'image', 'poster', 'ikon', 'icon', 'generate image', 'text to image', 'text-to-image', 'lukis', 'ilustrasi', 'banner'])) {
    return { mode: 'multimodal', reason: 'Intent visual / text-to-image' };
  }

  if (hasAny(t, ['penetrasi', 'pentest', 'penestrasi', 'exploit', 'payload', 'sql injection', 'xss', 'hack', 'serang', 'brute force'])) {
    return { mode: 'pentest', reason: 'Permintaan pentest → review defensif saja' };
  }

  if (hasAny(t, ['audit', 'scan', 'owasp', 'cve', 'secret scan', 'hardening', 'vulnerability', 'keamanan', 'security review'])) {
    return { mode: 'security', reason: 'Review / audit keamanan' };
  }

  if (
    hasAny(t, ['buka web', 'buka site', 'buka url', 'buka link', 'browse', 'browser', 'dokumentasi', 'docs', 'documentation']) ||
    URL_RE.test(raw) ||
    (hasAny(t, ['buka', 'kunjungi', 'fetch']) && DOMAINISH.test(t))
  ) {
    return { mode: 'browser', reason: 'Fetch URL langsung' };
  }

  if (hasAny(t, ['ssh ', 'ssh ke', 'vps', 'remote host', 'systemd', 'journalctl', 'tmux'])) {
    return { mode: 'ssh', reason: 'Remote — butuh konektor SSH' };
  }

  if (hasAny(t, ['sftp', 'upload file', 'download file', 'transfer file', 'scp '])) {
    return { mode: 'sftp', reason: 'Transfer — butuh konektor SFTP' };
  }

  if (hasAny(t, ['deploy', 'vercel', 'nginx', 'docker compose', 'ci/cd', 'rilis', 'release', 'kubernetes', 'k8s', 'netlify', 'cloudflare', 'droplet', 'digitalocean'])) {
    return { mode: 'deploy', reason: 'Rilis / cloud' };
  }

  if (hasAny(t, ['github', 'repo ', 'repositori', 'pull request', 'issue', 'commit', 'pat token', 'gh '])) {
    return { mode: 'code', reason: 'GitHub / source control' };
  }

  if (hasAny(t, ['github action', 'workflow', 'readme', 'buatkan code', 'tuliskan kode', 'refactor', 'script', 'function', 'typescript', 'python', 'yaml', 'dockerfile', 'buatkan file'])) {
    return { mode: 'code', reason: 'Generate / sunting kode' };
  }

  if (hasAny(t, ['npm ', 'git ', 'ls ', 'cd ', 'docker ', 'pip ', 'apt ', 'chmod', 'mkdir', 'cat ', 'jalankan perintah', 'terminal'])) {
    return { mode: 'cli', reason: 'Shell — butuh konektor / runtime' };
  }

  if (hasAny(t, ['rencanakan', 'plan ', 'otonom', 'autonomous', 'kerjakan proyek', 'multi langkah', 'agent '])) {
    return { mode: 'agent', reason: 'Tugas multi-langkah' };
  }

  if (hasAny(t, ['apa ', 'kenapa', 'bagaimana', 'jelaskan', 'halo', 'hai', 'thanks', 'terima kasih', 'siapa'])) {
    return { mode: 'chat', reason: 'Percakapan' };
  }

  return { mode: 'agent', reason: 'Orchestrator memilih agent' };
}

export function L(kind: LineKind, text: string): Omit<TerminalLine, 'id' | 'ts'> {
  return { kind, text };
}

export function banner(mode: AgentMode, reason: string, extra?: { model?: string; agent?: string }): Omit<TerminalLine, 'id' | 'ts'>[] {
  const m = getMode(mode);
  return [
    L('sep', '────────────────────────────────────────────────'),
    L('head', `◎  MODE ${m.short.padEnd(6)}  ${m.label}`),
    L('info', `   router   ${reason}`),
    L('dim', `   agent    ${extra?.agent || '—'}`),
    L('dim', `   model    ${extra?.model || 'chain fallback'}`),
    L('sep', '────────────────────────────────────────────────'),
  ];
}

export function refuseOffensive(raw: string): Omit<TerminalLine, 'id' | 'ts'>[] {
  return [
    L('warn', '!  permintaan ofensif ditolak'),
    L('err', '  Human CLI tidak membuat exploit, payload, atau serangan.'),
    L('info', '  Hanya audit defensif. Tidak ada modul simulasi serangan.'),
    L('dim', `  catatan: ${raw.slice(0, 120)}`),
  ];
}

export function wrapCode(title: string, body: string): Omit<TerminalLine, 'id' | 'ts'>[] {
  const lines = body.replace(/\r\n/g, '\n').split('\n');
  return [
    L('ok', `wrote  ${title}`),
    L('dim', `  ${lines.length} lines`),
    L('code', `┌─ ${title}`),
    ...lines.map((ln) => L('code', `│ ${ln}`)),
    L('code', '└─'),
  ];
}

export function githubActionReadme(): string {
  const ref = '${{ github.ref_name }}';
  const sha = '${{ github.sha }}';
  const repo = '${{ github.repository }}';
  return [
    'name: README Autogen',
    '',
    'on:',
    '  push:',
    '    branches: [main]',
    '  workflow_dispatch:',
    '',
    'permissions:',
    '  contents: write',
    '  pull-requests: write',
    '',
    'jobs:',
    '  readme:',
    '    runs-on: ubuntu-latest',
    '    steps:',
    '      - uses: actions/checkout@v4',
    '      - name: Inventory',
    '        run: find . -type f -not -path "./.git/*" | head -n 80 > /tmp/tree.txt',
    '      - name: Compose',
    '        run: |',
    `          echo "# ${repo}" > README.md`,
    `          echo "branch ${ref} sha ${sha}" >> README.md`,
    '          cat /tmp/tree.txt >> README.md',
    '      - uses: peter-evans/create-pull-request@v6',
    '        with:',
    "          commit-message: 'docs: regenerate README'",
    "          title: 'docs: README autogen'",
    '          branch: chore/readme-autogen',
  ].join('\n');
}

export function runAgent(raw: string, ctx: AgentContext, locked: AgentMode): AgentResult {
  const { mode, reason } = detectMode(raw, ctx.profile.autoMode, locked);
  const enabledSkills = ctx.skills.filter((s) => s.enabled);
  const lines = [
    ...banner(mode, reason, { model: ctx.activeModelName, agent: ctx.agent?.name }),
    L('dim', `   skills   ${enabledSkills.map((s) => s.name).join(', ') || '(none)'}`),
    L('dim', `   sources  ${ctx.sources.length}  ·  mcp ${ctx.profile.mcp.filter((m) => m.enabled).length}  ·  hooks ${ctx.profile.hooks.filter((h) => h.enabled).length}`),
    L('out', ''),
  ];

  if ((mode === 'security' || mode === 'pentest') && hasAny(raw.toLowerCase(), ['exploit', 'payload', 'penetrasi', 'pentest', 'penestrasi', 'hack', 'serang', 'sql injection', 'xss', 'brute'])) {
    return { mode: mode === 'pentest' ? 'pentest' : 'security', reason, lines: [...lines, ...refuseOffensive(raw)] };
  }

  if (mode === 'cli' || mode === 'ssh' || mode === 'sftp') {
    lines.push(
      L('warn', '  tidak ada shell / PTY di perangkat ini'),
      L('info', '  pasang konektor SSH/SFTP + host di Ship, atau jalankan perintah lewat GitHub Actions / VPS API'),
    );
  }

  const t = raw.toLowerCase();
  if (mode === 'code' && (t.includes('github action') || (t.includes('workflow') && t.includes('readme')))) {
    lines.push(...wrapCode('.github/workflows/readme-autogen.yml', githubActionReadme()));
    lines.push(L('info', '  file nyata. Commit lewat Ship → repo, atau: commit file ke owner/repo'));
  }

  return { mode, reason, lines };
}

export function materializeLines(parts: Omit<TerminalLine, 'id' | 'ts'>[]): TerminalLine[] {
  const ts = Date.now();
  return parts.map((p, i) => ({
    ...p,
    id: uid('ln'),
    ts: ts + i,
  }));
}

export function bootLines(): TerminalLine[] {
  return materializeLines([
    L('head', 'MUSGO-OS  2in1Ai-inside-OS'),
    L('dim', 'Musyawarah & Gotong-Royong  ·  Sovereign AI Operating Civilization'),
    L('sep', '────────────────────────────────────────────────'),
    L('ok', 'kernel     human-cli  2026.4.3'),
    L('ok', 'policy     live-only  ·  no mock  ·  no fake shell'),
    L('ok', 'orch       profil memilih agent per input'),
    L('ok', 'infer      BYOK multi-key + fallback  ·  pollinations no-key'),
    L('ok', 'bridge     github · vercel · gitlab · do · cf · …'),
    L('dim', '© 2026 Dhani Yuliawan  ·  All Rights Reserved'),
    L('sep', '────────────────────────────────────────────────'),
    L('info', 'Pasang API key (boleh beberapa per platform) di Models. PAT di Ship.'),
    L('dim', 'contoh:  daftar repo saya'),
    L('dim', 'contoh:  https://docs.python.org/3/'),
  ]);
}
