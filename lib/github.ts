import { apiFetch, ApiResult, base64ToUtf8, utf8ToBase64 } from './http';

const GH = 'https://api.github.com';

function headers(token?: string): Record<string, string> {
  const h: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

function gh<T>(path: string, token?: string, init: RequestInit = {}): Promise<ApiResult<T>> {
  return apiFetch<T>(`${GH}${path}`, {
    ...init,
    headers: { ...headers(token), ...(init.headers as Record<string, string> | undefined) },
  });
}

export interface GhUser {
  login: string;
  name?: string;
  avatar_url?: string;
  html_url?: string;
  public_repos?: number;
  total_private_repos?: number;
  followers?: number;
  plan?: { name: string };
  bio?: string;
}

export interface GhRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  description?: string | null;
  html_url: string;
  language?: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
  updated_at: string;
  pushed_at?: string;
  owner: { login: string };
  fork?: boolean;
  archived?: boolean;
  visibility?: string;
}

export interface GhIssue {
  id: number;
  number: number;
  title: string;
  state: string;
  html_url: string;
  user?: { login: string };
  comments: number;
  created_at: string;
  pull_request?: { url: string };
  labels?: { name: string; color: string }[];
}

export interface GhPull {
  id: number;
  number: number;
  title: string;
  state: string;
  html_url: string;
  user?: { login: string };
  head?: { ref: string };
  base?: { ref: string };
  draft?: boolean;
  created_at: string;
}

export interface GhCommit {
  sha: string;
  html_url: string;
  commit: { message: string; author?: { name: string; date: string } };
  author?: { login: string } | null;
}

export interface GhWorkflow {
  id: number;
  name: string;
  path: string;
  state: string;
  html_url?: string;
}

export interface GhRun {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  html_url: string;
  head_branch: string;
  event: string;
  created_at: string;
  display_title?: string;
}

export interface GhContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  type: 'file' | 'dir' | 'symlink' | 'submodule';
  download_url?: string | null;
  content?: string;
  encoding?: string;
  html_url?: string;
}

export interface GhRelease {
  id: number;
  tag_name: string;
  name: string;
  html_url: string;
  draft: boolean;
  prerelease: boolean;
  published_at?: string;
}

export const github = {
  me: (token: string) => gh<GhUser>('/user', token),

  repos: (token: string, page = 1) =>
    gh<GhRepo[]>(`/user/repos?per_page=40&sort=updated&page=${page}&affiliation=owner,collaborator,organization_member`, token),

  repo: (token: string | undefined, owner: string, repo: string) =>
    gh<GhRepo>(`/repos/${owner}/${repo}`, token),

  issues: (token: string | undefined, owner: string, repo: string) =>
    gh<GhIssue[]>(`/repos/${owner}/${repo}/issues?state=open&per_page=30`, token),

  createIssue: (token: string, owner: string, repo: string, title: string, body: string) =>
    gh<GhIssue>(`/repos/${owner}/${repo}/issues`, token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body }),
    }),

  pulls: (token: string | undefined, owner: string, repo: string) =>
    gh<GhPull[]>(`/repos/${owner}/${repo}/pulls?state=open&per_page=30`, token),

  commits: (token: string | undefined, owner: string, repo: string) =>
    gh<GhCommit[]>(`/repos/${owner}/${repo}/commits?per_page=20`, token),

  workflows: (token: string, owner: string, repo: string) =>
    gh<{ total_count: number; workflows: GhWorkflow[] }>(`/repos/${owner}/${repo}/actions/workflows`, token),

  runs: (token: string, owner: string, repo: string) =>
    gh<{ total_count: number; workflow_runs: GhRun[] }>(`/repos/${owner}/${repo}/actions/runs?per_page=15`, token),

  dispatch: (token: string, owner: string, repo: string, workflow: string, ref: string) =>
    gh<unknown>(`/repos/${owner}/${repo}/actions/workflows/${encodeURIComponent(workflow)}/dispatches`, token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref }),
    }),

  createRepo: (token: string, name: string, description: string, priv: boolean) =>
    gh<GhRepo>('/user/repos', token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, private: priv, auto_init: true }),
    }),

  contents: (token: string | undefined, owner: string, repo: string, path = '') =>
    gh<GhContent[] | GhContent>(`/repos/${owner}/${repo}/contents/${path}`, token),

  putFile: async (
    token: string,
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    branch?: string
  ) => {
    let sha: string | undefined;
    const existing = await gh<GhContent>(`/repos/${owner}/${repo}/contents/${path}`, token);
    if (existing.ok && existing.data && !Array.isArray(existing.data)) sha = existing.data.sha;
    return gh<GhContent>(`/repos/${owner}/${repo}/contents/${path}`, token, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        content: utf8ToBase64(content),
        sha,
        branch,
      }),
    });
  },

  decodeFile: (file: GhContent): string => {
    if (!file.content) return '';
    return base64ToUtf8(file.content);
  },

  releases: (token: string | undefined, owner: string, repo: string) =>
    gh<GhRelease[]>(`/repos/${owner}/${repo}/releases?per_page=10`, token),

  deployments: (token: string, owner: string, repo: string) =>
    gh<Array<{ id: number; environment: string; created_at: string; description?: string }>>(
      `/repos/${owner}/${repo}/deployments?per_page=10`,
      token
    ),

  searchRepos: (token: string | undefined, q: string) =>
    gh<{ total_count: number; items: GhRepo[] }>(`/search/repositories?q=${encodeURIComponent(q)}&per_page=15`, token),
};

export function parseRepoRef(raw: string): { owner: string; repo: string } | null {
  const m = raw.match(/\b([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)\b/);
  if (!m) return null;
  if (m[0].includes('http') || m[1].includes('.')) {
    const m2 = raw.match(/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)/i);
    if (m2) return { owner: m2[1], repo: m2[2].replace(/\.git$/, '') };
  }
  if (['http', 'https', 'www'].includes(m[1].toLowerCase())) return null;
  return { owner: m[1], repo: m[2].replace(/\.git$/, '') };
}
