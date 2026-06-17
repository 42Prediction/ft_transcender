// modules/auth/two-factor.service.ts
import { Injectable } from '@nestjs/common';
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';

@Injectable()
export class TwoFactorService {

  generateSecret(): string {
    return authenticator.generateSecret();
  }

  generateOtpAuthUrl(email: string, secret: string): string {
    const appName = 'FtTranscender'; // nome que aparece na app de autenticação
    return authenticator.keyuri(email, appName, secret);
  }

  async generateQrCodeDataUrl(otpAuthUrl: string): Promise<string> {
    return toDataURL(otpAuthUrl);
  }

  verifyToken(token: string, secret: string): boolean {
    return authenticator.verify({ token, secret });
  }
}