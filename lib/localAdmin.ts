import { AgentPersona, ProfileConfig } from './types';

export function localAdminThink(input: string, profile: ProfileConfig, agent: AgentPersona): string {
  const agents = profile.agents.map((a) => `${a.kind || 'worker'}:${a.name}`).join(', ');
  const tools = profile.tools.filter((t) => t.enabled).map((t) => t.name).join(', ');
  return [
    `[local-always-on] ${agent.name}`,
    agent.instruction,
    '',
    `input   ${input}`,
    `swarm   ${agents}`,
    `tools   ${tools || '—'}`,
    '',
    'Admin kernel lokal selalu hidup (tanpa API key).',
    'Delegasi: Swarm Orchestrator memilih worker; worker boleh pilih model external/BYOK.',
    'Admin sendiri terkunci ke model lokal ini.',
  ].join('\n');
}
