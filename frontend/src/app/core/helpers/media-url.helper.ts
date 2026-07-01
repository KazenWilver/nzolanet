import { environment } from '../../../environments/environment';

const TOKEN_KEY = 'nzolanet_token';

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

  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    return url;
  }

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}access_token=${encodeURIComponent(token)}`;
};

export const resolveMediaUrl = (url: string | undefined | null): string | undefined => {
  if (!url) {
    return undefined;
  }

  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }

  const path = url.startsWith('/') ? url : `/${url}`;
  const isUploadPath = path.startsWith('/uploads/');

  if (!environment.uploadsUrl) {
    return isUploadPath ? appendAccessToken(path) : path;
  }

  const absoluteUrl = `${environment.uploadsUrl}${path}`;
  return isUploadPath ? appendAccessToken(absoluteUrl) : absoluteUrl;
};
