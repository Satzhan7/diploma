import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';
import { MailMessage, MailService } from './mail.service';

/** SMTP delivery (Mailpit in development; the production provider comes with D2). */
@Injectable()
export class SmtpMailService extends MailService {
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(config: ConfigService) {
    super();
    const user = config.get<string>('mail.smtp.user');
    this.transporter = createTransport({
      host: config.get<string>('mail.smtp.host'),
      port: config.get<number>('mail.smtp.port'),
      secure: config.get<boolean>('mail.smtp.secure'),
      auth: user
        ? { user, pass: config.get<string>('mail.smtp.pass') }
        : undefined,
    });
    this.from = config.get<string>('mail.from');
  }

  async send(message: MailMessage): Promise<void> {
    await this.transporter.sendMail({ from: this.from, ...message });
  }
}
