export type ID = string;

export type ConnectorRec = {
  id: ID;
  slug: string;
  name: string;
  account: string | null;
  connected: boolean;
  scopes: string[];
  connectedAt?: number;
};

export type ApiKeyRec = {
  id: ID;
  providerId: string;
  label: string;
  secret: string;
  enabled: boolean;
  models: string[];
  createdAt: number;
  lastTest?: { ok: boolean; ms: number; at: number } | null;
};

export type RouterCfg = { mode: 'manual' | 'autoroute'; manualModel: string };

export type RepoAuth = 'PAT' | 'API' | 'HTTP' | 'SSH';

export type RepoRec = {
  id: ID;
  name: string;
  url: string;
  branch: string;
  auth: RepoAuth;
  valid: boolean;
  lastCheck?: number;
};

export type WorkflowStep = { id: ID; title: string; detail: string };
export type EnvVar = { id: ID; k: string; v: string };
export type AgentStatus = 'idle' | 'running' | 'done' | 'error';

export type AgentRec = {
  id: ID;
  name: string;
  task: string;
  prompt: string;
  model: string;
  status: AgentStatus;
};

export type Profile = {
  id: ID;
  name: string;
  model: string;
  systemPrompt: string;
  env: EnvVar[];
  libraries: string[];
  skills: string[];
  pinnedRepos: ID[];
  workflow: WorkflowStep[];
  connectors: ID[];
  swarm: AgentRec[];
  createdAt: number;
};

export type Role = 'user' | 'assistant' | 'system';

export type ChatMessage = {
  id: ID;
  role: Role;
  text: string;
  model?: string;
  route?: string;
  ts: number;
  tokens?: number;
  bookmarked?: boolean;
};

export type Session = {
  id: ID;
  title: string;
  profileId: ID;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
};

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'ok' | 'tool';

export type LogLine = { id: ID; ts: number; level: LogLevel; source: string; text: string };

export type SandboxEngine = 'alpine' | 'microbox';

export type SandboxRec = {
  id: ID;
  engine: SandboxEngine;
  name: string;
  status: 'stopped' | 'booting' | 'running';
  startedAt?: number;
  pid: number;
};

export type Account = { name: string; handle: string; plan: string };

export type AppState = {
  hydrated: boolean;
  account: Account;
  appearance: 'system' | 'light' | 'dark';
  streamSpeed: number;
  logLevel: 'debug' | 'info' | 'warn';
  connectors: ConnectorRec[];
  keys: ApiKeyRec[];
  router: RouterCfg;
  rotation: number;
  repos: RepoRec[];
  profiles: Profile[];
  activeProfileId: ID;
  sessions: Session[];
  activeSessionId: ID;
  logs: LogLine[];
  sandboxes: SandboxRec[];
  terminalHistory: string[];
};
