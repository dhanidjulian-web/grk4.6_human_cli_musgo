import { Platform, Share } from 'react-native';
import { TerminalLine } from './types';

export type ExportKind = 'txt' | 'md' | 'csv' | 'html' | 'json' | 'pdf' | 'docx';

export function linesToText(lines: TerminalLine[]): string {
  return lines.map((l) => l.text).join('\n');
}

export function buildExport(kind: ExportKind, title: string, prompt: string, body: string): { name: string; mime: string; content: string } {
  const safe = (title || 'human-cli').replace(/[^\w.-]+/g, '-').slice(0, 48);
  const ts = new Date().toISOString();
  if (kind === 'md') {
    return {
      name: `${safe}.md`,
      mime: 'text/markdown',
      content: `# ${title}\n\n> ${prompt}\n\n${body}\n\n---\n*Human CLI · ${ts}*\n`,
    };
  }
  if (kind === 'csv') {
    const rows = [['role', 'text'], ['user', prompt.replace(/"/g, '""')], ...body.split('\n').map((ln) => ['agent', ln.replace(/"/g, '""')])];
    return {
      name: `${safe}.csv`,
      mime: 'text/csv',
      content: rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n'),
    };
  }
  if (kind === 'json') {
    return {
      name: `${safe}.json`,
      mime: 'application/json',
      content: JSON.stringify({ title, prompt, body, ts, app: 'Human CLI' }, null, 2),
    };
  }
  if (kind === 'html' || kind === 'pdf') {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${escapeHtml(title)}</title>
<style>body{font-family:Georgia,serif;max-width:720px;margin:40px auto;padding:0 16px;color:#111}pre{white-space:pre-wrap;background:#f4f4f4;padding:12px;border-radius:8px}h1{font-size:22px}.meta{color:#666;font-size:12px}</style></head>
<body><h1>${escapeHtml(title)}</h1><p class="meta">${escapeHtml(prompt)}</p><pre>${escapeHtml(body)}</pre><p class="meta">Human CLI · ${ts}</p></body></html>`;
    return { name: `${safe}.${kind === 'pdf' ? 'html' : 'html'}`, mime: 'text/html', content: html };
  }
  if (kind === 'docx') {
    return {
      name: `${safe}.doc`,
      mime: 'application/msword',
      content: `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"></head><body><h1>${escapeHtml(title)}</h1><p>${escapeHtml(prompt)}</p><pre>${escapeHtml(body)}</pre></body></html>`,
    };
  }
  return { name: `${safe}.txt`, mime: 'text/plain', content: `${title}\n\nPROMPT:\n${prompt}\n\nRESPONSE:\n${body}\n` };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function shareExport(kind: ExportKind, title: string, prompt: string, body: string): Promise<void> {
  const file = buildExport(kind, title, prompt, body);
  await Share.share({
    title: file.name,
    message: Platform.OS === 'web' ? file.content : `${file.name}\n\n${file.content.slice(0, 8000)}`,
  });
  if (typeof document !== 'undefined') {
    const blob = new Blob([file.content], { type: file.mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export function pollinationsImage(prompt: string, w = 768, h = 768): string {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?nologo=true&width=${w}&height=${h}`;
}

export function pollinationsVideo(prompt: string): string {
  return `https://gen.pollinations.ai/image/${encodeURIComponent(prompt + ' cinematic video still storyboard')}?nologo=true&width=1280&height=720`;
}
