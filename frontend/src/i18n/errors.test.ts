import i18n from '.';
import { getErrorMessage } from './errors';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// The backend enum is the source of truth for codes.
const backendCodes = [
  ...readFileSync(
    resolve(__dirname, '../../../backend/src/common/errors/error-codes.ts'),
    'utf8',
  ).matchAll(/^\s+[A-Z_]+ = '([A-Z_]+)',$/gm),
].map((m) => m[1]);

describe('getErrorMessage', () => {
  it('translates a backend code in the active language', async () => {
    const error = { response: { data: { code: 'AUTH_INVALID_CREDENTIALS', message: 'Invalid credentials' } } };
    expect(getErrorMessage(error)).toBe('Wrong email or password.');
    await i18n.changeLanguage('ru');
    expect(getErrorMessage(error)).toBe('Неверный email или пароль.');
    await i18n.changeLanguage('kk');
    expect(getErrorMessage(error)).toBe('Email немесе құпиясөз қате.');
  });

  it('falls back to UNKNOWN for unknown codes and NETWORK without a response', () => {
    expect(getErrorMessage({ response: { data: { code: 'NOPE' } } })).toBe(
      'Something went wrong. Please try again.',
    );
    expect(getErrorMessage({ request: {} })).toMatch(/Cannot reach the server/);
    expect(getErrorMessage(undefined)).toMatch(/Something went wrong/);
  });

  it('prefers a known code and NETWORK over the caller fallback', () => {
    const fallback = 'Could not submit';
    expect(getErrorMessage({ response: { data: { code: 'NOPE' } } }, fallback)).toBe(fallback);
    expect(getErrorMessage(new Error('boom'), fallback)).toBe(fallback);
    expect(getErrorMessage({ response: { data: { code: 'ORDER_NOT_OPEN' } } }, fallback)).toBe(
      'This order is no longer accepting applications.',
    );
    expect(getErrorMessage({ request: {} }, fallback)).toMatch(/Cannot reach the server/);
  });

  it('has a translation for every backend error code', () => {
    expect(backendCodes.length).toBeGreaterThan(20);
    for (const code of backendCodes) {
      expect(i18n.exists(code, { ns: 'errors', lng: 'en' }), code).toBe(true);
    }
  });
});
