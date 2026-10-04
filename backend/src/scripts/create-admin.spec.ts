import {
  MIN_ADMIN_PASSWORD,
  parseAdminEmail,
  resolveAdminPassword,
} from './create-admin';

describe('admin:create arguments', () => {
  it('normalises the email and rejects a missing or malformed one', () => {
    expect(parseAdminEmail('  Ops@AdPartners.kz ')).toBe('ops@adpartners.kz');
    expect(() => parseAdminEmail(undefined)).toThrow('Usage');
    expect(() => parseAdminEmail('not-an-email')).toThrow('Usage');
  });

  it('uses ADMIN_PASSWORD when it is long enough', () => {
    const password = 'x'.repeat(MIN_ADMIN_PASSWORD);
    expect(resolveAdminPassword(password)).toEqual({
      password,
      generated: false,
    });
    expect(() => resolveAdminPassword('short')).toThrow('at least');
  });

  it('generates a random password otherwise', () => {
    const first = resolveAdminPassword(undefined);
    const second = resolveAdminPassword('');
    expect(first.generated).toBe(true);
    expect(first.password.length).toBeGreaterThanOrEqual(MIN_ADMIN_PASSWORD);
    expect(first.password).not.toBe(second.password);
  });
});
