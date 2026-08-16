import { AgentPersona, ProfileConfig } from './types';

export interface PickResult {
  agent: AgentPersona;
  score: number;
  reason: string;
  auto: boolean;
}

function scoreAgent(a: AgentPersona, text: string): number {
  const t = text.toLowerCase();
  const blob = `${a.name} ${a.description} ${a.instruction}`.toLowerCase();
  let s = 0;
  const tokens = t.split(/[^a-z0-9]+/i).filter((w) => w.length > 2);
  for (const w of tokens) {
    if (blob.includes(w)) s += 2;
  }
  const hints: [string[], string][] = [
    [['github', 'repo', 'pr', 'issue', 'commit', 'actions', 'workflow'], 'git'],
    [['deploy', 'vercel', 'netlify', 'rilis', 'release'], 'deploy'],
    [['security', 'audit', 'owasp', 'secret'], 'secur'],
    [['gambar', 'image', 'poster', 'visual'], 'image'],
    [['docs', 'skill', 'library', 'sumber', 'knowledge'], 'know'],
    [['ssh', 'vps', 'nginx', 'server'], 'vps'],
  ];
  for (const [words, tag] of hints) {
    if (words.some((w) => t.includes(w)) && blob.includes(tag)) s += 8;
  }
  return s;
}

export function pickAgent(profile: ProfileConfig, input: string, lockId?: string): PickResult {
  const list = profile.agents || [];
  if (list.length === 0) {
    const fallback: AgentPersona = {
      id: 'ag_tmp',
      name: 'Human CLI Core',
      description: 'Default',
      instruction: profile.instruction,
      createdAt: Date.now(),
    };
    return { agent: fallback, score: 0, reason: 'tidak ada agent — pakai instruction profil', auto: true };
  }
  if (lockId) {
    const locked = list.find((a) => a.id === lockId);
    if (locked) return { agent: locked, score: 99, reason: 'dikunci di profil', auto: false };
  }
  const workers = list.filter((a) => a.kind !== 'admin' && a.kind !== 'swarm');
  const pool = workers.length ? workers : list;
  let best = pool[0];
  let bestScore = -1;
  for (const a of pool) {
    const sc = scoreAgent(a, input);
    if (sc > bestScore) {
      best = a;
      bestScore = sc;
    }
  }
  if (bestScore < 2 && profile.activeAgentId) {
    const pref = list.find((a) => a.id === profile.activeAgentId);
    if (pref) return { agent: pref, score: 1, reason: 'default aktif profil', auto: true };
  }
  return {
    agent: best,
    score: bestScore,
    reason: bestScore >= 2 ? `cocok ${bestScore} token` : 'skor rendah → agent teratas',
    auto: true,
  };
}
