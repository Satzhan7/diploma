import { MailMessage } from './mail.service';

export const MAIL_LANGUAGES = ['ru', 'kk', 'en'] as const;
export type MailLanguage = (typeof MAIL_LANGUAGES)[number];

type Content = { subject: string; lines: string[] };
type Vars = { name: string; code?: string };

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ],
  );

/**
 * Plain text plus a minimal HTML body. One pass replaces `{name}` and `{code}`,
 * so a name that contains "{code}" is never expanded.
 */
function render(
  to: string,
  { subject, lines }: Content,
  vars: Vars,
): MailMessage {
  const fill = (line: string, html: boolean) =>
    line.replace(/\{(name|code)\}/g, (_, key: keyof Vars) => {
      const value = vars[key] ?? '';
      if (!html) return value;
      return key === 'code'
        ? `<strong style="font-size:28px;letter-spacing:6px">${escapeHtml(value)}</strong>`
        : escapeHtml(value);
    });
  const html = lines
    .map((line) => `<p>${fill(escapeHtml(line), true)}</p>`)
    .join('\n');
  return {
    to,
    subject,
    text: lines.map((line) => fill(line, false)).join('\n\n'),
    html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.5">${html}</div>`,
  };
}

const CODE: Record<MailLanguage, Content> = {
  ru: {
    subject: 'Код подтверждения AdPartners',
    lines: [
      'Здравствуйте, {name}!',
      'Ваш код подтверждения: {code}',
      'Код действует 10 минут. Если вы не регистрировались на AdPartners.kz, просто проигнорируйте это письмо.',
    ],
  },
  kk: {
    subject: 'AdPartners растау коды',
    lines: [
      'Сәлеметсіз бе, {name}!',
      'Сіздің растау кодыңыз: {code}',
      'Код 10 минут жарамды. Егер сіз AdPartners.kz сайтына тіркелмесеңіз, бұл хатты елемеңіз.',
    ],
  },
  en: {
    subject: 'Your AdPartners verification code',
    lines: [
      'Hello, {name}!',
      'Your verification code: {code}',
      'The code is valid for 10 minutes. If you did not sign up for AdPartners.kz, ignore this email.',
    ],
  },
};

export const verificationCodeMail = (
  to: string,
  name: string,
  code: string,
  lang: MailLanguage,
): MailMessage => render(to, CODE[lang], { name, code });
