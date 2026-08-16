export interface ApiResult<T> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
  rate?: string;
}

export async function apiFetch<T>(
  url: string,
  init: RequestInit = {}
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init.headers || {}),
      },
    });
    const rate = res.headers?.get?.('x-ratelimit-remaining') || undefined;
    const text = await res.text();
    let data: unknown = undefined;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }
    if (!res.ok) {
      const msg =
        (data && typeof data === 'object' && (data as { message?: string }).message) ||
        (data && typeof data === 'object' && (data as { error?: string }).error) ||
        text.slice(0, 240) ||
        res.statusText;
      return { ok: false, status: res.status, error: String(msg), rate };
    }
    return { ok: true, status: res.status, data: data as T, rate };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const cors = /fail(ed)? to fetch|network request failed|cors/i.test(msg);
    return {
      ok: false,
      status: 0,
      error: cors
        ? 'Jaringan/CORS diblokir di browser. Di Android/Expo Go, API dipanggil langsung. PAT tetap aman di perangkat.'
        : msg,
    };
  }
}

export function utf8ToBase64(str: string): string {
  const btoaFn = (globalThis as { btoa?: (s: string) => string }).btoa;
  if (btoaFn) {
    try {
      return btoaFn(unescape(encodeURIComponent(str)));
    } catch {
      /* fall through */
    }
  }
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    if (c < 0x80) bytes.push(c);
    else if (c < 0x800) bytes.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
    else if (c >= 0xd800 && c <= 0xdbff && i + 1 < str.length) {
      const c2 = str.charCodeAt(++i);
      const cp = 0x10000 + ((c & 0x3ff) << 10) + (c2 & 0x3ff);
      bytes.push(0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 0x3f), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f));
    } else {
      bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
    }
  }
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = bytes[i + 1] ?? 0;
    const c = bytes[i + 2] ?? 0;
    const triple = (a << 16) | (b << 8) | c;
    out += chars[(triple >> 18) & 63] + chars[(triple >> 12) & 63];
    out += i + 1 < bytes.length ? chars[(triple >> 6) & 63] : '=';
    out += i + 2 < bytes.length ? chars[triple & 63] : '=';
  }
  return out;
}

export function base64ToUtf8(b64: string): string {
  const atobFn = (globalThis as { atob?: (s: string) => string }).atob;
  const clean = b64.replace(/\s/g, '');
  if (atobFn) {
    try {
      return decodeURIComponent(escape(atobFn(clean)));
    } catch {
      try {
        return atobFn(clean);
      } catch {
        return '';
      }
    }
  }
  return '';
}
