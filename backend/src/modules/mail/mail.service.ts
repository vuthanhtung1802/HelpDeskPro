import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private transporter?: Transporter;

  constructor(private readonly config: ConfigService) {}

  isEnabled(): boolean {
    return this.config.get<boolean>('SMTP_ENABLED') === true;
  }

  async sendPasswordReset(email: string, token: string): Promise<void> {
    if (!this.isEnabled()) return;

    const resetUrl = new URL(
      this.config.getOrThrow<string>('RESET_PASSWORD_URL'),
    );
    resetUrl.searchParams.set('token', token);

    await this.getTransporter().sendMail({
      from: this.config.getOrThrow<string>('MAIL_FROM'),
      to: email,
      subject: 'Đặt lại mật khẩu HelpDesk Pro',
      text: [
        'Bạn đã yêu cầu đặt lại mật khẩu HelpDesk Pro.',
        `Mở liên kết này trong vòng 15 phút: ${resetUrl.toString()}`,
        'Nếu bạn không yêu cầu thao tác này, hãy bỏ qua email.',
      ].join('\n\n'),
    });
  }

  private getTransporter(): Transporter {
    this.transporter ??= nodemailer.createTransport({
      host: this.config.getOrThrow<string>('SMTP_HOST'),
      port: this.config.getOrThrow<number>('SMTP_PORT'),
      secure: this.config.getOrThrow<boolean>('SMTP_SECURE'),
      auth: {
        user: this.config.getOrThrow<string>('SMTP_USER'),
        pass: this.config.getOrThrow<string>('SMTP_PASSWORD'),
      },
    });
    return this.transporter;
  }
}
