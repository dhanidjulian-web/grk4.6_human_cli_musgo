import AsyncStorage from '@react-native-async-storage/async-storage';
import { Share } from 'react-native';
import { getSecret } from './storage';
import {
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

export const BACKUP_SLOTS = 'humancli.backup.slots';

export interface WorkspaceSnapshot {
  app: 'Human CLI';
  owner: 'Dhani Yuliawan';
  project: 'MusGo-OS 2in1Ai-inside-OS';
  personal: true;
  version: string;
  exportedAt: string;
  label: string;
  includeKeyValues: boolean;
  profile: ProfileConfig;
  sources: SourceItem[];
  skills: SkillItem[];
  models: ModelItem[];
  keys: ApiKeyEntry[];
  keyValues?: Record<string, string>;
  extras: ExtraPlatform[];
  bookmarks: Bookmark[];
  sandbox: SandboxFile[];
  sessions?: Session[];
  assets?: GeneratedAsset[];
}

export interface BackupSlot {
  id: string;
  label: string;
  createdAt: number;
  bytes: number;
  includeKeyValues: boolean;
  snapshot: WorkspaceSnapshot;
}

export function downloadTextFile(name: string, content: string, mime = 'application/json') {
  if (typeof document !== 'undefined') {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  Share.share({ title: name, message: content.slice(0, 14000) });
}

export async function listSlots(): Promise<BackupSlot[]> {
  try {
    const raw = await AsyncStorage.getItem(BACKUP_SLOTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as BackupSlot[];
    return Array.isArray(parsed) ? parsed.sort((a, b) => b.createdAt - a.createdAt) : [];
  } catch {
    return [];
  }
}

async function writeSlots(slots: BackupSlot[]) {
  await AsyncStorage.setItem(BACKUP_SLOTS, JSON.stringify(slots.slice(0, 20)));
}

export async function buildSnapshot(opts: {
  label: string;
  includeKeyValues: boolean;
  profile: ProfileConfig;
  sources: SourceItem[];
  skills: SkillItem[];
  models: ModelItem[];
  keys: ApiKeyEntry[];
  extras: ExtraPlatform[];
  bookmarks: Bookmark[];
  sandbox: SandboxFile[];
  sessions?: Session[];
  assets?: GeneratedAsset[];
}): Promise<WorkspaceSnapshot> {
  const keyValues: Record<string, string> = {};
  if (opts.includeKeyValues) {
    for (const k of opts.keys) {
      const v = await getSecret(k.id);
      if (v) keyValues[k.id] = v;
    }
    for (const c of opts.profile.connectors || []) {
      if (c.tokenId) {
        const v = await getSecret(c.tokenId);
        if (v) keyValues[c.tokenId] = v;
      }
    }
  }
  return {
    app: 'Human CLI',
    owner: 'Dhani Yuliawan',
    project: 'MusGo-OS 2in1Ai-inside-OS',
    personal: true,
    version: '1.1.0',
    exportedAt: new Date().toISOString(),
    label: opts.label,
    includeKeyValues: opts.includeKeyValues,
    profile: opts.profile,
    sources: opts.sources,
    skills: opts.skills,
    models: opts.models,
    keys: opts.keys,
    keyValues: opts.includeKeyValues ? keyValues : undefined,
    extras: opts.extras,
    bookmarks: opts.bookmarks,
    sandbox: opts.sandbox,
    sessions: opts.sessions,
    assets: opts.assets,
  };
}

export async function saveSlot(snap: WorkspaceSnapshot): Promise<BackupSlot> {
  const slot: BackupSlot = {
    id: `bk_${Date.now().toString(36)}`,
    label: snap.label,
    createdAt: Date.now(),
    bytes: unescape(encodeURIComponent(JSON.stringify(snap))).length,
    includeKeyValues: snap.includeKeyValues,
    snapshot: snap,
  };
  const prev = await listSlots();
  await writeSlots([slot, ...prev]);
  return slot;
}

export async function deleteSlot(id: string): Promise<void> {
  const prev = await listSlots();
  await writeSlots(prev.filter((s) => s.id !== id));
}

export function parseSnapshot(raw: string): WorkspaceSnapshot | null {
  try {
    const data = JSON.parse(raw) as WorkspaceSnapshot;
    if (!data || data.app !== 'Human CLI' || !data.profile) return null;
    return data;
  } catch {
    return null;
  }
}

export function workspaceDump(app: {
  profile: unknown;
  sources: unknown;
  skills: unknown;
  models: unknown;
  bookmarks: unknown;
  sandbox: unknown;
  extras: unknown;
}) {
  return JSON.stringify(
    {
      app: 'Human CLI',
      owner: 'Dhani Yuliawan',
      project: 'MusGo-OS 2in1Ai-inside-OS',
      personal: true,
      version: '1.1.0',
      exportedAt: new Date().toISOString(),
      profile: app.profile,
      sources: app.sources,
      skills: app.skills,
      models: app.models,
      bookmarks: app.bookmarks,
      sandbox: app.sandbox,
      extras: app.extras,
    },
    null,
    2
  );
}
