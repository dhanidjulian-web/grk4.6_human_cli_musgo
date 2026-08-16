import { AgentMode } from './types';

export type RootStackParamList = {
  Tabs: undefined;
  Sessions: undefined;
  SkillEditor: { id?: string } | undefined;
  SourceEditor: undefined;
  ModelEditor: { id?: string } | undefined;
  AgentEditor: { id?: string } | undefined;
  AssetDetail: { id: string };
  MemoryEditor: undefined;
  ConnectorEditor: { id?: string } | undefined;
  WorkflowEditor: undefined;
  HookEditor: undefined;
  ScheduleEditor: undefined;
  McpEditor: undefined;
  PlatformHub: undefined;
  KeyEditor: { provider?: string } | undefined;
  ModeLab: { mode?: AgentMode } | undefined;
  RepoDetail: { owner: string; repo: string };
  DeployHub: undefined;
  Studio: undefined;
  Bookmarks: undefined;
  Sandbox: undefined;
  SandboxEditor: { id?: string } | undefined;
  SourceDetail: { id: string };
  Backup: undefined;
};

export type TabParamList = {
  Console: undefined;
  Ship: undefined;
  Library: undefined;
  Skills: undefined;
  Models: undefined;
  Profile: undefined;
};
