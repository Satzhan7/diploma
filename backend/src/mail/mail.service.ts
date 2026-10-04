export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/**
 * Sends transactional email. Also the DI token: production binds the SMTP
 * implementation, tests bind InMemoryMailService.
 */
export abstract class MailService {
  abstract send(message: MailMessage): Promise<void>;
}
