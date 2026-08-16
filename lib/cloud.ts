import { apiFetch, ApiResult } from './http';
import { ConnectorPlatform } from './types';

export async function pingPlatform(
  platform: ConnectorPlatform,
  token: string,
  target?: string
): Promise<ApiResult<unknown>> {
  switch (platform) {
    case 'github':
      return apiFetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
      });
    case 'gitlab': {
      const base = (target || 'https://gitlab.com').replace(/\/$/, '');
      return apiFetch(`${base}/api/v4/user`, { headers: { 'PRIVATE-TOKEN': token } });
    }
    case 'gitea': {
      const base = (target || '').replace(/\/$/, '');
      if (!base) return { ok: false, status: 0, error: 'Isi target = URL instance Gitea' };
      return apiFetch(`${base}/api/v1/user`, { headers: { Authorization: `token ${token}` } });
    }
    case 'vercel':
      return apiFetch('https://api.vercel.com/v2/user', { headers: { Authorization: `Bearer ${token}` } });
    case 'netlify':
      return apiFetch('https://api.netlify.com/api/v1/user', { headers: { Authorization: `Bearer ${token}` } });
    case 'cloudflare':
      return apiFetch('https://api.cloudflare.com/client/v4/user/tokens/verify', {
        headers: { Authorization: `Bearer ${token}` },
      });
    case 'railway':
      return apiFetch('https://backboard.railway.app/graphql/v2', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '{ me { name email } }' }),
      });
    case 'render':
      return apiFetch('https://api.render.com/v1/services?limit=5', {
        headers: { Authorization: `Bearer ${token}` },
      });
    case 'flyio':
      return apiFetch('https://api.fly.io/graphql', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '{ viewer { email } }' }),
      });
    case 'digitalocean':
      return apiFetch('https://api.digitalocean.com/v2/account', {
        headers: { Authorization: `Bearer ${token}` },
      });
    case 'huggingface':
      return apiFetch('https://huggingface.co/api/whoami-v2', {
        headers: { Authorization: `Bearer ${token}` },
      });
    case 'npm':
      return apiFetch('https://registry.npmjs.org/-/whoami', {
        headers: { Authorization: `Bearer ${token}` },
      });
    case 'dockerhub':
      return apiFetch('https://hub.docker.com/v2/user/', {
        headers: { Authorization: `Bearer ${token}` },
      });
    case 'supabase': {
      const base = (target || '').replace(/\/$/, '');
      if (!base) return { ok: false, status: 0, error: 'Isi target = https://xyz.supabase.co' };
      return apiFetch(`${base}/auth/v1/health`, { headers: { apikey: token } });
    }
    case 'webhook': {
      const url = target || '';
      if (!url) return { ok: false, status: 0, error: 'Isi target = URL webhook' };
      return apiFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ ping: true, source: 'human-cli', ts: Date.now() }),
      });
    }
    case 'custom': {
      const url = target || '';
      if (!url) return { ok: false, status: 0, error: 'Isi target = URL API' };
      return apiFetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    }
    default:
      return {
        ok: true,
        status: 200,
        data: { stored: true, note: 'Kredensial tersimpan. Probe live spesifik platform belum dipetakan.' },
      };
  }
}

export async function vercelProjects(token: string) {
  return apiFetch<{ projects?: Array<{ id: string; name: string; framework?: string; updatedAt?: number }> }>(
    'https://api.vercel.com/v9/projects?limit=20',
    { headers: { Authorization: `Bearer ${token}` } }
  );
}

export async function vercelDeployments(token: string, projectId?: string) {
  const q = projectId ? `?projectId=${projectId}&limit=12` : '?limit=12';
  return apiFetch<{ deployments?: Array<{ uid: string; name: string; url: string; state: string; created: number }> }>(
    `https://api.vercel.com/v6/deployments${q}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
}

export async function vercelRedeploy(token: string, name: string, repoId?: string) {
  const body: Record<string, unknown> = { name };
  if (repoId) body.gitSource = { type: 'github', repoId: Number(repoId), ref: 'main' };
  return apiFetch('https://api.vercel.com/v13/deployments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function netlifySites(token: string) {
  return apiFetch<Array<{ id: string; name: string; url: string; ssl_url?: string; updated_at?: string }>>(
    'https://api.netlify.com/api/v1/sites?per_page=20',
    { headers: { Authorization: `Bearer ${token}` } }
  );
}

export async function gitlabProjects(token: string, base = 'https://gitlab.com') {
  return apiFetch<Array<{ id: number; path_with_namespace: string; last_activity_at: string; web_url: string }>>(
    `${base.replace(/\/$/, '')}/api/v4/projects?membership=true&simple=true&per_page=20&order_by=last_activity_at`,
    { headers: { 'PRIVATE-TOKEN': token } }
  );
}

export async function doDroplets(token: string) {
  return apiFetch<{ droplets?: Array<{ id: number; name: string; status: string; region?: { slug: string } }> }>(
    'https://api.digitalocean.com/v2/droplets?per_page=20',
    { headers: { Authorization: `Bearer ${token}` } }
  );
}

export async function cfZones(token: string) {
  return apiFetch<{ result?: Array<{ id: string; name: string; status: string }> }>(
    'https://api.cloudflare.com/client/v4/zones?per_page=20',
    { headers: { Authorization: `Bearer ${token}` } }
  );
}

export function summarizePing(platform: ConnectorPlatform, res: ApiResult<unknown>): string {
  if (!res.ok) return res.error || 'gagal';
  const d = res.data as Record<string, unknown> | undefined;
  if (!d || typeof d !== 'object') return 'ok';
  if (platform === 'github') return String((d as { login?: string }).login || 'ok');
  if (platform === 'gitlab' || platform === 'gitea') return String((d as { username?: string }).username || (d as { name?: string }).name || 'ok');
  if (platform === 'vercel') {
    const u = (d as { user?: { username?: string } }).user;
    return u?.username || 'ok';
  }
  if (platform === 'huggingface') return String((d as { name?: string }).name || 'ok');
  if (platform === 'npm') return String((d as { username?: string }).username || 'ok');
  if (platform === 'digitalocean') {
    const email = (d as { account?: { email?: string } }).account?.email;
    return email || 'ok';
  }
  if (platform === 'cloudflare') return 'token valid';
  if (platform === 'railway' || platform === 'flyio') {
    const me = (d as { data?: { me?: { email?: string }; viewer?: { email?: string } } }).data;
    return me?.me?.email || me?.viewer?.email || 'ok';
  }
  return 'ok';
}
