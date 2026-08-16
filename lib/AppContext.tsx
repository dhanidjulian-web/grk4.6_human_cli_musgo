import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  AgentMode,
  AgentPersona,
  ApiKeyEntry,
  ChatMessage,
  GeneratedAsset,
  ModelItem,
  ProfileConfig,
  Session,
  SkillItem,
  SourceItem,
  ConnectorItem,
  ConnectorPlatform,
  ExtraPlatform,
  Bookmark,
  SandboxFile,
} from './types';
import {
  defaultModels,
  defaultProfile,
  defaultSkills,
  defaultSources,
  deleteSecret,
  getSecret,
  maskKey,
  setSecret,
  store,
} from './storage';
import { uid } from './id';
import { bootLines, L, materializeLines, runAgent } from './agent';
import { executeLive } from './runtime';
import { pingPlatform, summarizePing } from './cloud';
import { pickAgent } from './orchestrator';
import { inferChat, pollinationsImageUrl } from './infer';
import { extractUrl, fetchPage, fireWebhook } from './liveFetch';
import { CORE_TOOLS, LOCAL_ADMIN_MODEL_ID, runCoreTools } from './tools';
import { localAdminThink } from './localAdmin';
import { validateApiKey } from './validateKey';
import { parseSnapshot } from './backup';

interface AppState {
  ready: boolean;
  sessions: Session[];
  activeSessionId: string | null;
  sources: SourceItem[];
  skills: SkillItem[];
  models: ModelItem[];
  keys: ApiKeyEntry[];
  profile: ProfileConfig;
  assets: GeneratedAsset[];
  extras: ExtraPlatform[];
  bookmarks: Bookmark[];
  sandbox: SandboxFile[];
  lastPrompt: string;
  lockedMode: AgentMode;
  streaming: boolean;
}

interface AppApi extends AppState {
  activeSession: Session | null;
  activeModel?: ModelItem;
  setLockedMode: (m: AgentMode) => void;
  send: (text: string) => Promise<void>;
  newSession: () => void;
  openSession: (id: string) => void;
  deleteSession: (id: string) => void;
  addSource: (s: Omit<SourceItem, 'id' | 'createdAt'>) => boolean;
  libraryBytes: number;
  removeSource: (id: string) => void;
  addSkill: (s: Omit<SkillItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSkill: (id: string, patch: Partial<SkillItem>) => void;
  removeSkill: (id: string) => void;
  addModel: (m: Omit<ModelItem, 'id' | 'createdAt'>) => string;
  updateModel: (id: string, patch: Partial<ModelItem>) => void;
  removeModel: (id: string) => void;
  addKey: (label: string, provider: ApiKeyEntry['provider'], raw: string) => Promise<{ ok: boolean; message: string }>;
  removeKey: (id: string) => Promise<void>;
  recheckKey: (id: string) => Promise<{ ok: boolean; message: string }>;
  addExtra: (e: Omit<ExtraPlatform, 'id' | 'createdAt'>) => string;
  removeExtra: (id: string) => void;
  updateProfile: (patch: Partial<ProfileConfig>) => void;
  addAgent: (a: Omit<AgentPersona, 'id' | 'createdAt'>) => boolean;
  updateAgent: (id: string, patch: Partial<AgentPersona>) => void;
  removeAgent: (id: string) => void;
  addAsset: (a: Omit<GeneratedAsset, 'id' | 'createdAt'>) => GeneratedAsset;
  setActiveModel: (id?: string) => void;
  setActiveAgent: (id?: string) => void;
  addConnector: (c: Omit<ConnectorItem, 'id'>) => string;
  updateConnector: (id: string, patch: Partial<ConnectorItem>) => void;
  removeConnector: (id: string) => Promise<void>;
  saveConnectorToken: (id: string, raw: string) => Promise<void>;
  getConnectorToken: (id: string) => Promise<string | null>;
  tokenFor: (platform: ConnectorPlatform) => Promise<string | null>;
  probeConnector: (id: string) => Promise<void>;
  probeAll: () => Promise<void>;
  updateSource: (id: string, patch: Partial<SourceItem>) => void;
  addBookmark: (b: Omit<Bookmark, 'id' | 'createdAt'>) => void;
  removeBookmark: (id: string) => void;
  addSandbox: (f: Omit<SandboxFile, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSandbox: (id: string, patch: Partial<SandboxFile>) => void;
  removeSandbox: (id: string) => void;
  regenerate: () => Promise<void>;
  restoreWorkspace: (raw: string) => Promise<{ ok: boolean; message: string }>;
}

const Ctx = createContext<AppApi | null>(null);

function emptySession(): Session {
  return {
    id: uid('ses'),
    title: 'console',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [],
    lines: bootLines(),
    lastMode: 'auto',
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    ready: false,
    sessions: [],
    activeSessionId: null,
    sources: [],
    skills: [],
    models: [],
    keys: [],
    profile: defaultProfile(),
    assets: [],
    extras: [],
    bookmarks: [],
    sandbox: [],
    lastPrompt: '',
    lockedMode: 'auto',
    streaming: false,
  });

  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      let sessions: Session[] = [];
      let sources: SourceItem[] = [];
      let skills: SkillItem[] = [];
      let models: ModelItem[] = [];
      let keys: ApiKeyEntry[] = [];
      let profile = defaultProfile();
      let assets: GeneratedAsset[] = [];
      let extras: ExtraPlatform[] = [];
      let bookmarks: Bookmark[] = [];
      let sandbox: SandboxFile[] = [];
      try {
      const onboarded = await store.onboarded();
      sessions = await store.sessions();
      sources = await store.sources();
      skills = await store.skills();
      models = await store.models();
      keys = await store.keys();
      profile = (await store.profile()) || defaultProfile();
      assets = await store.assets();
      extras = (await store.extras()) || [];
      bookmarks = (await store.bookmarks()) || [];
      sandbox = (await store.sandbox()) || [];

      if (!onboarded) {
        sources = defaultSources();
        skills = defaultSkills();
        models = defaultModels();
        profile = defaultProfile();
        profile.activeModelId = models[0]?.id;
        profile.activeAgentId = profile.agents.find((a) => a.kind === 'admin')?.id || profile.agents[0]?.id;
        sessions = [emptySession()];
        await store.saveSources(sources);
        await store.saveSkills(skills);
        await store.saveModels(models);
        await store.saveProfile(profile);
        await store.saveSessions(sessions);
        await store.setOnboarded();
      }

      if (!profile) profile = defaultProfile();
      profile.connectors = (profile.connectors || []).map((c) => {
        const t = String(c.type) as string;
        const mapped = t === 'vps' ? 'ssh-vps' : t === 'cloud' ? 'custom' : c.type;
        return { ...c, type: mapped as ConnectorItem['type'], status: c.status || 'unknown' };
      });
      const have = new Set(profile.connectors.map((c) => c.type));
      const missingCons = defaultProfile().connectors.filter((c) => !have.has(c.type));
      if (missingCons.length) profile.connectors = [...profile.connectors, ...missingCons];
      if (sessions.length === 0) {
        sessions = [emptySession()];
        await store.saveSessions(sessions);
      }
      if (models.length === 0) {
        models = defaultModels();
        await store.saveModels(models);
      } else {
        const haveM = new Set(models.map((m) => `${m.provider}::${m.modelId}`));
        const missingMods = defaultModels().filter((m) => !haveM.has(`${m.provider}::${m.modelId}`));
        if (missingMods.length) {
          models = [...models, ...missingMods];
          await store.saveModels(models);
        }
      }
      if (profile.orchestrator === undefined) profile.orchestrator = true;
      if (profile.lockAgent === undefined) profile.lockAgent = false;
      if (!profile.schedules) profile.schedules = [];
      {
        const haveT = new Set((profile.tools || []).map((t) => t.name));
        const missingT = CORE_TOOLS.filter((t) => !haveT.has(t.name)).map((t) => ({ ...t, id: t.id, enabled: true }));
        if (missingT.length) profile.tools = [...(profile.tools || []), ...missingT];
      }
      profile.agents = (profile.agents || []).map((a) => {
        const anyA = a as AgentPersona & { role?: string };
        return {
          id: a.id,
          name: a.name,
          description: a.description || anyA.role || 'Agent spesifik',
          instruction: a.instruction || '',
          createdAt: a.createdAt || Date.now(),
          kind: a.kind || (a.id === 'ag_admin' ? 'admin' : a.id === 'ag_swarm' ? 'swarm' : 'worker'),
          modelPref: a.modelPref || 'auto',
          modelId: a.kind === 'admin' || a.kind === 'swarm' || a.id === 'ag_admin' || a.id === 'ag_swarm'
            ? LOCAL_ADMIN_MODEL_ID
            : (a.modelId || 'route-auto-best'),
        };
      });
      {
        const haveAg = new Set(profile.agents.map((a) => a.id));
        const extraAg = defaultProfile().agents.filter((a) => !haveAg.has(a.id));
        if (extraAg.length && profile.agents.length + extraAg.length <= 30) {
          profile.agents = [...profile.agents, ...extraAg];
        }
      }

      } catch {
        sessions = sessions.length ? sessions : [emptySession()];
        sources = sources.length ? sources : defaultSources();
        skills = skills.length ? skills : defaultSkills();
        models = models.length ? models : defaultModels();
        profile = profile || defaultProfile();
      }
      if (cancelled) return;
      if (!sessions.length) sessions = [emptySession()];
      setState((s) => ({
        ...s,
        ready: true,
        sessions,
        activeSessionId: sessions[0].id,
        sources,
        skills,
        models,
        keys,
        profile,
        assets,
        extras: extras || [],
        bookmarks,
        sandbox,
      }));
    };
    boot();
    const failSafe = setTimeout(() => {
      if (cancelled) return;
      setState((s) => {
        if (s.ready) return s;
        const ses = s.sessions[0] || emptySession();
        return { ...s, ready: true, sessions: s.sessions.length ? s.sessions : [ses], activeSessionId: s.activeSessionId || ses.id };
      });
    }, 2500);
    return () => {
      cancelled = true;
      clearTimeout(failSafe);
    };
  }, []);

  useEffect(() => {
    if (!state.ready) return;
    store.saveSessions(state.sessions);
  }, [state.sessions, state.ready]);

  useEffect(() => {
    if (!state.ready) return;
    store.saveSources(state.sources);
  }, [state.sources, state.ready]);

  useEffect(() => {
    if (!state.ready) return;
    store.saveSkills(state.skills);
  }, [state.skills, state.ready]);

  useEffect(() => {
    if (!state.ready) return;
    store.saveModels(state.models);
  }, [state.models, state.ready]);

  useEffect(() => {
    if (!state.ready) return;
    store.saveKeys(state.keys);
  }, [state.keys, state.ready]);

  useEffect(() => {
    if (!state.ready) return;
    store.saveProfile(state.profile);
  }, [state.profile, state.ready]);

  useEffect(() => {
    if (!state.ready) return;
    store.saveAssets(state.assets);
  }, [state.assets, state.ready]);

  useEffect(() => {
    if (!state.ready) return;
    store.saveExtras(state.extras);
  }, [state.extras, state.ready]);

  useEffect(() => {
    if (!state.ready) return;
    store.saveBookmarks(state.bookmarks);
  }, [state.bookmarks, state.ready]);

  useEffect(() => {
    if (!state.ready) return;
    store.saveSandbox(state.sandbox);
  }, [state.sandbox, state.ready]);

  const persistSessions = useCallback((updater: (prev: Session[]) => Session[]) => {
    setState((s) => ({ ...s, sessions: updater(s.sessions) }));
  }, []);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setState((s) => ({ ...s, lastPrompt: trimmed }));
      const sessionId = state.activeSessionId;
      if (!sessionId) return;

      const userMsg: ChatMessage = {
        id: uid('msg'),
        role: 'user',
        text: trimmed,
        mode: state.lockedMode,
        ts: Date.now(),
      };

      persistSessions((prev) =>
        prev.map((ses) =>
          ses.id === sessionId
            ? {
                ...ses,
                title: ses.messages.length === 0 ? trimmed.slice(0, 42) : ses.title,
                updatedAt: Date.now(),
                messages: [...ses.messages, userMsg],
              }
            : ses
        )
      );

      setState((s) => ({ ...s, streaming: true }));

      const picked = pickAgent(
        state.profile,
        trimmed,
        state.profile.lockAgent ? state.profile.activeAgentId : undefined
      );
      if (state.profile.orchestrator && !state.profile.lockAgent && picked.agent.id !== state.profile.activeAgentId) {
        setState((s) => ({ ...s, profile: { ...s.profile, activeAgentId: picked.agent.id } }));
      }

      const activeModel = state.models.find((m) => m.id === state.profile.activeModelId);
      const result = runAgent(
        trimmed,
        {
          profile: state.profile,
          skills: state.skills,
          sources: state.sources,
          activeModelName: activeModel ? `${activeModel.name}` : undefined,
          history: [],
          agent: picked.agent,
        },
        state.lockedMode
      );

      const extra: typeof result.lines = [
        L('head', '  ORCHESTRATOR'),
        L('ok', `  agent    ${picked.agent.name}  ·  ${picked.reason}`),
        L('dim', `  ${picked.agent.description}`),
      ];

      const live = await executeLive(trimmed, {
        tokenOf: async (platform) => {
          const con = state.profile.connectors.find((c) => c.type === platform && c.enabled && c.tokenId);
          if (!con?.tokenId) return null;
          return getSecret(con.tokenId);
        },
        connectorOf: (platform) => state.profile.connectors.find((c) => c.type === platform),
        defaultRepo: state.profile.connectors.find((c) => c.type === 'github' && c.target.includes('/'))?.target,
      });

      const url = extractUrl(trimmed);
      let browse: typeof result.lines = [];
      if (result.mode === 'browser' && url) {
        browse = await fetchPage(url);
      }
      const toolLines = await runCoreTools(trimmed, {
        profile: state.profile,
        sources: state.sources,
        skills: state.skills,
        sandbox: state.sandbox,
      });

      if (result.mode === 'multimodal') {
        const imageUrl = pollinationsImageUrl(trimmed);
        extra.push(L('ok', `  image  ${imageUrl}`));
        extra.push(L('info', '  Pollinations — generate langsung, tanpa key'));
        setState((s) => ({
          ...s,
          assets: [
            {
              id: uid('art'),
              prompt: trimmed,
              seed: Date.now(),
              palette: ['#3dff9a', '#5ec8ff', '#c4b5fd'],
              title: trimmed.slice(0, 32),
              createdAt: Date.now(),
              imageUrl,
            },
            ...s.assets,
          ],
        }));
      }

      const skillCtx = state.skills
        .filter((sk) => sk.enabled)
        .map((sk) => `### ${sk.name}\n${sk.markdown.slice(0, 1200)}`)
        .join('\n\n');
      const srcCtx = state.sources
        .slice(0, 6)
        .map((src) => `## ${src.name}\n${(src.content || src.url || '').slice(0, 800)}`)
        .join('\n');
      const sys =
        `${state.profile.instruction}\n\n` +
        `AGENT: ${picked.agent.name}\n${picked.agent.description}\n${picked.agent.instruction}\n\n` +
        `SKILLS:\n${skillCtx || '(none)'}\n\nKNOWLEDGE:\n${srcCtx || '(none)'}\n\n` +
        `Jangan menghasilkan exploit. Jika butuh aksi GitHub/deploy, sebut perintah konkret.`;

      const isAdmin = picked.agent.kind === 'admin' || picked.agent.kind === 'swarm' || picked.agent.modelId === LOCAL_ADMIN_MODEL_ID;
      const agentModel = isAdmin ? LOCAL_ADMIN_MODEL_ID : (picked.agent.modelId || '');
      const infer = isAdmin
        ? { ok: true as const, text: localAdminThink(trimmed, state.profile, picked.agent), used: 'Local Admin Kernel', provider: 'local-gguf' as const, keyLabel: 'always-on' }
        : await inferChat({
        models: state.models,
        keys: state.keys,
        getKey: getSecret,
        activeModelId: agentModel.startsWith('route-') ? state.profile.activeModelId : (agentModel || state.profile.activeModelId),
        routeId: agentModel.startsWith('route-') ? agentModel : undefined,
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: trimmed },
        ],
      });

      const inferLines =
        infer.ok
          ? [
              L('head', `  MODEL  ${infer.used}${infer.keyLabel ? ' · ' + infer.keyLabel : ''}`),
              ...infer.text.split('\n').map((ln) => L('out', ln || ' ')),
            ]
          : [
              L('err', `  infer  ${infer.error}`),
              ...infer.tried.slice(0, 12).map((t) => L('dim', `  ${t}`)),
              L('info', '  Models → pasang beberapa API key per platform, aktifkan fallback'),
            ];

      const hookLines: typeof result.lines = [];
      for (const h of state.profile.hooks.filter((x) => x.enabled && x.url && x.kind === 'webhook')) {
        const hr = await fireWebhook(h.url, { source: 'human-cli', prompt: trimmed, agent: picked.agent.name, ts: Date.now() });
        hookLines.push(hr.ok ? L('ok', `  webhook ${h.name}  ${hr.status}`) : L('err', `  webhook ${h.name}  ${hr.error}`));
      }

      const lines = materializeLines([
        ...result.lines,
        ...extra,
        ...(live || []),
        ...browse,
        ...toolLines,
        ...inferLines,
        ...hookLines,
      ]);
      const sysMsg: ChatMessage = {
        id: uid('msg'),
        role: 'system',
        text: `orch → ${picked.agent.name} · ${result.mode} · ${infer.ok ? infer.used : 'infer-fail'}`,
        mode: result.mode,
        ts: Date.now(),
      };

      persistSessions((prev) =>
        prev.map((ses) =>
          ses.id === sessionId
            ? {
                ...ses,
                updatedAt: Date.now(),
                lastMode: result.mode,
                messages: [...ses.messages, sysMsg],
                lines: [...ses.lines, ...lines],
              }
            : ses
        )
      );

      setState((s) => ({ ...s, streaming: false }));
    },
    [state.activeSessionId, state.lockedMode, state.models, state.profile, state.skills, state.sources, persistSessions, state.keys]
  );

  useEffect(() => {
    if (!state.ready) return;
    const tick = setInterval(() => {
      const now = Date.now();
      const due = (state.profile.schedules || []).filter(
        (s) => s.enabled && s.prompt && (!s.lastRun || now - s.lastRun >= Math.max(5, s.everyMin) * 60_000)
      );
      if (!due.length) return;
      setState((s) => ({
        ...s,
        profile: {
          ...s.profile,
          schedules: (s.profile.schedules || []).map((x) =>
            due.some((d) => d.id === x.id) ? { ...x, lastRun: now, lastStatus: 'ran' } : x
          ),
        },
      }));
      due.forEach((item) => {
        send(item.prompt);
      });
    }, 30000);
    return () => clearInterval(tick);
  }, [state.ready, state.profile.schedules, send]);

  const newSession = useCallback(() => {
    const ses = emptySession();
    setState((s) => ({ ...s, sessions: [ses, ...s.sessions], activeSessionId: ses.id }));
  }, []);

  const openSession = useCallback((id: string) => {
    setState((s) => ({ ...s, activeSessionId: id }));
  }, []);

  const deleteSession = useCallback((id: string) => {
    setState((s) => {
      const next = s.sessions.filter((x) => x.id !== id);
      const sessions = next.length ? next : [emptySession()];
      return {
        ...s,
        sessions,
        activeSessionId: s.activeSessionId === id ? sessions[0].id : s.activeSessionId,
      };
    });
  }, []);

  const libraryBytes = useMemo(() => {
    return state.sources.reduce((n, s) => {
      const body = unescape(encodeURIComponent(s.content || '')).length;
      return n + body + (s.url ? 256 : 0);
    }, 0);
  }, [state.sources]);

  const addSource = useCallback((src: Omit<SourceItem, 'id' | 'createdAt'>) => {
    const incoming = unescape(encodeURIComponent(src.content || '')).length + (src.url ? 256 : 0);
    const used = state.sources.reduce((n, s) => n + unescape(encodeURIComponent(s.content || '')).length + (s.url ? 256 : 0), 0);
    if (used + incoming > 100 * 1024 * 1024) return false;
    const item: SourceItem = { ...src, id: uid('src'), createdAt: Date.now() };
    setState((s) => ({ ...s, sources: [item, ...s.sources] }));
    return true;
  }, [state.sources]);

  const removeSource = useCallback((id: string) => {
    setState((s) => ({ ...s, sources: s.sources.filter((x) => x.id !== id) }));
  }, []);

  const addSkill = useCallback((sk: Omit<SkillItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const item: SkillItem = { ...sk, id: uid('sk'), createdAt: Date.now(), updatedAt: Date.now() };
    setState((s) => ({ ...s, skills: [item, ...s.skills] }));
  }, []);

  const updateSkill = useCallback((id: string, patch: Partial<SkillItem>) => {
    setState((s) => ({
      ...s,
      skills: s.skills.map((x) => (x.id === id ? { ...x, ...patch, updatedAt: Date.now() } : x)),
    }));
  }, []);

  const removeSkill = useCallback((id: string) => {
    setState((s) => ({ ...s, skills: s.skills.filter((x) => x.id !== id) }));
  }, []);

  const addModel = useCallback((m: Omit<ModelItem, 'id' | 'createdAt'>) => {
    const id = uid('mdl');
    const item: ModelItem = { ...m, id, createdAt: Date.now() };
    setState((s) => ({ ...s, models: [item, ...s.models] }));
    return id;
  }, []);

  const updateModel = useCallback((id: string, patch: Partial<ModelItem>) => {
    if (id === LOCAL_ADMIN_MODEL_ID) {
      patch = { ...patch, enabled: true, isFallback: true };
    }
    setState((s) => {
      let models = s.models.map((x) => (x.id === id ? { ...x, ...patch } : x));
      if (patch.isFallback) {
        const fb = models.filter((x) => x.isFallback).sort((a, b) => a.fallbackOrder - b.fallbackOrder);
        if (fb.length > 15) {
          const extra = fb.slice(15).map((x) => x.id);
          models = models.map((x) => (extra.includes(x.id) ? { ...x, isFallback: false, fallbackOrder: 0 } : x));
        }
      }
      return { ...s, models };
    });
  }, []);

  const removeModel = useCallback((id: string) => {
    if (id === LOCAL_ADMIN_MODEL_ID) return;
    setState((s) => ({
      ...s,
      models: s.models.filter((x) => x.id !== id),
      profile: s.profile.activeModelId === id ? { ...s.profile, activeModelId: undefined } : s.profile,
    }));
  }, []);

  const addKey = useCallback(async (label: string, provider: ApiKeyEntry['provider'], raw: string) => {
    const check = await validateApiKey(provider, raw.trim(), state.extras);
    if (!check.ok) {
      return check;
    }
    const id = uid('key');
    await setSecret(id, raw.trim());
    const entry: ApiKeyEntry = {
      id,
      label,
      provider,
      hint: maskKey(raw),
      createdAt: Date.now(),
      valid: true,
      lastCheck: Date.now(),
      lastMessage: check.message,
    };
    setState((s) => ({ ...s, keys: [entry, ...s.keys] }));
    return check;
  }, [state.extras]);

  const recheckKey = useCallback(async (id: string) => {
    const found = state.keys.find((k) => k.id === id);
    if (!found) return { ok: false, message: 'key tidak ada' };
    const raw = await getSecret(id);
    if (!raw) return { ok: false, message: 'secret kosong' };
    const check = await validateApiKey(found.provider, raw, state.extras);
    setState((s) => ({
      ...s,
      keys: s.keys.map((k) =>
        k.id === id ? { ...k, valid: check.ok, lastCheck: Date.now(), lastMessage: check.message } : k
      ),
    }));
    return check;
  }, [state.keys, state.extras]);

  const addExtra = useCallback((e: Omit<ExtraPlatform, 'id' | 'createdAt'>) => {
    const id = uid('plat');
    const item: ExtraPlatform = { ...e, id, createdAt: Date.now() };
    setState((s) => ({ ...s, extras: [item, ...s.extras] }));
    return id;
  }, []);

  const removeExtra = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      extras: s.extras.filter((x) => x.id !== id),
      models: s.models.filter((m) => m.provider !== id),
    }));
  }, []);

  const removeKey = useCallback(async (id: string) => {
    await deleteSecret(id);
    setState((s) => ({
      ...s,
      keys: s.keys.filter((k) => k.id !== id),
      models: s.models.map((m) => ({ ...m, keyIds: m.keyIds.filter((k) => k !== id) })),
    }));
  }, []);

  const updateProfile = useCallback((patch: Partial<ProfileConfig>) => {
    setState((s) => ({ ...s, profile: { ...s.profile, ...patch } }));
  }, []);

  const addAgent = useCallback((a: Omit<AgentPersona, 'id' | 'createdAt'>) => {
    let ok = true;
    setState((s) => {
      if (s.profile.agents.length >= 30) {
        ok = false;
        return s;
      }
      const item: AgentPersona = {
        id: uid('ag'),
        name: a.name,
        description: a.description,
        instruction: (a.instruction || '').slice(0, 8000),
        createdAt: Date.now(),
        kind: 'worker',
        modelId: a.modelId || 'route-auto-best',
      };
      return { ...s, profile: { ...s.profile, agents: [item, ...s.profile.agents] } };
    });
    return ok;
  }, []);

  const updateAgent = useCallback((id: string, patch: Partial<AgentPersona>) => {
    setState((s) => ({
      ...s,
      profile: {
        ...s.profile,
        agents: s.profile.agents.map((a) =>
          a.id === id
            ? {
                ...a,
                ...patch,
                instruction:
                  typeof patch.instruction === 'string' ? patch.instruction.slice(0, 8000) : a.instruction,
                modelId:
                  a.kind === 'admin' || a.kind === 'swarm' || a.id === 'ag_admin' || a.id === 'ag_swarm'
                    ? LOCAL_ADMIN_MODEL_ID
                    : (patch.modelId || a.modelId),
              }
            : a
        ),
      },
    }));
  }, []);

  const removeAgent = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      profile: {
        ...s.profile,
        agents: s.profile.agents.filter((a) => a.id !== id),
        activeAgentId: s.profile.activeAgentId === id ? s.profile.agents[0]?.id : s.profile.activeAgentId,
      },
    }));
  }, []);

  const addAsset = useCallback((a: Omit<GeneratedAsset, 'id' | 'createdAt'>) => {
    const item: GeneratedAsset = { ...a, id: uid('art'), createdAt: Date.now() };
    setState((s) => ({ ...s, assets: [item, ...s.assets] }));
    return item;
  }, []);

  const setActiveModel = useCallback((id?: string) => {
    setState((s) => ({ ...s, profile: { ...s.profile, activeModelId: id } }));
  }, []);

  const setActiveAgent = useCallback((id?: string) => {
    setState((s) => ({ ...s, profile: { ...s.profile, activeAgentId: id } }));
  }, []);

  const setLockedMode = useCallback((m: AgentMode) => {
    setState((s) => ({ ...s, lockedMode: m }));
  }, []);

  const addConnector = useCallback((c: Omit<ConnectorItem, 'id'>) => {
    const id = uid('con');
    const item: ConnectorItem = { ...c, id, status: c.status || 'unknown' };
    setState((s) => ({ ...s, profile: { ...s.profile, connectors: [item, ...s.profile.connectors] } }));
    return id;
  }, []);

  const updateConnector = useCallback((id: string, patch: Partial<ConnectorItem>) => {
    setState((s) => ({
      ...s,
      profile: {
        ...s.profile,
        connectors: s.profile.connectors.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      },
    }));
  }, []);

  const removeConnector = useCallback(async (id: string) => {
    const found = state.profile.connectors.find((c) => c.id === id);
    if (found?.tokenId) await deleteSecret(found.tokenId);
    setState((s) => ({
      ...s,
      profile: { ...s.profile, connectors: s.profile.connectors.filter((c) => c.id !== id) },
    }));
  }, [state.profile.connectors]);

  const saveConnectorToken = useCallback(async (id: string, raw: string) => {
    const found = state.profile.connectors.find((c) => c.id === id);
    const tokenId = found?.tokenId || uid('ctok');
    await setSecret(tokenId, raw.trim());
    setState((s) => ({
      ...s,
      profile: {
        ...s.profile,
        connectors: s.profile.connectors.map((c) =>
          c.id === id ? { ...c, tokenId, lastMessage: 'token tersimpan', status: 'unknown' } : c
        ),
      },
    }));
  }, [state.profile.connectors]);

  const getConnectorToken = useCallback(async (id: string) => {
    const found = state.profile.connectors.find((c) => c.id === id);
    if (!found?.tokenId) return null;
    return getSecret(found.tokenId);
  }, [state.profile.connectors]);

  const tokenFor = useCallback(async (platform: ConnectorPlatform) => {
    const con = state.profile.connectors.find((c) => c.type === platform && c.enabled && c.tokenId);
    if (!con?.tokenId) return null;
    return getSecret(con.tokenId);
  }, [state.profile.connectors]);

  const probeConnector = useCallback(async (id: string) => {
    const found = state.profile.connectors.find((c) => c.id === id);
    if (!found) return;
    const tok = found.tokenId ? await getSecret(found.tokenId) : '';
    if (!tok && found.type !== 'webhook') {
      setState((s) => ({
        ...s,
        profile: {
          ...s.profile,
          connectors: s.profile.connectors.map((c) =>
            c.id === id ? { ...c, status: 'error', lastCheck: Date.now(), lastMessage: 'token kosong' } : c
          ),
        },
      }));
      return;
    }
    const r = await pingPlatform(found.type, tok || '', found.target);
    const msg = r.ok ? summarizePing(found.type, r) : r.error || 'gagal';
    const login = r.ok && found.type === 'github' ? String((r.data as { login?: string } | undefined)?.login || '') : '';
    setState((s) => ({
      ...s,
      profile: {
        ...s.profile,
        connectors: s.profile.connectors.map((c) =>
          c.id === id
            ? {
                ...c,
                status: r.ok ? 'ok' : 'error',
                lastCheck: Date.now(),
                lastMessage: msg,
                username: login || c.username,
              }
            : c
        ),
      },
    }));
  }, [state.profile.connectors]);

  const probeAll = useCallback(async () => {
    const list = state.profile.connectors.filter((c) => c.enabled);
    for (const c of list) {
      await probeConnector(c.id);
    }
  }, [state.profile.connectors, probeConnector]);

  const updateSource = useCallback((id: string, patch: Partial<SourceItem>) => {
    setState((s) => ({ ...s, sources: s.sources.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  }, []);

  const addBookmark = useCallback((b: Omit<Bookmark, 'id' | 'createdAt'>) => {
    const item: Bookmark = { ...b, id: uid('bm'), createdAt: Date.now() };
    setState((s) => ({ ...s, bookmarks: [item, ...s.bookmarks] }));
  }, []);

  const removeBookmark = useCallback((id: string) => {
    setState((s) => ({ ...s, bookmarks: s.bookmarks.filter((x) => x.id !== id) }));
  }, []);

  const addSandbox = useCallback((f: Omit<SandboxFile, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = Date.now();
    const item: SandboxFile = { ...f, id: uid('sb'), createdAt: now, updatedAt: now };
    setState((s) => ({ ...s, sandbox: [item, ...s.sandbox] }));
  }, []);

  const updateSandbox = useCallback((id: string, patch: Partial<SandboxFile>) => {
    setState((s) => ({
      ...s,
      sandbox: s.sandbox.map((x) => (x.id === id ? { ...x, ...patch, updatedAt: Date.now() } : x)),
    }));
  }, []);

  const removeSandbox = useCallback((id: string) => {
    setState((s) => ({ ...s, sandbox: s.sandbox.filter((x) => x.id !== id) }));
  }, []);

  const regenerate = useCallback(async () => {
    if (state.lastPrompt) await send(state.lastPrompt);
  }, [state.lastPrompt, send]);

  const restoreWorkspace = useCallback(async (raw: string) => {
    const snap = parseSnapshot(raw);
    if (!snap) return { ok: false, message: 'File bukan backup Human CLI yang valid.' };
    if (snap.keyValues) {
      for (const [id, val] of Object.entries(snap.keyValues)) {
        if (val) await setSecret(id, val);
      }
    }
    setState((s) => ({
      ...s,
      profile: snap.profile || s.profile,
      sources: snap.sources || [],
      skills: snap.skills || [],
      models: snap.models?.length ? snap.models : s.models,
      keys: snap.keys || s.keys,
      extras: snap.extras || [],
      bookmarks: snap.bookmarks || [],
      sandbox: snap.sandbox || [],
      sessions: snap.sessions?.length ? snap.sessions : s.sessions,
      assets: snap.assets || s.assets,
      activeSessionId: snap.sessions?.[0]?.id || s.activeSessionId,
    }));
    return { ok: true, message: `Dipulihkan · ${snap.label || snap.exportedAt}` };
  }, []);

  const activeSession = useMemo(
    () => state.sessions.find((s) => s.id === state.activeSessionId) || null,
    [state.sessions, state.activeSessionId]
  );

  const activeModel = useMemo(
    () => state.models.find((m) => m.id === state.profile.activeModelId),
    [state.models, state.profile.activeModelId]
  );

  const api: AppApi = {
    ...state,
    activeSession,
    activeModel,
    libraryBytes,
    setLockedMode,
    send,
    newSession,
    openSession,
    deleteSession,
    addSource,
    removeSource,
    addSkill,
    updateSkill,
    removeSkill,
    addModel,
    updateModel,
    removeModel,
    addKey,
    removeKey,
    recheckKey,
    addExtra,
    removeExtra,
    updateProfile,
    addAgent,
    updateAgent,
    removeAgent,
    addAsset,
    setActiveModel,
    setActiveAgent,
    addConnector,
    updateConnector,
    removeConnector,
    saveConnectorToken,
    getConnectorToken,
    tokenFor,
    probeConnector,
    probeAll,
    updateSource,
    addBookmark,
    removeBookmark,
    addSandbox,
    updateSandbox,
    removeSandbox,
    regenerate,
    restoreWorkspace,
  };

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useApp(): AppApi {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp outside provider');
  return v;
}
