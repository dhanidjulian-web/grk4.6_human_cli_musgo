export type AgentMode =
  | 'auto'
  | 'cli'
  | 'ssh'
  | 'sftp'
  | 'browser'
  | 'chat'
  | 'code'
  | 'security'
  | 'multimodal'
  | 'deploy'
  | 'pentest'
  | 'agent';

export type LineKind =
  | 'sys'
  | 'cmd'
  | 'out'
  | 'ok'
  | 'warn'
  | 'err'
  | 'info'
  | 'code'
  | 'dim'
  | 'head'
  | 'sep';

export interface TerminalLine {
  id: string;
  kind: LineKind;
  text: string;
  ts: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'system';
  text: string;
  mode: AgentMode;
  ts: number;
}

export interface Session {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  lines: TerminalLine[];
  lastMode: AgentMode;
}

export interface SourceItem {
  id: string;
  name: string;
  kind: 'file' | 'link' | 'note' | 'archive' | 'folder';
  mime: string;
  sizeLabel: string;
  content: string;
  url?: string;
  folder?: string;
  createdAt: number;
  tags: string[];
}

export interface SkillItem {
  id: string;
  name: string;
  description: string;
  markdown: string;
  origin: 'upload' | 'paste' | 'link' | 'generate' | 'github' | 'manual';
  originRef?: string;
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export type ModelProvider = string;

export type RoutingMode = 'manual' | 'random';

export interface ExtraPlatform {
  id: string;
  label: string;
  endpoint: string;
  keyUrl: string;
  tier: 'free' | 'freemium';
  createdAt: number;
}

export interface ApiKeyEntry {
  id: string;
  label: string;
  provider: ModelProvider;
  hint: string;
  createdAt: number;
  valid?: boolean;
  lastCheck?: number;
  lastMessage?: string;
}

export interface ModelItem {
  id: string;
  name: string;
  provider: ModelProvider;
  modelId: string;
  kind: 'local' | 'external';
  path?: string;
  contextWindow: number;
  enabled: boolean;
  isFallback: boolean;
  fallbackOrder: number;
  keyIds: string[];
  routing: RoutingMode;
  notes: string;
  createdAt: number;
}

export interface McpServer {
  id: string;
  name: string;
  command: string;
  enabled: boolean;
}

export interface WebhookItem {
  id: string;
  name: string;
  url: string;
  kind: 'webhook' | 'websocket';
  enabled: boolean;
}

export interface WorkflowItem {
  id: string;
  name: string;
  trigger: string;
  steps: string[];
  enabled: boolean;
}

export interface ScheduledTask {
  id: string;
  name: string;
  everyMin: number;
  prompt: string;
  agentId?: string;
  enabled: boolean;
  lastRun?: number;
  lastStatus?: string;
}

export interface ToolItem {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface MemoryItem {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  createdAt: number;
}

export type ConnectorPlatform =
  | 'github'
  | 'gitlab'
  | 'gitea'
  | 'vercel'
  | 'netlify'
  | 'cloudflare'
  | 'railway'
  | 'render'
  | 'flyio'
  | 'dockerhub'
  | 'digitalocean'
  | 'aws'
  | 'gcp'
  | 'azure'
  | 'huggingface'
  | 'supabase'
  | 'firebase'
  | 'npm'
  | 'ssh-vps'
  | 'sftp'
  | 'webhook'
  | 'custom';

export type ConnectorStatus = 'unknown' | 'ok' | 'error';

export interface ConnectorItem {
  id: string;
  name: string;
  type: ConnectorPlatform;
  target: string;
  enabled: boolean;
  tokenId?: string;
  username?: string;
  status?: ConnectorStatus;
  lastCheck?: number;
  lastMessage?: string;
  meta?: Record<string, string>;
}

export interface SecretItem {
  id: string;
  key: string;
  hint: string;
  kind: 'env' | 'secret' | 'pat';
}

export interface AgentPersona {
  id: string;
  name: string;
  description: string;
  instruction: string;
  createdAt: number;
  kind?: 'admin' | 'swarm' | 'worker';
  modelPref?: 'local' | 'external' | 'auto';
  modelId?: string;
}

export interface ProfileConfig {
  displayName: string;
  handle: string;
  organization: string;
  instruction: string;
  autoMode: boolean;
  orchestrator: boolean;
  lockAgent: boolean;
  activeAgentId?: string;
  activeModelId?: string;
  mcp: McpServer[];
  hooks: WebhookItem[];
  workflows: WorkflowItem[];
  schedules: ScheduledTask[];
  tools: ToolItem[];
  memory: MemoryItem[];
  connectors: ConnectorItem[];
  secrets: SecretItem[];
  agents: AgentPersona[];
}

export interface GeneratedAsset {
  id: string;
  prompt: string;
  seed: number;
  palette: string[];
  title: string;
  createdAt: number;
  imageUrl?: string;
  kind?: 'image' | 'video' | 'document' | 'text';
  downloadUrl?: string;
  body?: string;
}

export interface Bookmark {
  id: string;
  title: string;
  prompt: string;
  response: string;
  mode: AgentMode;
  agentName: string;
  createdAt: number;
}

export interface SandboxFile {
  id: string;
  path: string;
  content: string;
  mime: string;
  createdAt: number;
  updatedAt: number;
}
