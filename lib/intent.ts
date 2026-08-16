import { ConnectorPlatform } from './types';
import { parseRepoRef } from './github';

export type IntentKind =
  | 'github.whoami'
  | 'github.repos'
  | 'github.repo'
  | 'github.issues'
  | 'github.createIssue'
  | 'github.prs'
  | 'github.commits'
  | 'github.actions'
  | 'github.dispatch'
  | 'github.createRepo'
  | 'github.putFile'
  | 'github.tree'
  | 'github.releases'
  | 'github.search'
  | 'vercel.status'
  | 'vercel.deploy'
  | 'netlify.status'
  | 'gitlab.projects'
  | 'do.droplets'
  | 'cf.zones'
  | 'connector.ping'
  | 'none';

export interface ParsedIntent {
  kind: IntentKind;
  platform?: ConnectorPlatform;
  owner?: string;
  repo?: string;
  title?: string;
  body?: string;
  path?: string;
  content?: string;
  message?: string;
  workflow?: string;
  ref?: string;
  query?: string;
  priv?: boolean;
}

function has(t: string, words: string[]): boolean {
  return words.some((w) => t.includes(w));
}

export function parseIntent(raw: string): ParsedIntent {
  const t = raw.toLowerCase();
  const ref = parseRepoRef(raw);

  if (has(t, ['buat repo', 'create repo', 'new repo', 'buat repositori', 'buat repository'])) {
    const name = raw.replace(/.*?(repo|repositori|repository)\s+/i, '').trim().split(/\s+/)[0] || 'musgo-app';
    return { kind: 'github.createRepo', platform: 'github', repo: name.replace(/[^A-Za-z0-9._-]/g, '-'), priv: t.includes('private') };
  }

  if (has(t, ['buat issue', 'create issue', 'buka issue', 'new issue'])) {
    const title = raw.replace(/.*?(issue)\s*[:\-]?\s*/i, '').trim() || raw;
    return { kind: 'github.createIssue', platform: 'github', owner: ref?.owner, repo: ref?.repo, title, body: raw };
  }

  if (has(t, ['dispatch', 'trigger workflow', 'jalankan workflow', 'run workflow', 'run action'])) {
    return { kind: 'github.dispatch', platform: 'github', owner: ref?.owner, repo: ref?.repo, workflow: 'ci.yml', ref: 'main' };
  }

  if (has(t, ['commit file', 'push file', 'tulis file ke github', 'put file', 'commit ke repo', 'push ke github'])) {
    return {
      kind: 'github.putFile',
      platform: 'github',
      owner: ref?.owner,
      repo: ref?.repo,
      path: 'HUMANCLI.md',
      content: `# Human CLI\n\nDikirim dari Human CLI · MusGo-OS\n\n${raw}\n`,
      message: 'docs: note from Human CLI',
    };
  }

  if (has(t, ['daftar repo', 'list repo', 'repo saya', 'repositori saya', 'my repos', 'list repository'])) {
    return { kind: 'github.repos', platform: 'github' };
  }

  if (has(t, ['whoami', 'siapa saya github', 'akun github', 'github user', 'cek token github'])) {
    return { kind: 'github.whoami', platform: 'github' };
  }

  if (has(t, ['pull request', ' daftar pr', 'open pr', 'lihat pr'])) {
    return { kind: 'github.prs', platform: 'github', owner: ref?.owner, repo: ref?.repo };
  }

  if (has(t, ['actions run', 'ci status', 'lihat workflow', 'status ci', 'lihat actions']) && !has(t, ['buatkan', 'generate', 'tuliskan', 'auto generate'])) {
    return { kind: 'github.actions', platform: 'github', owner: ref?.owner, repo: ref?.repo };
  }

  if (has(t, ['commit terakhir', 'lihat commit', 'log commit', 'riwayat commit'])) {
    return { kind: 'github.commits', platform: 'github', owner: ref?.owner, repo: ref?.repo };
  }

  if (has(t, ['lihat issue', 'daftar issue', 'open issue', 'list issue'])) {
    return { kind: 'github.issues', platform: 'github', owner: ref?.owner, repo: ref?.repo };
  }

  if (has(t, ['release github', 'lihat release', 'daftar release'])) {
    return { kind: 'github.releases', platform: 'github', owner: ref?.owner, repo: ref?.repo };
  }

  if (has(t, ['isi repo', 'tree repo', 'file di repo', 'ls repo', 'daftar file repo'])) {
    return { kind: 'github.tree', platform: 'github', owner: ref?.owner, repo: ref?.repo };
  }

  if (has(t, ['cari repo', 'search repo', 'cari github'])) {
    return { kind: 'github.search', platform: 'github', query: raw.replace(/.*?(repo|github)\s*/i, '').trim() || raw };
  }

  if (ref && has(t, ['repo ', 'repository', 'github.com'])) {
    return { kind: 'github.repo', platform: 'github', owner: ref.owner, repo: ref.repo };
  }

  if (has(t, ['deploy vercel', 'redeploy', 'vercel deploy', 'deploy sekarang', 'ship vercel'])) {
    return { kind: 'vercel.deploy', platform: 'vercel' };
  }

  if (has(t, ['vercel', 'status deploy', 'deployment vercel', 'daftar project vercel'])) {
    return { kind: 'vercel.status', platform: 'vercel' };
  }

  if (has(t, ['netlify'])) return { kind: 'netlify.status', platform: 'netlify' };
  if (has(t, ['gitlab'])) return { kind: 'gitlab.projects', platform: 'gitlab' };
  if (has(t, ['droplet', 'digitalocean', 'digital ocean'])) return { kind: 'do.droplets', platform: 'digitalocean' };
  if (has(t, ['cloudflare', 'cf zone'])) return { kind: 'cf.zones', platform: 'cloudflare' };

  if (has(t, ['test konektor', 'ping konektor', 'cek konektor', 'test token', 'verify token'])) {
    return { kind: 'connector.ping' };
  }

  return { kind: 'none' };
}
