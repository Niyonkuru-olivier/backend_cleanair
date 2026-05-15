import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendWelcomeEmail(to: string, name: string, tempPassword: string) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const loginUrl = `${frontendUrl}/login`;
    const systemName = 'CleanAir System';

    const mailOptions = {
      from: `"${systemName}" <${this.configService.get<string>('MAIL_FROM')}>`,
      to,
      subject: `Welcome to ${systemName} - Your Account is Ready`,
      text: `Hi ${name},\n\nYour account has been created on ${systemName}.\n\nHere are your login credentials:\n  Email:              ${to}\n  Temporary Password: ${tempPassword}\n\n👉 Login here: ${loginUrl}\n\nFor security, you will be asked to reset your password on your first login.\n\nIf you did not expect this email, please ignore it.\n\n— The ${systemName} Team`,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Welcome email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
      throw error;
    }
  }

  async sendResetPasswordEmail(to: string, name: string, resetToken: string) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(to)}`;
    const systemName = 'CleanAir System';

    const mailOptions = {
      from: `"${systemName}" <${this.configService.get<string>('MAIL_FROM')}>`,
      to,
      subject: `Reset Your Password - ${systemName}`,
      text: `Hi ${name},\n\nYou requested to reset your password for ${systemName}.\n\n👉 Click the link below to set a new password:\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you did not request this, please ignore this email.\n\n— The ${systemName} Team`,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Reset password email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send reset email to ${to}: ${error.message}`);
      throw error;
    }
  }
}
