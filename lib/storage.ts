import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import {
  AgentPersona,
  ApiKeyEntry,
  Bookmark,
  ExtraPlatform,
  GeneratedAsset,
  ModelItem,
  ProfileConfig,
  SandboxFile,
  Session,
  SkillItem,
  SourceItem,
} from './types';
import { seedModels } from './aiCatalog';
import { DEFAULT_AGENTS } from './defaultAgents';

const K = {
  sessions: 'humancli.sessions',
  sources: 'humancli.sources',
  skills: 'humancli.skills',
  models: 'humancli.models',
  keys: 'humancli.keys',
  profile: 'humancli.profile',
  assets: 'humancli.assets',
  onboarded: 'humancli.onboarded',
  extras: 'humancli.extras',
  bookmarks: 'humancli.bookmarks',
  sandbox: 'humancli.sandbox',
};

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export const store = {
  sessions: () => readJson<Session[]>(K.sessions, []),
  saveSessions: (v: Session[]) => writeJson(K.sessions, v),
  sources: () => readJson<SourceItem[]>(K.sources, []),
  saveSources: (v: SourceItem[]) => writeJson(K.sources, v),
  skills: () => readJson<SkillItem[]>(K.skills, []),
  saveSkills: (v: SkillItem[]) => writeJson(K.skills, v),
  models: () => readJson<ModelItem[]>(K.models, []),
  saveModels: (v: ModelItem[]) => writeJson(K.models, v),
  keys: () => readJson<ApiKeyEntry[]>(K.keys, []),
  saveKeys: (v: ApiKeyEntry[]) => writeJson(K.keys, v),
  profile: () => readJson<ProfileConfig | null>(K.profile, null),
  saveProfile: (v: ProfileConfig) => writeJson(K.profile, v),
  assets: () => readJson<GeneratedAsset[]>(K.assets, []),
  saveAssets: (v: GeneratedAsset[]) => writeJson(K.assets, v),
  onboarded: async () => (await AsyncStorage.getItem(K.onboarded)) === '1',
  setOnboarded: () => AsyncStorage.setItem(K.onboarded, '1'),
  extras: () => readJson<ExtraPlatform[]>(K.extras, []),
  saveExtras: (v: ExtraPlatform[]) => writeJson(K.extras, v),
  bookmarks: () => readJson<Bookmark[]>(K.bookmarks, []),
  saveBookmarks: (v: Bookmark[]) => writeJson(K.bookmarks, v),
  sandbox: () => readJson<SandboxFile[]>(K.sandbox, []),
  saveSandbox: (v: SandboxFile[]) => writeJson(K.sandbox, v),
};

export async function setSecret(id: string, value: string): Promise<void> {
  const key = `humancli.secret.${id}`;
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    await AsyncStorage.setItem(key, value);
  }
}

export async function getSecret(id: string): Promise<string | null> {
  const key = `humancli.secret.${id}`;
  try {
    const v = await SecureStore.getItemAsync(key);
    if (v) return v;
  } catch {
    /* web fallback */
  }
  return AsyncStorage.getItem(key);
}

export async function deleteSecret(id: string): Promise<void> {
  const key = `humancli.secret.${id}`;
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    /* ignore */
  }
  await AsyncStorage.removeItem(key);
}

export function maskKey(raw: string): string {
  const t = raw.trim();
  if (t.length < 8) return '••••••••';
  return `${t.slice(0, 3)}••••${t.slice(-4)}`;
}

export function defaultProfile(): ProfileConfig {
  return {
    displayName: 'Dhani Yuliawan',
    handle: 'founder',
    organization: 'MusGo-OS',
    instruction:
      'Kamu adalah Human CLI — Sovereign AI Operating Civilization di dalam MusGo-OS 2in1Ai-inside-OS. Utamakan kejelasan, keamanan defensif, dan eksekusi yang terukur. Bahasa: campur Indonesia teknis + English tooling. Jangan menghasilkan exploit atau payload serangan.',
    autoMode: true,
    orchestrator: true,
    lockAgent: false,
    schedules: [],
    mcp: [
      {
        id: 'mcp_gh',
        name: 'github',
        command: 'npx -y @modelcontextprotocol/server-github',
        enabled: true,
      },
      {
        id: 'mcp_fs',
        name: 'filesystem',
        command: 'npx -y @modelcontextprotocol/server-filesystem ./workspace',
        enabled: true,
      },
    ],
    hooks: [
      {
        id: 'hk_deploy',
        name: 'deploy-notify',
        url: '',
        kind: 'webhook',
        enabled: false,
      },
    ],
    workflows: [
      {
        id: 'wf_readme',
        name: 'README Autogen',
        trigger: 'push:main',
        steps: ['checkout', 'scan repo', 'generate README', 'open PR'],
        enabled: true,
      },
    ],
    tools: [
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
    ],
    memory: [
      {
        id: 'mem_1',
        title: 'Sovereign charter',
        content: 'Musyawarah & Gotong-Royong. Tidak mengeksekusi serangan. Audit defensif saja.',
        pinned: true,
        createdAt: Date.now(),
      },
    ],
    connectors: [
      {
        id: 'c_gh',
        name: 'GitHub',
        type: 'github',
        target: '',
        enabled: true,
        status: 'unknown',
        lastMessage: 'Simpan PAT untuk live API',
      },
      {
        id: 'c_vercel',
        name: 'Vercel',
        type: 'vercel',
        target: '',
        enabled: true,
        status: 'unknown',
        lastMessage: 'Token untuk deploy MusGo-OS',
      },
      {
        id: 'c_gl',
        name: 'GitLab',
        type: 'gitlab',
        target: 'https://gitlab.com',
        enabled: false,
        status: 'unknown',
      },
      {
        id: 'c_do',
        name: 'DigitalOcean',
        type: 'digitalocean',
        target: '',
        enabled: false,
        status: 'unknown',
      },
    ],
    secrets: [],
    agents: DEFAULT_AGENTS.map((a) => ({ ...a, createdAt: Date.now() })),
  };
}

export function defaultModels(): ModelItem[] {
  return seedModels();
}

export function defaultSources(): SourceItem[] {
  return [
    {
      id: 'src_charter',
      name: 'MUSGO-CHARTER.md',
      kind: 'file',
      mime: 'text/markdown',
      sizeLabel: '4.2 KB',
      tags: ['os', 'policy'],
      createdAt: Date.now(),
      content:
        '# MusGo-OS Charter\n\n2in1 Musyawarah & Gotong-Royong.\nSovereign AI Operating Civilization.\n\n- Human-in-the-loop untuk aksi destruktif\n- Security mode = audit defensif, bukan serangan\n- Sandbox library max 100MB\n- SKILL.md sebagai unit kompetensi agent',
    },
    {
      id: 'src_py',
      name: 'Python Docs',
      kind: 'link',
      mime: 'text/html',
      sizeLabel: 'remote',
      url: 'https://docs.python.org/3/',
      tags: ['docs', 'python'],
      createdAt: Date.now(),
      content: 'Sumber resmi dokumentasi Python 3.',
    },
  ];
}

export function defaultSkills(): SkillItem[] {
  return [
    {
      id: 'sk_gh',
      name: 'github-operator',
      description: 'Kelola repo, PR, Actions, dan README otomatis.',
      origin: 'generate',
      enabled: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      markdown: `# SKILL.md — github-operator

## Purpose
Operasikan repositori GitHub: issue, PR, Actions, release notes, README.

## When to use
- User menyebut repo, workflow, README, CI, PAT, branch.

## Procedure
1. Identifikasi remote & default branch
2. Rancang perubahan terkecil yang benar
3. Generate file (YAML/MD) lengkap, tanpa placeholder
4. Jelaskan cara apply (gh / git)

## Guardrails
- Jangan commit secret
- Jangan force-push ke main
`,
    },
    {
      id: 'sk_ship',
      name: 'live-bridge',
      description: 'Pakai konektor live: GitHub PAT, Vercel, GitLab, DO, Cloudflare.',
      origin: 'generate',
      enabled: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      markdown: `# SKILL.md — live-bridge

## Purpose
Operasikan platform eksternal lewat token di tab Ship.

## Commands
- daftar repo saya
- lihat issue owner/repo
- buat issue owner/repo: judul
- commit file ke owner/repo
- status ci owner/repo
- status deploy vercel
- test konektor
- droplet / cloudflare zone / gitlab

## Guardrails
- Token hanya di SecureStore
- Jangan echo PAT ke terminal
- Jangan force-push main
`,
    },
    {
      id: 'sk_sec',
      name: 'defensive-audit',
      description: 'Audit keamanan defensif: secrets, deps, header, OWASP.',
      origin: 'paste',
      enabled: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      markdown: `# SKILL.md — defensive-audit

## Purpose
Review dan hardening. Tidak membuat exploit, PoC serangan, atau payload.

## Checks
- Secrets in repo
- Dependency advisories
- Authn/z gaps
- Input validation
- Security headers

## Output
Temuan → risiko → perbaikan konkret.
`,
    },
  ];
}

export const emptyAgents: AgentPersona[] = [];
