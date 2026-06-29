import { environment } from '../../../environments/environment';

export const resolveMediaUrl = (url: string | undefined | null): string | undefined => {
  if (!url) {
    return undefined;
  }

  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }

  const path = url.startsWith('/') ? url : `/${url}`;

  if (!environment.uploadsUrl) {
    return path;
  }

  return `${environment.uploadsUrl}${path}`;
};
