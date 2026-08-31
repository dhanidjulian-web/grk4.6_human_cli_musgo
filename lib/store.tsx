import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { useColorScheme } from 'react-native';
import { dark, light, type Palette } from './theme';
import type { AppState, ChatMessage, LogLevel, Profile } from './types';

const STORAGE_KEY = 'filosofi.state.v1';

export function uid(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/* ------------------------------- seed ---------------------------------- */

function seedState(): AppState {
  const now = Date.now();

  const profileDefault: Profile = {
    id: 'pf_default',
    name: 'Default Orchestrator',
    model: 'auto',
    systemPrompt:
      'Kamu adalah Filosofi — orchestrator engineering otonom. Kerja bertahap: baca konteks repo, susun rencana pendek, eksekusi per langkah, verifikasi dengan test/lint, lalu laporkan diff dan risiko. Jangan pernah commit atau deploy tanpa approval. Gunakan connector & API key yang tersedia saja.',
    env: [
      { id: 'ev1', k: 'GITHUB_PAT', v: 'ghp_••••••••••••9f21' },
      { id: 'ev2', k: 'HF_TOKEN', v: 'hf_••••••••••••3ac7' },
      { id: 'ev3', k: 'VERCEL_TOKEN', v: 'vrc_••••••••••••b092' },
    ],
    libraries: ['src/lib/router.ts', 'src/lib/store.ts', 'package.json', '.github/workflows/ci.yml'],
    skills: ['code-review', 'test-generation', 'release-cut'],
    pinnedRepos: ['rp_core', 'rp_kai'],
    workflow: [
      { id: 'wf1', title: 'Konteks', detail: 'Baca repo pinned, library terpilih, dan log terakhir' },
      { id: 'wf2', title: 'Rencana', detail: 'Susun langkah max 5, cantumkan risiko' },
      { id: 'wf3', title: 'Implement', detail: 'Patch minimal lewat agent swarm' },
      { id: 'wf4', title: 'Verifikasi', detail: 'Jalankan test + lint di sandbox' },
      { id: 'wf5', title: 'Laporan', detail: 'Ringkas diff, metrik, dan langkah berikutnya' },
    ],
    connectors: ['cn_github', 'cn_google', 'cn_vercel'],
    swarm: [
      { id: 'ag1', name: 'planner', task: 'Susun rencana & pecah task', prompt: 'Ubah permintaan jadi 3-5 langkah konkret.', model: 'auto', status: 'idle' },
      { id: 'ag2', name: 'coder', task: 'Tulis patch TypeScript', prompt: 'Implementasi langkah dengan diff minimal.', model: 'auto', status: 'idle' },
      { id: 'ag3', name: 'verifier', task: 'Jalankan test & lint', prompt: 'Buktikan perubahan aman, laporkan kegagalan.', model: 'auto', status: 'idle' },
    ],
    createdAt: now - 86400000 * 6,
  };

  const profileSandbox: Profile = {
    id: 'pf_sandbox',
    name: 'Sandbox Ops',
    model: 'auto',
    systemPrompt:
      'Kamu operator sandbox. Tugas: boot Alpine (Kai) atau Microbox, siapkan toolchain, jalankan perintah build/test, dan jaga agar tetap terisolasi dari host.',
    env: [
      { id: 'ev4', k: 'SSH_KEY_SANDBOX', v: '-----BEGIN••••••END-----' },
      { id: 'ev5', k: 'REGISTRY', v: 'ghcr.io/filosofi' },
    ],
    libraries: ['docker-compose.yml', 'Dockerfile'],
    skills: ['log-triage', 'security-audit', 'perf-profiling'],
    pinnedRepos: ['rp_microbox', 'rp_kai'],
    workflow: [
      { id: 'wf6', title: 'Boot sandbox', detail: 'Pilih engine Alpine/Microbox lalu tunggu ready' },
      { id: 'wf7', title: 'Toolchain', detail: 'Pasang git, node, python sesuai kebutuhan' },
      { id: 'wf8', title: 'Eksekusi', detail: 'Jalankan build/test, stream output ke Terminal' },
      { id: 'wf9', title: 'Teardown', detail: 'Simpan log, hentikan instance' },
    ],
    connectors: ['cn_docker', 'cn_hf'],
    swarm: [
      { id: 'ag4', name: 'boot-runner', task: 'Boot & health check sandbox', prompt: 'Pastikan init sehat sebelum dipakai.', model: 'auto', status: 'idle' },
      { id: 'ag5', name: 'pkg-curator', task: 'Kelola paket & image', prompt: 'Jaga image tetap ramping.', model: 'auto', status: 'idle' },
    ],
    createdAt: now - 86400000 * 2,
  };

  const welcome: ChatMessage = {
    id: 'msg_seed',
    role: 'system',
    text: 'Sesi baru dibuat. Profil **Default Orchestrator** aktif · router manual.\n\nTanya apa saja, atau coba: *boot sandbox alpine*, *cek routing byok*, *buat agent swarm untuk repo ini*.',
    ts: now - 60000,
  };

  return {
    hydrated: false,
    account: { name: 'Arcada Operator', handle: '@filosofi-dev', plan: 'BYOK · self-hosted' },
    appearance: 'system',
    streamSpeed: 16,
    logLevel: 'info',
    connectors: [
      { id: 'cn_google', slug: 'google', name: 'Google', account: 'dev@filosofi.app', connected: true, scopes: ['openid', 'email', 'drive.readonly'], connectedAt: now - 86400000 * 9 },
      { id: 'cn_github', slug: 'github', name: 'GitHub', account: '@filosofi-dev', connected: true, scopes: ['repo', 'read:org', 'workflow'], connectedAt: now - 86400000 * 5 },
      { id: 'cn_vercel', slug: 'vercel', name: 'Vercel', account: null, connected: false, scopes: ['deployments:write', 'projects:read'] },
      { id: 'cn_hf', slug: 'huggingface', name: 'Hugging Face', account: 'filosofi-bot', connected: true, scopes: ['inference-api', 'models:read'], connectedAt: now - 86400000 * 2 },
      { id: 'cn_n8n', slug: 'n8n', name: 'n8n', account: null, connected: false, scopes: ['execute:workflow', 'credentials:read'] },
    ],
    keys: [
      {
        id: 'k1',
        providerId: 'openrouter',
        label: 'or-free-main',
        secret: 'sk-or-v1-8f21c09ab4d7e5120c3f',
        enabled: true,
        models: ['meta-llama/llama-3.3-70b-instruct:free', 'qwen/qwen-2.5-72b-instruct:free', 'deepseek/deepseek-r1:free'],
        createdAt: now - 86400000 * 7,
        lastTest: { ok: true, ms: 214, at: now - 86400000 },
      },
      {
        id: 'k2',
        providerId: 'gemini',
        label: 'ai-studio-flash',
        secret: 'AIzaSyD9f21kQm7Vx0AbCdEfGh',
        enabled: true,
        models: ['gemini-2.0-flash', 'gemini-1.5-flash'],
        createdAt: now - 86400000 * 4,
        lastTest: { ok: true, ms: 168, at: now - 86400000 },
      },
      {
        id: 'k3',
        providerId: 'mistral',
        label: 'mistral-free',
        secret: 'mistral_4Kd91xQp0LmN5tRv',
        enabled: true,
        models: ['mistral-small-latest', 'open-mistral-nemo'],
        createdAt: now - 86400000 * 3,
        lastTest: null,
      },
      {
        id: 'k4',
        providerId: 'groq',
        label: 'groq-lpu',
        secret: 'gsk_91xQp0LmN5tRvKd843a',
        enabled: true,
        models: ['llama-3.3-70b-versatile', 'gemma2-9b-it'],
        createdAt: now - 86400000,
        lastTest: null,
      },
      {
        id: 'k5',
        providerId: 'nvidia',
        label: 'nim-credit',
        secret: 'nvapi-71xQp0LmN5tRvKd843a',
        enabled: false,
        models: ['nvidia/llama-3.1-405b-instruct'],
        createdAt: now - 86400000,
        lastTest: null,
      },
    ],
    router: { mode: 'manual', manualModel: 'meta-llama/llama-3.3-70b-instruct:free' },
    rotation: 0,
    repos: [
      { id: 'rp_core', name: 'filosofi/core', url: 'https://github.com/arcada/filosofi-core.git', branch: 'main', auth: 'PAT', valid: true, lastCheck: now - 86400000 },
      { id: 'rp_kai', name: 'SimonSchubert/Kai', url: 'git@github.com:SimonSchubert/Kai.git', branch: 'master', auth: 'SSH', valid: true, lastCheck: now - 86400000 * 2 },
      { id: 'rp_microbox', name: 'HQarroum/microbox', url: 'https://github.com/HQarroum/microbox.git', branch: 'main', auth: 'HTTP', valid: false, lastCheck: undefined },
    ],
    profiles: [profileDefault, profileSandbox],
    activeProfileId: 'pf_default',
    sessions: [
      {
        id: 'se_seed',
        title: 'Sesi awal orchestrator',
        profileId: 'pf_default',
        messages: [welcome],
        createdAt: now - 60000,
        updatedAt: now - 60000,
      },
    ],
    activeSessionId: 'se_seed',
    logs: [
      { id: 'lg1', ts: now - 120000, level: 'info', source: 'boot', text: 'filosofi runtime 1.0.0 · workspace /workspace/filosofi' },
      { id: 'lg2', ts: now - 118000, level: 'ok', source: 'byok', text: '4 key aktif dari 5 terdaftar (openrouter, gemini, mistral, groq)' },
      { id: 'lg3', ts: now - 116000, level: 'info', source: 'router', text: 'mode=manual · model=meta-llama/llama-3.3-70b-instruct:free' },
      { id: 'lg4', ts: now - 114000, level: 'warn', source: 'repo', text: 'HQarroum/microbox belum divalidasi (HTTP)' },
    ],
    sandboxes: [],
    terminalHistory: [],
  };
}

/* ------------------------------- store --------------------------------- */

type Action = { t: 'hydrate'; s: AppState } | { t: 'set'; fn: (s: AppState) => AppState } | { t: 'reset' };

function reducer(state: AppState, action: Action): AppState {
  switch (action.t) {
    case 'hydrate':
      return { ...action.s, hydrated: true };
    case 'set':
      return action.fn(state);
    case 'reset':
      return { ...seedState(), hydrated: true };
    default:
      return state;
  }
}

type StoreCtx = {
  state: AppState;
  theme: Palette;
  setState: (fn: (s: AppState) => AppState) => void;
  pushLog: (level: LogLevel, source: string, text: string) => void;
  addMessage: (sessionId: string, msg: ChatMessage) => void;
  newSession: (title?: string) => string;
  resetAll: () => void;
};

const Ctx = createContext<StoreCtx | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined as unknown as AppState, seedState);
  const scheme = useColorScheme();
  const hydratedRef = useRef(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      let next = seedState();
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<AppState>;
          next = { ...next, ...parsed };
          // agents always come back idle
          next.profiles = next.profiles.map((p) => ({ ...p, swarm: p.swarm.map((a) => ({ ...a, status: 'idle' as const })) }));
        }
      } catch {
        /* corrupt storage → fall back to seed */
      }
      if (!alive) return;
      hydratedRef.current = true;
      dispatch({ t: 'hydrate', s: { ...next, hydrated: true } });
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    const toSave = { ...state, hydrated: false, logs: state.logs.slice(-250) };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave)).catch(() => undefined);
  }, [state]);

  const setState = useCallback((fn: (s: AppState) => AppState) => dispatch({ t: 'set', fn }), []);

  const pushLog = useCallback((level: LogLevel, source: string, text: string) => {
    dispatch({
      t: 'set',
      fn: (s) => {
        if (s.logLevel === 'warn' && (level === 'info' || level === 'debug' || level === 'tool')) return s;
        if (s.logLevel === 'info' && level === 'debug') return s;
        const line = { id: uid('lg'), ts: Date.now(), level, source, text };
        return { ...s, logs: [...s.logs, line].slice(-400) };
      },
    });
  }, []);

  const addMessage = useCallback((sessionId: string, msg: ChatMessage) => {
    dispatch({
      t: 'set',
      fn: (s) => ({
        ...s,
        sessions: s.sessions.map((se) =>
          se.id === sessionId ? { ...se, messages: [...se.messages, msg], updatedAt: Date.now() } : se,
        ),
      }),
    });
  }, []);

  const newSession = useCallback((title = 'Sesi baru') => {
    const id = uid('se');
    dispatch({
      t: 'set',
      fn: (s) => ({
        ...s,
        activeSessionId: id,
        sessions: [
          {
            id,
            title,
            profileId: s.activeProfileId,
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
          ...s.sessions,
        ].slice(0, 40),
      }),
    });
    return id;
  }, []);

  const resetAll = useCallback(() => {
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => undefined);
    dispatch({ t: 'reset' });
  }, []);

  const theme = useMemo(() => {
    const mode = state.appearance === 'system' ? (scheme === 'light' ? 'light' : 'dark') : state.appearance;
    return mode === 'light' ? light : dark;
  }, [state.appearance, scheme]);

  const value = useMemo<StoreCtx>(
    () => ({ state, theme, setState, pushLog, addMessage, newSession, resetAll }),
    [state, theme, setState, pushLog, addMessage, newSession, resetAll],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): StoreCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useStore harus dipakai di dalam StoreProvider');
  return ctx;
}

export function useTheme(): Palette {
  return useStore().theme;
}

const FALLBACK_PROFILE: Profile = {
  id: 'pf_fallback',
  name: 'Default Orchestrator',
  model: 'auto',
  systemPrompt: 'Kamu adalah Filosofi — orchestrator engineering otonom.',
  env: [],
  libraries: [],
  skills: [],
  pinnedRepos: [],
  workflow: [],
  connectors: [],
  swarm: [],
  createdAt: 0,
};

export function activeProfile(s: AppState): Profile {
  return s.profiles.find((p) => p.id === s.activeProfileId) ?? s.profiles[0] ?? FALLBACK_PROFILE;
}

export function activeSession(s: AppState) {
  return s.sessions.find((se) => se.id === s.activeSessionId) ?? s.sessions[0];
}

export function profileById(s: AppState, id: string): Profile | undefined {
  return s.profiles.find((p) => p.id === id);
}
