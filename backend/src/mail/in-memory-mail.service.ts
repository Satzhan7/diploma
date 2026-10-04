import { MailMessage, MailService } from './mail.service';

/** Test double: keeps sent messages in memory. */
export class InMemoryMailService extends MailService {
  readonly sent: MailMessage[] = [];

  async send(message: MailMessage): Promise<void> {
    this.sent.push(message);
  }

  lastTo(to: string): MailMessage | undefined {
    return [...this.sent].reverse().find((m) => m.to === to);
  }
}
