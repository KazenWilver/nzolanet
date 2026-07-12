import { environment } from '../../../environments/environment';

const TOKEN_KEY = 'nzolanet_token';
const ADMIN_TOKEN_KEY = 'admin_token';

const hasAccessToken = (url: string): boolean => {
  try {
    const query = url.includes('?') ? url.slice(url.indexOf('?') + 1) : '';
    return new URLSearchParams(query).has('access_token');
  } catch {
    return url.includes('access_token=');
  }
};

const appendAccessToken = (url: string): string => {
  if (hasAccessToken(url)) {
    return url;
  }

  if (typeof localStorage === 'undefined') {
    return url;
  }

  // Prefer the regular user token; fall back to the administrator token so the
  // moderation dashboard can also render protected media (author photos, etc.).
  const token = localStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(ADMIN_TOKEN_KEY);
  if (!token) {
    return url;
  }

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}access_token=${encodeURIComponent(token)}`;
};

/**
 * Converte caminhos legados de mensagens (/messages) para o endpoint protegido (/uploads/messages).
 */
export const normalizeProtectedMediaPath = (url: string): string => {
  const path = url.startsWith('/') ? url : `/${url}`;

  if (path.startsWith('/messages/')) {
    return `/uploads/messages/${path.slice('/messages/'.length)}`;
  }

  return path;
};

const isProtectedMediaPath = (path: string): boolean =>
  path.startsWith('/uploads/') || path.startsWith('/messages/');

const toAbsoluteMediaPath = (path: string): string => {
  const normalized = normalizeProtectedMediaPath(path);

  if (!environment.uploadsUrl) {
    return normalized;
  }

  return `${environment.uploadsUrl}${normalized}`;
};

export const resolveMediaUrl = (url: string | undefined | null): string | undefined => {
  if (!url) {
    return undefined;
  }

  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }

  const path = url.startsWith('/') ? url : `/${url}`;

  if (!isProtectedMediaPath(path)) {
    return path;
  }

  return appendAccessToken(toAbsoluteMediaPath(path));
};

/**
 * URL autenticada para transferência (Content-Disposition: attachment no servidor).
 */
export const resolveMediaDownloadUrl = (
  url: string | undefined | null,
  fileName?: string
): string | undefined => {
  const resolved = resolveMediaUrl(url);
  if (!resolved) {
    return undefined;
  }

  const separator = resolved.includes('?') ? '&' : '?';
  const params = new URLSearchParams(resolved.includes('?') ? resolved.slice(resolved.indexOf('?') + 1) : '');
  params.set('download', 'true');

  if (fileName?.trim()) {
    params.set('filename', fileName.trim());
  }

  const base = resolved.includes('?') ? resolved.slice(0, resolved.indexOf('?')) : resolved;
  return `${base}?${params.toString()}`;
};
