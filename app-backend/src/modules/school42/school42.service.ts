import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface Student42 {
  login: string;
  name: string;
  avatar: string | null;
  campus: string | null;
  level: number;
}

interface AppToken {
  access_token: string;
  expires_at: number;
}

@Injectable()
export class School42Service {
  private readonly logger = new Logger(School42Service.name);
  private readonly baseUrl = 'https://api.intra.42.fr/v2';
  private readonly campusId: number;
  private cachedToken: AppToken | null = null;

  constructor(private readonly configService: ConfigService) {
    this.campusId = this.configService.get<number>('_42SCHOOL_CAMPUS_ID', 68);
  }

  private async getAppToken(): Promise<string> {
    const now = Date.now();
    if (this.cachedToken && this.cachedToken.expires_at > now + 60_000) {
      return this.cachedToken.access_token;
    }

    const tokenUrl = this.configService.getOrThrow('_42SCHOOL_API_URL_TOKEN');
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.configService.getOrThrow('_42SCHOOL_CLIENT_ID'),
      client_secret: this.configService.getOrThrow('_42SCHOOL_CLIENT_SECRET'),
    });

    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`42 app token error ${res.status}: ${err}`);
    }

    const data = await res.json() as { access_token: string; expires_in: number };
    this.cachedToken = {
      access_token: data.access_token,
      expires_at: now + data.expires_in * 1000,
    };

    this.logger.log('42 School app token refreshed');
    return this.cachedToken.access_token;
  }

  private async get42<T>(path: string): Promise<T> {
    const token = await this.getAppToken();
    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`42 API error ${res.status} on ${path}: ${err}`);
    }

    return res.json() as Promise<T>;
  }

  async searchStudents(query: string, limit = 10): Promise<Student42[]> {
    if (!query || query.trim().length < 2) return [];

    try {
      const params = new URLSearchParams({
        'search[login]': query.trim().toLowerCase(),
        'filter[primary_campus_id]': String(this.campusId),
        'page[size]': String(Math.min(limit, 20)),
      });

      const users = await this.get42<any[]>(`/users?${params.toString()}`);

      if (!Array.isArray(users)) return [];

      return users.map((u) => this.mapUser(u));
    } catch (err) {
      this.logger.warn(`searchStudents failed: ${err}`);
      return [];
    }
  }

  async getTopStudents(limit = 20): Promise<Student42[]> {
    try {
      const params = new URLSearchParams({
        'filter[campus_id]': String(this.campusId),
        'page[size]': String(Math.min(limit, 30)),
        'sort': '-level',
      });

      const cursusUsers = await this.get42<any[]>(`/cursus/21/cursus_users?${params.toString()}`);

      if (!Array.isArray(cursusUsers)) return [];

      return cursusUsers.map((cu) => {
        const u = cu.user ?? {};
        return {
          login: u.login ?? '',
          name: u.usual_full_name ?? u.displayname ?? u.login ?? '',
          avatar: this.extractAvatar(u.image),
          campus: 'Luanda',
          level: Number(cu.level ?? 0),
        };
      }).filter((s) => s.login);
    } catch (err) {
      this.logger.warn(`getTopStudents failed: ${err}`);
      return [];
    }
  }

  async getStudent(login: string): Promise<Student42 | null> {
    try {
      const u = await this.get42<any>(`/users/${encodeURIComponent(login)}`);
      if (!u || !u.login) return null;

      const campus = u.campus?.[0]?.name ?? null;
      const cursus = (u.cursus_users ?? []).find((c: any) => c.cursus?.kind === 'main');
      const level = cursus ? Number(cursus.level) : 0;

      return {
        login: u.login,
        name: u.usual_full_name ?? u.displayname ?? u.login,
        avatar: this.extractAvatar(u.image),
        campus,
        level,
      };
    } catch (err) {
      this.logger.warn(`getStudent(${login}) failed: ${err}`);
      return null;
    }
  }

  private mapUser(u: any): Student42 {
    return {
      login: u.login ?? '',
      name: u.usual_full_name ?? u.displayname ?? u.login ?? '',
      avatar: this.extractAvatar(u.image),
      campus: null,
      level: 0,
    };
  }

  private extractAvatar(image: any): string | null {
    if (!image) return null;
    return image.versions?.medium ?? image.versions?.small ?? image.link ?? null;
  }
}
