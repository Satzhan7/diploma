import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Supported UI languages. Russian is the default (product brief §8).
// Kazakh uses the ISO 639-1 code `kk`; the switcher labels it "KZ".
export const LANGUAGES = ['ru', 'kk', 'en'] as const;
export type Language = (typeof LANGUAGES)[number];
export const DEFAULT_LANGUAGE: Language = 'ru';

const STORAGE_KEY = 'lang';

// Each JSON file is one namespace: locales/<lang>/<namespace>.json.
const files = import.meta.glob<{ default: Record<string, unknown> }>(
  './locales/*/*.json',
  { eager: true },
);
const resources: Record<string, Record<string, Record<string, unknown>>> = {};
for (const [path, mod] of Object.entries(files)) {
  const [, lang, ns] = path.match(/\.\/locales\/([^/]+)\/([^/]+)\.json$/)!;
  (resources[lang] ??= {})[ns] = mod.default;
}

export const isLanguage = (value: unknown): value is Language =>
  LANGUAGES.includes(value as Language);

function storedLanguage(): Language {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return isLanguage(value) ? value : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

i18n.use(initReactI18next).init({
  resources,
  lng: storedLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: [...LANGUAGES],
  defaultNS: 'common',
  interpolation: { escapeValue: false }, // React already escapes.
});

const syncDocument = (lng: string) => {
  document.documentElement.lang = lng;
};
syncDocument(i18n.language);
i18n.on('languageChanged', (lng) => {
  syncDocument(lng);
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch {
    // Private mode or blocked storage: the choice lasts for this page only.
  }
});

// BCP 47 locale for Intl formatting.
const INTL_LOCALE: Record<Language, string> = {
  ru: 'ru-RU',
  kk: 'kk-KZ',
  en: 'en-US',
};
const intlLocale = () =>
  INTL_LOCALE[isLanguage(i18n.language) ? i18n.language : DEFAULT_LANGUAGE];

export const formatDate = (
  value: string | number | Date,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' },
) => new Intl.DateTimeFormat(intlLocale(), options).format(new Date(value));

export const formatTime = (value: string | number | Date) =>
  formatDate(value, { timeStyle: 'short' });

export const formatNumber = (value: number) =>
  new Intl.NumberFormat(intlLocale()).format(value);

// Deals are priced in tenge.
export const formatMoney = (value: number) =>
  new Intl.NumberFormat(intlLocale(), {
    style: 'currency',
    currency: 'KZT',
    currencyDisplay: 'narrowSymbol', // ₸, not "KZT"
    maximumFractionDigits: 0,
  }).format(value);

export default i18n;
