import { Injectable } from '@nestjs/common';
import { TOTP } from 'otplib';
import { toDataURL } from 'qrcode';

@Injectable()
export class TwoFactorService {
  private totp = new TOTP();

  generateSecret(): string {
    return this.totp.generateSecret();
  }

  generateOtpAuthUrl(email: string, secret: string): string {
    return this.totp.toURI({
      secret,
      label: email,
      issuer: 'FtTranscender',
    });
  }

  async generateQrCodeDataUrl(otpAuthUrl: string): Promise<string> {
    return toDataURL(otpAuthUrl);
  }

  async verifyToken(token: string, secret: string): Promise<boolean> {
    const result = await this.totp.verify(token, { secret });
    return result.valid; // extrai o boolean
  }
}