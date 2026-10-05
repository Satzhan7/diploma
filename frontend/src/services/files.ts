import api, { API_BASE_URL } from './api';

/** Accepted image types; the server checks the bytes, this only filters the picker. */
export const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp';
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_PORTFOLIO_IMAGES = 6;

/** URL of a public file (portfolio image), usable in `<img src>`. */
export const publicFileUrl = (id: string) => `${API_BASE_URL}/files/${id}`;

/**
 * Multipart body. The API instance defaults to JSON, which would make axios
 * turn FormData into JSON; the browser adds the boundary itself.
 */
export const multipart = { headers: { 'Content-Type': 'multipart/form-data' } };

export const imageForm = (file: File, fields: Record<string, string | number> = {}) => {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.append(key, String(value));
  form.append('file', file);
  return form;
};

export const filesService = {
  myPortfolio: async () => (await api.get('/files/portfolio/me')).data as { id: string }[],
  addPortfolio: async (file: File) =>
    (await api.post('/files/portfolio', imageForm(file), multipart)).data as { id: string },
  removePortfolio: async (id: string) => {
    await api.delete(`/files/portfolio/${id}`);
  },
  /** A private image (stats screenshot) as an object URL; revoke it when done. */
  objectUrl: async (id: string) =>
    URL.createObjectURL((await api.get(`/files/${id}`, { responseType: 'blob' })).data as Blob),
};
