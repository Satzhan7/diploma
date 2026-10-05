import configuration, { parseBooleanEnv } from './configuration';

describe('DB_MIGRATIONS_RUN', () => {
  const env = { ...process.env };
  afterEach(() => {
    process.env = { ...env };
  });

  it('defaults to on in production and off elsewhere', () => {
    delete process.env.DB_MIGRATIONS_RUN;
    process.env.NODE_ENV = 'production';
    expect(configuration().database.migrationsRun).toBe(true);
    process.env.NODE_ENV = 'development';
    expect(configuration().database.migrationsRun).toBe(false);
  });

  it('can switch migrations off in production and on elsewhere', () => {
    process.env.NODE_ENV = 'production';
    process.env.DB_MIGRATIONS_RUN = 'false';
    expect(configuration().database.migrationsRun).toBe(false);
    process.env.NODE_ENV = 'development';
    process.env.DB_MIGRATIONS_RUN = 'TRUE';
    expect(configuration().database.migrationsRun).toBe(true);
  });

  it('treats an empty value as unset and refuses anything else', () => {
    expect(parseBooleanEnv('DB_MIGRATIONS_RUN', '', true)).toBe(true);
    expect(() => parseBooleanEnv('DB_MIGRATIONS_RUN', '0', true)).toThrow(
      'DB_MIGRATIONS_RUN',
    );
  });
});

describe('FREE_TEST_PERIOD', () => {
  const env = { ...process.env };
  afterEach(() => {
    process.env = { ...env };
  });

  it('is on unless set to false', () => {
    delete process.env.FREE_TEST_PERIOD;
    expect(configuration().freeTestPeriod).toBe(true);
    process.env.FREE_TEST_PERIOD = 'false';
    expect(configuration().freeTestPeriod).toBe(false);
    process.env.FREE_TEST_PERIOD = 'True';
    expect(configuration().freeTestPeriod).toBe(true);
  });

  it('refuses a value that is not true or false', () => {
    process.env.FREE_TEST_PERIOD = 'yes';
    expect(() => configuration()).toThrow('FREE_TEST_PERIOD');
  });
});
