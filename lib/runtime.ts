import { LineKind, TerminalLine, ConnectorItem } from './types';
import { github, parseRepoRef } from './github';
import {
  cfZones,
  doDroplets,
  gitlabProjects,
  netlifySites,
  pingPlatform,
  summarizePing,
  vercelDeployments,
  vercelProjects,
} from './cloud';
import { parseIntent } from './intent';
import { getPlatform } from './platforms';

function L(kind: LineKind, text: string): Omit<TerminalLine, 'id' | 'ts'> {
  return { kind, text };
}

export interface RuntimeCtx {
  tokenOf: (platform: string) => Promise<string | null>;
  connectorOf: (platform: string) => ConnectorItem | undefined;
  defaultRepo?: string;
}

function failAuth(platform: string): Omit<TerminalLine, 'id' | 'ts'>[] {
  const p = getPlatform(platform);
  return [
    L('err', `  tidak ada token ${p.label}`),
    L('info', `  buka tab Ship → ${p.label} → simpan ${p.tokenLabel}`),
    L('dim', `  ${p.docs}`),
  ];
}

function resolveRepo(raw: string, fallback?: string): { owner: string; repo: string } | null {
  return parseRepoRef(raw) || (fallback ? parseRepoRef(fallback) : null);
}

export async function executeLive(
  raw: string,
  ctx: RuntimeCtx
): Promise<Omit<TerminalLine, 'id' | 'ts'>[] | null> {
  const intent = parseIntent(raw);
  if (intent.kind === 'none') return null;

  const lines: Omit<TerminalLine, 'id' | 'ts'>[] = [
    L('head', '  LIVE BRIDGE'),
    L('info', `  intent   ${intent.kind}`),
  ];

  try {
    switch (intent.kind) {
      case 'github.whoami': {
        const tok = await ctx.tokenOf('github');
        if (!tok) return [...lines, ...failAuth('github')];
        const r = await github.me(tok);
        if (!r.ok) return [...lines, L('err', `  ${r.error}`)];
        const u = r.data!;
        return [
          ...lines,
          L('ok', `  ${u.login}  ·  ${u.name || '—'}`),
          L('out', `  repos ${u.public_repos ?? 0} public / ${u.total_private_repos ?? 0} private`),
          L('out', `  ${u.html_url}`),
          L('dim', `  rate ${r.rate || '—'}`),
        ];
      }
      case 'github.repos': {
        const tok = await ctx.tokenOf('github');
        if (!tok) return [...lines, ...failAuth('github')];
        const r = await github.repos(tok);
        if (!r.ok) return [...lines, L('err', `  ${r.error}`)];
        const list = r.data || [];
        return [
          ...lines,
          L('ok', `  ${list.length} repo (page 1)`),
          ...list.slice(0, 18).map((repo) =>
            L('out', `  ${repo.private ? '●' : '○'} ${repo.full_name.padEnd(28)}  ${repo.language || '—'}  ★${repo.stargazers_count}`)
          ),
        ];
      }
      case 'github.repo': {
        const spec = resolveRepo(`${intent.owner}/${intent.repo}`, ctx.defaultRepo);
        if (!spec) return [...lines, L('warn', '  sebut owner/repo')];
        const tok = (await ctx.tokenOf('github')) || undefined;
        const r = await github.repo(tok, spec.owner, spec.repo);
        if (!r.ok) return [...lines, L('err', `  ${r.error}`)];
        const repo = r.data!;
        return [
          ...lines,
          L('ok', `  ${repo.full_name}  ·  default ${repo.default_branch}`),
          L('out', `  ${repo.description || '—'}`),
          L('out', `  ★${repo.stargazers_count}  forks ${repo.forks_count}  issues ${repo.open_issues_count}`),
          L('out', `  ${repo.html_url}`),
        ];
      }
      case 'github.issues': {
        const spec = resolveRepo(`${intent.owner || ''}/${intent.repo || ''}`, ctx.defaultRepo);
        if (!spec) return [...lines, L('warn', '  sebut owner/repo atau set default repo di konektor GitHub')];
        const tok = (await ctx.tokenOf('github')) || undefined;
        const r = await github.issues(tok, spec.owner, spec.repo);
        if (!r.ok) return [...lines, L('err', `  ${r.error}`)];
        const issues = (r.data || []).filter((i) => !i.pull_request);
        return [
          ...lines,
          L('ok', `  ${spec.owner}/${spec.repo}  ·  ${issues.length} open issues`),
          ...issues.slice(0, 12).map((i) => L('out', `  #${i.number}  ${i.title}`)),
        ];
      }
      case 'github.createIssue': {
        const tok = await ctx.tokenOf('github');
        if (!tok) return [...lines, ...failAuth('github')];
        const spec = resolveRepo(`${intent.owner || ''}/${intent.repo || ''}`, ctx.defaultRepo);
        if (!spec) return [...lines, L('warn', '  sebut owner/repo')];
        const r = await github.createIssue(tok, spec.owner, spec.repo, intent.title || 'Issue dari Human CLI', intent.body || '');
        if (!r.ok) return [...lines, L('err', `  ${r.error}`)];
        return [...lines, L('ok', `  created #${r.data!.number}  ${r.data!.html_url}`)];
      }
      case 'github.prs': {
        const spec = resolveRepo(`${intent.owner || ''}/${intent.repo || ''}`, ctx.defaultRepo);
        if (!spec) return [...lines, L('warn', '  sebut owner/repo')];
        const tok = (await ctx.tokenOf('github')) || undefined;
        const r = await github.pulls(tok, spec.owner, spec.repo);
        if (!r.ok) return [...lines, L('err', `  ${r.error}`)];
        const prs = r.data || [];
        return [
          ...lines,
          L('ok', `  ${prs.length} open PR`),
          ...prs.slice(0, 12).map((p) => L('out', `  #${p.number}  ${p.title}  (${p.head?.ref} → ${p.base?.ref})`)),
        ];
      }
      case 'github.commits': {
        const spec = resolveRepo(`${intent.owner || ''}/${intent.repo || ''}`, ctx.defaultRepo);
        if (!spec) return [...lines, L('warn', '  sebut owner/repo')];
        const tok = (await ctx.tokenOf('github')) || undefined;
        const r = await github.commits(tok, spec.owner, spec.repo);
        if (!r.ok) return [...lines, L('err', `  ${r.error}`)];
        return [
          ...lines,
          L('ok', `  last ${(r.data || []).length} commits`),
          ...(r.data || []).slice(0, 10).map((c) =>
            L('out', `  ${c.sha.slice(0, 7)}  ${(c.commit.message || '').split('\n')[0]}`)
          ),
        ];
      }
      case 'github.actions': {
        const spec = resolveRepo(`${intent.owner || ''}/${intent.repo || ''}`, ctx.defaultRepo);
        if (!spec) return [...lines, L('warn', '  sebut owner/repo')];
        const tok = await ctx.tokenOf('github');
        if (!tok) return [...lines, ...failAuth('github')];
        const r = await github.runs(tok, spec.owner, spec.repo);
        if (!r.ok) return [...lines, L('err', `  ${r.error}`)];
        const runs = r.data?.workflow_runs || [];
        return [
          ...lines,
          L('ok', `  ${r.data?.total_count ?? 0} runs`),
          ...runs.slice(0, 10).map((run) =>
            L(run.conclusion === 'failure' ? 'err' : run.conclusion === 'success' ? 'ok' : 'info',
              `  ${run.conclusion || run.status}  ${run.name}  @${run.head_branch}`)
          ),
        ];
      }
      case 'github.dispatch': {
        const tok = await ctx.tokenOf('github');
        if (!tok) return [...lines, ...failAuth('github')];
        const spec = resolveRepo(`${intent.owner || ''}/${intent.repo || ''}`, ctx.defaultRepo);
        if (!spec) return [...lines, L('warn', '  sebut owner/repo')];
        const r = await github.dispatch(tok, spec.owner, spec.repo, intent.workflow || 'ci.yml', intent.ref || 'main');
        if (!r.ok) return [...lines, L('err', `  ${r.error}`)];
        return [...lines, L('ok', `  dispatched ${intent.workflow} @ ${intent.ref}`)];
      }
      case 'github.createRepo': {
        const tok = await ctx.tokenOf('github');
        if (!tok) return [...lines, ...failAuth('github')];
        const name = intent.repo || 'musgo-app';
        const r = await github.createRepo(tok, name, 'Created from Human CLI · MusGo-OS', !!intent.priv);
        if (!r.ok) return [...lines, L('err', `  ${r.error}`)];
        return [...lines, L('ok', `  created ${r.data!.full_name}`), L('out', `  ${r.data!.html_url}`)];
      }
      case 'github.putFile': {
        const tok = await ctx.tokenOf('github');
        if (!tok) return [...lines, ...failAuth('github')];
        const spec = resolveRepo(`${intent.owner || ''}/${intent.repo || ''}`, ctx.defaultRepo);
        if (!spec) return [...lines, L('warn', '  sebut owner/repo')];
        const r = await github.putFile(
          tok,
          spec.owner,
          spec.repo,
          intent.path || 'HUMANCLI.md',
          intent.content || raw,
          intent.message || 'chore: Human CLI'
        );
        if (!r.ok) return [...lines, L('err', `  ${r.error}`)];
        return [...lines, L('ok', `  wrote ${intent.path} → ${spec.owner}/${spec.repo}`)];
      }
      case 'github.tree': {
        const spec = resolveRepo(`${intent.owner || ''}/${intent.repo || ''}`, ctx.defaultRepo);
        if (!spec) return [...lines, L('warn', '  sebut owner/repo')];
        const tok = (await ctx.tokenOf('github')) || undefined;
        const r = await github.contents(tok, spec.owner, spec.repo, '');
        if (!r.ok) return [...lines, L('err', `  ${r.error}`)];
        const items = Array.isArray(r.data) ? r.data : [r.data!];
        return [
          ...lines,
          L('ok', `  ${spec.owner}/${spec.repo}  root`),
          ...items.slice(0, 24).map((it) => L('out', `  ${it.type === 'dir' ? 'd' : '-'}  ${it.path}`)),
        ];
      }
      case 'github.releases': {
        const spec = resolveRepo(`${intent.owner || ''}/${intent.repo || ''}`, ctx.defaultRepo);
        if (!spec) return [...lines, L('warn', '  sebut owner/repo')];
        const tok = (await ctx.tokenOf('github')) || undefined;
        const r = await github.releases(tok, spec.owner, spec.repo);
        if (!r.ok) return [...lines, L('err', `  ${r.error}`)];
        return [
          ...lines,
          ...(r.data || []).slice(0, 8).map((rel) => L('out', `  ${rel.tag_name}  ${rel.name}`)),
        ];
      }
      case 'github.search': {
        const tok = (await ctx.tokenOf('github')) || undefined;
        const r = await github.searchRepos(tok, intent.query || raw);
        if (!r.ok) return [...lines, L('err', `  ${r.error}`)];
        return [
          ...lines,
          L('ok', `  ${r.data?.total_count ?? 0} hits`),
          ...(r.data?.items || []).slice(0, 10).map((repo) => L('out', `  ${repo.full_name}  ★${repo.stargazers_count}`)),
        ];
      }
      case 'vercel.status': {
        const tok = await ctx.tokenOf('vercel');
        if (!tok) return [...lines, ...failAuth('vercel')];
        const p = await vercelProjects(tok);
        if (!p.ok) return [...lines, L('err', `  ${p.error}`)];
        const d = await vercelDeployments(tok);
        return [
          ...lines,
          L('ok', `  ${(p.data?.projects || []).length} projects`),
          ...(p.data?.projects || []).slice(0, 8).map((pr) => L('out', `  ▲ ${pr.name}`)),
          L('sep', '  ─ deployments'),
          ...(d.data?.deployments || []).slice(0, 6).map((dep) => L('out', `  ${dep.state}  ${dep.url}`)),
        ];
      }
      case 'vercel.deploy': {
        const tok = await ctx.tokenOf('vercel');
        if (!tok) return [...lines, ...failAuth('vercel')];
        const p = await vercelProjects(tok);
        if (!p.ok) return [...lines, L('err', `  ${p.error}`)];
        const first = p.data?.projects?.[0];
        if (!first) return [...lines, L('warn', '  tidak ada project Vercel')];
        return [
          ...lines,
          L('ok', `  project aktif: ${first.name}`),
          L('info', '  redeploy penuh butuh gitSource. Trigger dari GitHub push, atau buka tab Ship → Vercel.'),
          L('dim', '  ketik: daftar project vercel  ·  atau commit + push ke repo terhubung'),
        ];
      }
      case 'netlify.status': {
        const tok = await ctx.tokenOf('netlify');
        if (!tok) return [...lines, ...failAuth('netlify')];
        const r = await netlifySites(tok);
        if (!r.ok) return [...lines, L('err', `  ${r.error}`)];
        const sites = r.data || [];
        return [
          ...lines,
          L('ok', `  ${sites.length} sites`),
          ...sites.slice(0, 10).map((s) => L('out', `  ${s.name}  ${s.ssl_url || s.url}`)),
        ];
      }
      case 'gitlab.projects': {
        const tok = await ctx.tokenOf('gitlab');
        if (!tok) return [...lines, ...failAuth('gitlab')];
        const con = ctx.connectorOf('gitlab');
        const r = await gitlabProjects(tok, con?.target || 'https://gitlab.com');
        if (!r.ok) return [...lines, L('err', `  ${r.error}`)];
        return [
          ...lines,
          ...(r.data || []).slice(0, 12).map((p) => L('out', `  ${p.path_with_namespace}`)),
        ];
      }
      case 'do.droplets': {
        const tok = await ctx.tokenOf('digitalocean');
        if (!tok) return [...lines, ...failAuth('digitalocean')];
        const r = await doDroplets(tok);
        if (!r.ok) return [...lines, L('err', `  ${r.error}`)];
        return [
          ...lines,
          ...(r.data?.droplets || []).map((d) => L('out', `  ${d.status.padEnd(8)} ${d.name}  ${d.region?.slug || ''}`)),
        ];
      }
      case 'cf.zones': {
        const tok = await ctx.tokenOf('cloudflare');
        if (!tok) return [...lines, ...failAuth('cloudflare')];
        const r = await cfZones(tok);
        if (!r.ok) return [...lines, L('err', `  ${r.error}`)];
        return [
          ...lines,
          ...(r.data?.result || []).map((z) => L('out', `  ${z.status.padEnd(10)} ${z.name}`)),
        ];
      }
      case 'connector.ping': {
        const platforms = ['github', 'vercel', 'gitlab', 'netlify', 'cloudflare', 'digitalocean'] as const;
        const out: Omit<TerminalLine, 'id' | 'ts'>[] = [...lines];
        for (const plat of platforms) {
          const tok = await ctx.tokenOf(plat);
          if (!tok) {
            out.push(L('dim', `  ${plat.padEnd(14)}  —  no token`));
            continue;
          }
          const con = ctx.connectorOf(plat);
          const r = await pingPlatform(plat, tok, con?.target);
          out.push(r.ok ? L('ok', `  ${plat.padEnd(14)}  ${summarizePing(plat, r)}`) : L('err', `  ${plat.padEnd(14)}  ${r.error}`));
        }
        return out;
      }
      default:
        return null;
    }
  } catch (e) {
    return [...lines, L('err', `  ${e instanceof Error ? e.message : String(e)}`)];
  }
}
