import i18n from '.';

interface ApiErrorLike {
  response?: { data?: { code?: unknown; details?: unknown } };
  request?: unknown;
}

/**
 * Translated message for a failed API call. The backend sends a stable
 * `code` (backend/src/common/errors/error-codes.ts); a request with no
 * response gives NETWORK, anything else the caller's `fallback` or UNKNOWN.
 */
export function getErrorMessage(error: unknown, fallback?: string): string {
  const err = (error ?? {}) as ApiErrorLike;
  const code = err.response?.data?.code;
  if (typeof code === 'string' && i18n.exists(code, { ns: 'errors' })) {
    return i18n.t(code, { ns: 'errors' });
  }
  if (err.request && !err.response) {
    return i18n.t('NETWORK', { ns: 'errors' });
  }
  return fallback ?? i18n.t('UNKNOWN', { ns: 'errors' });
}

/**
 * Translated message per field from a VALIDATION_FAILED response
 * (`details: [{ field, rule }]`); the first failed rule of each field wins.
 */
export function getFieldErrors(error: unknown): Record<string, string> {
  const details = ((error ?? {}) as ApiErrorLike).response?.data?.details;
  const out: Record<string, string> = {};
  if (!Array.isArray(details)) return out;
  for (const detail of details as { field?: unknown; rule?: unknown }[]) {
    const { field, rule } = detail ?? {};
    if (typeof field !== 'string' || typeof rule !== 'string' || field in out) continue;
    const key = `validation.${rule}`;
    out[field] = i18n.t(i18n.exists(key, { ns: 'errors' }) ? key : 'validation.default', { ns: 'errors' });
  }
  return out;
}
