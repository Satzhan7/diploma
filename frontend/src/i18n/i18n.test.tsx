import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import i18n, { DEFAULT_LANGUAGE, LANGUAGES, formatMoney } from '.';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { StatusBadge } from '../components/ui/StatusBadge';

const files = import.meta.glob<{ default: Record<string, unknown> }>('./locales/*/*.json', {
  eager: true,
});

// Flatten nested keys and drop plural suffixes, which differ by language
// (ru: one/few/many/other, kk/en: one/other).
const keysOf = (obj: Record<string, unknown>, prefix = ''): string[] =>
  Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object'
      ? keysOf(v as Record<string, unknown>, `${prefix}${k}.`)
      : [`${prefix}${k}`.replace(/_(zero|one|two|few|many|other)$/, '')],
  );

const byNamespace = () => {
  const out: Record<string, Record<string, Set<string>>> = {};
  for (const [path, mod] of Object.entries(files)) {
    const [, lang, ns] = path.match(/\/locales\/([^/]+)\/([^/]+)\.json$/)!;
    (out[ns] ??= {})[lang] = new Set(keysOf(mod.default));
  }
  return out;
};

describe('i18n', () => {
  it('defaults to Russian', () => {
    expect(DEFAULT_LANGUAGE).toBe('ru');
  });

  it('has every namespace in every language with the same keys', () => {
    for (const [ns, langs] of Object.entries(byNamespace())) {
      for (const lng of LANGUAGES) {
        expect(langs[lng], `${lng}/${ns}.json is missing`).toBeDefined();
        expect([...langs[lng]].sort(), `${lng}/${ns}.json keys`).toEqual([...langs.en].sort());
      }
    }
  });

  it('switches RU / KZ / EN from the switcher and translates statuses', async () => {
    render(
      <ChakraProvider>
        <LanguageSwitcher />
        <StatusBadge status="in_progress" />
      </ChakraProvider>,
    );
    expect(screen.getByText('In progress')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Русский' }));
    expect(await screen.findByText('В работе')).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('ru');

    fireEvent.click(screen.getByRole('button', { name: 'Қазақша' }));
    expect(await screen.findByText('Орындалуда')).toBeInTheDocument();
    expect(i18n.language).toBe('kk');
    expect(localStorage.getItem('lang')).toBe('kk');
  });

  it('formats money in tenge', async () => {
    await i18n.changeLanguage('ru');
    expect(formatMoney(150000)).toMatch(/150\s000\s₸/);
  });
});
