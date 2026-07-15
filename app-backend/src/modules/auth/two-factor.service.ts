import { Injectable } from '@nestjs/common';
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';

@Injectable()
export class TwoFactorService {
  generateSecret(): string {
    return authenticator.generateSecret();
  }

  generateOtpAuthUrl(email: string, secret: string): string {
    return authenticator.keyuri(
      email,
      'FtTranscender',
      secret,
    );
  }

  async generateQrCodeDataUrl(otpAuthUrl: string): Promise<string> {
    return toDataURL(otpAuthUrl);
  }

  async verifyToken(token: string, secret: string): Promise<boolean> {

    const generated = authenticator.generate(secret);
    const result = authenticator.verify({
      token,
      secret,
    });

    console.log('VALIDO:', result);

    return result;
  }
}