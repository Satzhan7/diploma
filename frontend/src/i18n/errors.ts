import i18n from '.';

interface ApiErrorLike {
  response?: { data?: { code?: unknown } };
  request?: unknown;
}

/**
 * Translated message for a failed API call. The backend sends a stable
 * `code` (backend/src/common/errors/error-codes.ts); unknown codes fall back
 * to UNKNOWN, a request with no response to NETWORK.
 */
export function getErrorMessage(error: unknown): string {
  const err = (error ?? {}) as ApiErrorLike;
  const code = err.response?.data?.code;
  if (typeof code === 'string' && i18n.exists(code, { ns: 'errors' })) {
    return i18n.t(code, { ns: 'errors' });
  }
  if (err.request && !err.response) {
    return i18n.t('NETWORK', { ns: 'errors' });
  }
  return i18n.t('UNKNOWN', { ns: 'errors' });
}
