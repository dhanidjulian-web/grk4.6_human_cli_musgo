import { providerById } from './providers';
import type { AppState, LogLevel, Profile } from './types';

export type Route = {
  model: string;
  providerId: string;
  providerName: string;
  keyLabel: string;
  masked: string;
  via: 'manual' | 'autoroute';
};

export type TermLine = { text: string; level: LogLevel };

export function maskSecret(s: string): string {
  if (!s) return '••••••';
  if (s.length <= 10) return '•'.repeat(10);
  return `${s.slice(0, 4)}${'•'.repeat(Math.min(12, Math.max(4, s.length - 8)))}${s.slice(-4)}`;
}

export function estimateTokens(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words * 1.32));
}

export function clockOf(ts: number): string {
  const d = new Date(ts);
  const p = (n: number) => `${n}`.padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export function pickRoute(state: AppState): Route | null {
  const enabled = state.keys.filter((k) => k.enabled);
  if (!enabled.length) return null;
  let key = enabled[0];
  let model: string;
  if (state.router.mode === 'manual') {
    const wanted = state.router.manualModel;
    const match = enabled.find((k) => k.models.includes(wanted));
    key = match ?? enabled[0];
    model = match ? wanted : key.models[0] ?? wanted;
  } else {
    key = enabled[state.rotation % enabled.length];
    const models = key.models.length ? key.models : ['auto'];
    model = models[(state.rotation + 1) % models.length];
  }
  const p = providerById(key.providerId);
  return {
    model,
    providerId: key.providerId,
    providerName: p?.name ?? key.providerId,
    keyLabel: key.label,
    masked: maskSecret(key.secret),
    via: state.router.mode,
  };
}

export function nextPreview(state: AppState): string {
  const r = pickRoute(state);
  if (!r) return 'no key — tambah API key dulu di BYOK';
  return `${r.model} · ${r.providerName} ${r.masked}`;
}

/* ------------------------------------------------------------------ *
 * Reply generator — contextual, bilingual (ID/EN), markdown-lite
 * ------------------------------------------------------------------ */

const ID_WORDS = /(buat|bikin|bantu|gimana|bagaimana|tolong|saya|aku|untuk|yang|jalanin|cek|analisa|perbaiki|rapihin|kerjain|selesaikan|kenapa|bisa|ga|nggak|dong|ya)/i;

export function isIndonesian(prompt: string): boolean {
  return ID_WORDS.test(prompt);
}

type Blueprint = {
  title: string;
  steps: string[];
  code?: { lang: string; body: string };
  close: string;
};

function blueprint(prompt: string, profile: Profile, route: Route, sandboxes: number): Blueprint {
  const p = prompt.toLowerCase();
  const steps = profile.workflow.slice(0, 5).map((s) => s.title);
  const workflowEcho = steps.length ? steps : ['Plan', 'Implement', 'Verify'];

  if (/^(halo|hai|hi|hey|hello|pagi|siang|malam|assalam)/i.test(prompt.trim())) {
    return {
      title: 'Halo — orchestrator siap',
      steps: [
        `Profil aktif: **${profile.name}** (model: ${route.model})`,
        'Router: ' + (route.via === 'manual' ? 'manual — 1 model untuk semua key' : 'random autoroute loop — semua key bergiliran'),
        `Library terpilih: ${profile.libraries.length} · Skill: ${profile.skills.length} · Repo pinned: ${profile.pinnedRepos.length}`,
        `Agent swarm siap: ${profile.swarm.length} agent · Sandbox aktif: ${sandboxes}`,
      ],
      close: 'Mau mulai dari mana: eksekusi workflow, boot sandbox, atau review repo?',
    };
  }

  if (/(sandbox|alpine|microbox|container|docker|vm|isolat|rootfs)/i.test(p)) {
    return {
      title: 'Sandbox — Alpine Kai & Microbox',
      steps: [
        '**kai-alpine** — rootfs Alpine 3.20 dari `github.com/SimonSchubert/Kai`, ukuran kecil, boot < 1 dtk',
        '**microbox** — `github.com/HQarroum/microbox`, image build sendiri + seccomp profile',
        'Keduanya dipakai untuk step eksekusi yang butuh shell sungguhan (build, test, git)',
        'Log tiap perintah ditempel ke Terminal (buka icon terminal di header chat)',
      ],
      code: {
        lang: 'bash',
        body: '# boot dari tab Sandbox, atau dari terminal\nsandbox boot --engine alpine\nsandbox boot --engine microbox\nls /workspace\ngit clone git@github.com:SimonSchubert/Kai.git',
      },
      close: 'Sekarang sandbox aktif: ' + sandboxes + '. Jalankan boot kalau belum.',
    };
  }

  if (/(router|routing|byok|api.?key|provider|model|rotasi|route)/i.test(p)) {
    return {
      title: 'Routing & BYOK',
      steps: [
        `Mode aktif: **${route.via === 'manual' ? 'Manual' : 'Random autoroute loop'}**`,
        `Request ini keluar lewat ${route.providerName} · key ${route.keyLabel} (${route.masked})`,
        'Manual = 1 model dipakai semua key · Autoroute = semua key dipakai untuk semua model, berputar',
        'Semua provider free-freemium terdaftar di BYOK, bisa di-enable/disable per key',
      ],
      code: {
        lang: 'ts',
        body: "// rotasi autoroute (ring buffer)\nconst enabled = keys.filter(k => k.enabled);\nconst key = enabled[state.rotation % enabled.length];\nconst model = key.models[(state.rotation + 1) % key.models.length];",
      },
      close: 'Ganti mode di Settings → Router.',
    };
  }

  if (/(agent|swarm|orchestrat|delegat|multi.?agent|parallel)/i.test(p)) {
    return {
      title: 'Agent Swarm',
      steps: [
        `Profil ${profile.name} punya ${profile.swarm.length} agent (maksimal 30)`,
        'Tiap agent punya: nama, task singkat, prompt, pilihan model/router',
        'Dispatch dari tab Swarm — status real-time: idle → running → done',
        'Workflow jadi urutan langkah, agent menempel pada langkah yang relevan',
      ],
      code: {
        lang: 'ts',
        body: profile.swarm
          .slice(0, 4)
          .map((a) => `swarm.spawn({ name: '${a.name}', task: '${a.task}', model: '${a.model}' });`)
          .join('\n'),
      },
      close: 'Buka tab Swarm lalu tekan Dispatch untuk menjalankan.',
    };
  }

  if (/(deploy|vercel|rilis|release|ship|ci\/cd|ci cd|github action|workflow)/i.test(p)) {
    return {
      title: 'Rilis & pipeline',
      steps: [
        `Urutan workflow profil: ${workflowEcho.join(' → ')}`,
        'Connector GitHub dipakai untuk push branch + buka PR',
        'Connector Vercel dipakai untuk preview deploy & rollback',
        'Setiap langkah ditulis ke logger dengan level info/ok/error',
      ],
      code: {
        lang: 'bash',
        body: 'git checkout -b feat/orchestrator\nnpm run test -- --ci\nvercel deploy --prebuilt --token $VERCEL_TOKEN',
      },
      close: 'Validasi repo & PAT dulu di Settings → Repository supaya git aman.',
    };
  }

  if (/(review|audit|refactor|perbaiki|bug|optim|bersihkan|rapih)/i.test(p)) {
    return {
      title: 'Review & perbaikan',
      steps: [
        `Scope: ${profile.libraries.slice(0, 3).join(', ') || 'seluruh workspace'}`,
        `Skill aktif: ${profile.skills.slice(0, 3).join(', ') || 'code-review'}`,
        'Temuan diprioritaskan: correctness → security → performance → style',
        'Patch ditulis sebagai diff, kamu approve sebelum dieksekusi',
      ],
      code: {
        lang: 'diff',
        body: "- const res = await fetch(url)\n+ const ctl = new AbortController()\n+ const timer = setTimeout(() => ctl.abort(), 8000)\n+ const res = await fetch(url, { signal: ctl.signal })\n+ clearTimeout(timer)",
      },
      close: 'Mau saya kerjakan penuh lewat workflow atau diff saja dulu?',
    };
  }

  return {
    title: 'Rencana eksekusi',
    steps: [
      `Permintaan: \"${prompt.slice(0, 90)}${prompt.length > 90 ? '…' : ''}\"`,
      `Dijalankan via ${profile.name} · ${route.model} · ${route.providerName} ${route.masked}`,
      `Langkah workflow: ${workflowEcho.join(' → ')}`,
      `Konteks: ${profile.pinnedRepos.length} repo pinned, ${profile.env.length} env var, ${profile.libraries.length} file library`,
      'Semua aksi (git, API, sandbox) memakai connector & key yang sudah divalidasi',
    ],
    code: {
      lang: 'ts',
      body: `const job = orchestrator.run({\n  profile: '${profile.name}',\n  router: '${route.via}',\n  model: '${route.model}',\n  prompt: ${JSON.stringify(prompt.slice(0, 48) + (prompt.length > 48 ? '…' : ''))},\n});`,
    },
    close: 'Konfirmasi untuk eksekusi penuh, atau minta saya ubah pendekatannya.',
  };
}

export function craftReply(prompt: string, profile: Profile, route: Route, sandboxes: number): string {
  const indo = isIndonesian(prompt);
  const b = blueprint(prompt, profile, route, sandboxes);
  const head = indo ? `### ${b.title}` : `### ${b.title}`;
  const lines: string[] = [head, ''];
  b.steps.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
  if (b.code) {
    lines.push('', '```' + b.code.lang, b.code.body, '```');
  }
  lines.push('', b.close);
  lines.push(
    '',
    `> route: ${route.via} · ${route.model} · ${route.providerName} ${route.masked} · ~${estimateTokens(prompt)} tok in`,
  );
  return lines.join('\n');
}

export function sessionTitle(prompt: string): string {
  const clean = prompt.replace(/\s+/g, ' ').trim();
  return clean.length > 38 ? clean.slice(0, 38) + '…' : clean || 'New session';
}

/* ------------------------------------------------------------------ *
 * Sandbox boot scripts
 * ------------------------------------------------------------------ */

export function bootScript(engine: 'alpine' | 'microbox', name: string): TermLine[] {
  if (engine === 'alpine') {
    return [
      { text: `$ sandbox boot --engine alpine --name ${name}`, level: 'tool' },
      { text: 'pulling ghcr.io/simonschubert/kai:alpine-3.20 … 42.1 MB', level: 'info' },
      { text: 'unpacking rootfs ▸ ▸ ▸ ▸ ▸ ▸ ▸ ▸ ok', level: 'info' },
      { text: 'mounting /proc /sys /dev/pts', level: 'debug' },
      { text: 'net: tun0 up · dns=1.1.1.1 · mtu=1500', level: 'info' },
      { text: 'pkg: git 2.45.2 · nodejs 20.15 · python3.12 · busybox 1.36', level: 'tool' },
      { text: 'init → /sbin/init (pid 1)', level: 'debug' },
      { text: `sandbox '${name}' ready · ssh root@127.0.0.1 -p 2222`, level: 'ok' },
    ];
  }
  return [
    { text: `$ sandbox boot --engine microbox --name ${name}`, level: 'tool' },
    { text: 'pulling hqarroum/microbox:latest … 68.4 MB', level: 'info' },
    { text: 'exporting container filesystem ▸ overlayfs upper=/tmp/microbox/upper', level: 'info' },
    { text: 'cgroup v2 ready · cpu=2 · mem=512m · pids=256', level: 'info' },
    { text: 'runtime: qemu-lite · seccomp profile=default', level: 'tool' },
    { text: 'seccomp: 312 syscalls allowed · 41 blocked', level: 'debug' },
    { text: `sandbox '${name}' ready · exec via 'sandbox exec ${name} <cmd>'`, level: 'ok' },
  ];
}

/* ------------------------------------------------------------------ *
 * Terminal command executor
 * ------------------------------------------------------------------ */

export function execCommand(raw: string, state: AppState): { lines: TermLine[]; clear?: boolean } {
  const cmd = raw.trim();
  const low = cmd.toLowerCase();
  const profile = state.profiles.find((p) => p.id === state.activeProfileId) ?? state.profiles[0];
  const enabled = state.keys.filter((k) => k.enabled);

  if (!cmd) return { lines: [] };
  if (low === 'clear' || low === 'cls') return { lines: [], clear: true };

  if (low === 'help' || low === 'man') {
    return {
      lines: [
        { text: 'perintah yang tersedia', level: 'ok' },
        { text: '  help                daftar perintah', level: 'info' },
        { text: '  ls / pwd / whoami   inspect workspace', level: 'info' },
        { text: '  uname -a / cat /etc/os-release', level: 'info' },
        { text: '  git status | git clone <url>', level: 'info' },
        { text: '  docker ps | docker images', level: 'info' },
        { text: '  sandbox boot alpine|microbox', level: 'info' },
        { text: '  keys | models | route | agents | profiles', level: 'info' },
        { text: '  logs | history | echo <teks> | clear', level: 'info' },
      ],
    };
  }
  if (low === 'ls' || low === 'ls -la' || low === 'll') {
    const rows = [
      'drwxr-xr-x  workspace/',
      'drwxr-xr-x  repos/          ' + state.repos.map((r) => r.name).join(' '),
      '-rw-r--r--  package.json',
      '-rw-r--r--  docker-compose.yml',
      'drwxr-xr-x  profiles/       ' + state.profiles.map((p) => p.name.replace(/\s+/g, '-')).join(' '),
      'drwxr-xr-x  logs/           ' + state.logs.length + ' entries',
    ];
    return { lines: rows.map((r) => ({ text: r, level: 'info' as LogLevel })) };
  }
  if (low === 'pwd') return { lines: [{ text: '/workspace/filosofi', level: 'info' }] };
  if (low === 'whoami') return { lines: [{ text: `${state.account.handle} · plan ${state.account.plan}`, level: 'info' }] };
  if (low.startsWith('uname')) {
    return { lines: [{ text: 'Linux kai-alpine 6.6.8-alpine #1 SMP x86_64 GNU/Linux', level: 'info' }] };
  }
  if (low.startsWith('cat /etc/os-release')) {
    return {
      lines: [
        { text: 'NAME=Alpine Linux', level: 'info' },
        { text: 'ID=alpine', level: 'info' },
        { text: 'VERSION_ID=3.20.3', level: 'info' },
        { text: 'PRETTY_NAME="Alpine Linux v3.20"', level: 'info' },
      ],
    };
  }
  if (low === 'git status') {
    const lines: TermLine[] = [{ text: 'On branch ' + (state.repos[0]?.branch ?? 'main'), level: 'info' }];
    state.repos.slice(0, 3).forEach((r) => {
      lines.push({
        text: `${r.valid ? '✔' : '✖'} ${r.name.padEnd(18)} ${r.auth} · ${r.branch} · ${r.url}`,
        level: r.valid ? 'ok' : 'warn',
      });
    });
    lines.push({ text: 'nothing to commit, working tree clean', level: 'info' });
    return { lines };
  }
  if (low.startsWith('git clone')) {
    const url = cmd.slice(9).trim() || '<url>';
    return {
      lines: [
        { text: `cloning ${url}`, level: 'tool' },
        { text: 'remote: enumerating objects: 1,284, done.', level: 'debug' },
        { text: 'Receiving objects: 100% (1284/1284), 3.12 MiB | 9.4 MiB/s', level: 'info' },
        { text: 'checking out … done', level: 'ok' },
      ],
    };
  }
  if (low.startsWith('docker ps')) {
    const rows = state.sandboxes.filter((s) => s.status === 'running');
    if (!rows.length) return { lines: [{ text: 'CONTAINER ID   IMAGE   STATUS   PORTS  (kosong)', level: 'warn' }] };
    return {
      lines: rows.map((s) => ({
        text: `${s.pid.toString().padEnd(14)}${s.engine === 'alpine' ? 'kai:alpine-3.20' : 'microbox:latest'}   running   0.0.0.0:2222->22/tcp`,
        level: 'ok' as LogLevel,
      })),
    };
  }
  if (low.startsWith('docker images')) {
    return {
      lines: [
        { text: 'kai            alpine-3.20   42MB   3 days ago', level: 'info' },
        { text: 'microbox       latest       68MB   6 days ago', level: 'info' },
      ],
    };
  }
  if (low.startsWith('sandbox boot')) {
    const engine: 'alpine' | 'microbox' = low.includes('microbox') ? 'microbox' : 'alpine';
    const name = engine === 'alpine' ? 'kai-alpine-01' : 'microbox-01';
    return { lines: bootScript(engine, name) };
  }
  if (low === 'keys' || low === 'byok') {
    if (!state.keys.length) return { lines: [{ text: 'belum ada API key — tambah di Settings → BYOK', level: 'warn' }] };
    return {
      lines: state.keys.map((k) => ({
        text: `${k.enabled ? '●' : '○'} ${k.providerId.padEnd(13)} ${k.label.padEnd(16)} ${maskSecret(k.secret)}  [${k.models.length} model]`,
        level: (k.enabled ? 'ok' : 'debug') as LogLevel,
      })),
    };
  }
  if (low === 'models') {
    const lines: TermLine[] = [];
    state.keys.filter((k) => k.enabled).forEach((k) => {
      k.models.forEach((m) => lines.push({ text: `${k.providerId.padEnd(13)} ${m}`, level: 'info' }));
    });
    return { lines: lines.length ? lines : [{ text: 'tidak ada model aktif', level: 'warn' }] };
  }
  if (low === 'route') {
    const r = pickRoute(state);
    return {
      lines: [
        { text: `mode: ${state.router.mode}`, level: 'info' },
        { text: `manual model: ${state.router.manualModel}`, level: 'info' },
        { text: `rotation index: ${state.rotation} / ${enabled.length || 0} keys`, level: 'debug' },
        { text: `next request → ${r ? `${r.model} via ${r.providerName} ${r.masked}` : 'no key'}`, level: r ? 'ok' : 'warn' },
      ],
    };
  }
  if (low === 'agents' || low === 'swarm') {
    if (!profile) return { lines: [{ text: 'tidak ada profil aktif', level: 'warn' }] };
    return {
      lines: profile.swarm.map((a) => ({
        text: `${a.status.toUpperCase().padEnd(8)} ${a.name.padEnd(14)} ${a.model.padEnd(22)} ${a.task}`,
        level: (a.status === 'done' ? 'ok' : a.status === 'running' ? 'tool' : 'info') as LogLevel,
      })),
    };
  }
  if (low === 'profiles') {
    return {
      lines: state.profiles.map((p) => ({
        text: `${p.id === state.activeProfileId ? '▶' : ' '} ${p.name.padEnd(22)} model=${p.model} swarm=${p.swarm.length} steps=${p.workflow.length}`,
        level: 'info' as LogLevel,
      })),
    };
  }
  if (low === 'logs') {
    return {
      lines: state.logs.slice(-12).map((l) => ({ text: `${clockOf(l.ts)} [${l.level}] ${l.source}: ${l.text}`, level: l.level })),
    };
  }
  if (low === 'history') {
    if (!state.terminalHistory.length) return { lines: [{ text: '(history kosong)', level: 'debug' }] };
    return { lines: state.terminalHistory.slice(-12).map((h, i) => ({ text: `  ${i + 1}  ${h}`, level: 'info' as LogLevel })) };
  }
  if (low.startsWith('echo ')) return { lines: [{ text: cmd.slice(5), level: 'info' }] };

  return {
    lines: [
      { text: `filosofi: command not found: ${cmd.split(' ')[0]}`, level: 'error' },
      { text: 'ketik "help" untuk daftar perintah', level: 'debug' },
    ],
  };
}

export const QUICK_COMMANDS = ['help', 'ls', 'git status', 'docker ps', 'route', 'keys', 'agents'];
