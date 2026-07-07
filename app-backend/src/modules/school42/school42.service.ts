import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface Student42 {
  login: string;
  name: string;
  avatar: string | null;
  campus: string | null;
  level: number;
}

export interface Exam42 {
  id: number;
  name: string;
  beginAt: string;
  endAt: string;
  location: string | null;
  /** id of the project this exam grades (e.g. "Exam Rank 06"); null if 42 didn't link one. */
  projectId: number | null;
}

export interface ExamCadet42 {
  login: string;
  name: string;
  avatar: string | null;
  /** Final grade for the exam once published by 42, 0-100. `null` while pending. */
  finalMark: number | null;
}

export interface ExamRosterEntry42 extends ExamCadet42 {
  /** Raw 42 `projects_users` status, e.g. "in_progress" / "finished". */
  status: string;
}

interface AppToken {
  access_token: string;
  expires_at: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

@Injectable()
export class School42Service {
  private readonly logger = new Logger(School42Service.name);
  private readonly baseUrl = 'https://api.intra.42.fr/v2';
  private readonly campusId: number;
  private cachedToken: AppToken | null = null;

  /**
   * `syncExamMarkets` (every 15min) and `autoResolveExamMarkets` (every 10min)
   * both end up calling `fetchProjectUsers` for the same exam when their
   * schedules coincide (every 30min). A short TTL is enough to dedupe that
   * overlap without meaningfully delaying either job outside of it.
   */
  private readonly projectUsersCache = new Map<number, { data: ExamRosterEntry42[]; expiresAt: number }>();
  private static readonly PROJECT_USERS_CACHE_TTL_MS = 2 * 60 * 1000;

  /** Campus membership shifts on the scale of weeks (piscines/kickoffs), so a long TTL is safe. */
  private primaryCampusLoginsCache: { data: Set<string>; expiresAt: number } | null = null;
  private static readonly PRIMARY_CAMPUS_CACHE_TTL_MS = 20 * 60 * 1000;

  /**
   * 42's secondary "spam" limit is far tighter than its hourly quota — bursts
   * of concurrent calls (e.g. checking several candidates' campus at once)
   * get 429'd, and 42 then briefly 429s unrelated follow-up requests too.
   * Every outgoing call is funneled through `fetch42`, which serializes
   * dispatch to at most one request per `MIN_REQUEST_INTERVAL_MS` no matter
   * how many callers are in flight, and retries a 429 with backoff instead
   * of abandoning the exam/candidate until the next cron cycle.
   */
  private static readonly MIN_REQUEST_INTERVAL_MS = 600;
  private static readonly MAX_429_RETRIES = 4;
  private throttleChain: Promise<void> = Promise.resolve();
  private lastRequestAt = 0;

  constructor(private readonly configService: ConfigService) {
    // ConfigService reads env vars as strings regardless of the generic type
    // param — cast explicitly so numeric comparisons against 42 API payloads
    // (which return real numbers) don't silently fail.
    this.campusId = Number(this.configService.get<string>('_42SCHOOL_CAMPUS_ID', '68'));
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

  /** Serializes dispatch so concurrent callers still respect a single global minimum interval. */
  private async throttle(): Promise<void> {
    const next = this.throttleChain.then(async () => {
      const wait = this.lastRequestAt + School42Service.MIN_REQUEST_INTERVAL_MS - Date.now();
      if (wait > 0) {
        await sleep(wait);
      }
      this.lastRequestAt = Date.now();
    });
    this.throttleChain = next;
    await next;
  }

  /**
   * Rate-limited, retrying fetch used by every 42 API call. A 429 is retried
   * with backoff (honoring `Retry-After` when 42 sends it) instead of being
   * thrown straight away — callers only ever see a final, non-429 response
   * or the last 429 once retries are exhausted.
   */
  private async fetch42(path: string): Promise<Response> {
    for (let attempt = 0; ; attempt++) {
      await this.throttle();
      const token = await this.getAppToken();
      const res = await fetch(`${this.baseUrl}${path}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status !== 429 || attempt >= School42Service.MAX_429_RETRIES) {
        return res;
      }

      const retryAfterSeconds = Number(res.headers.get('retry-after'));
      const backoffMs = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
        ? retryAfterSeconds * 1000
        : 1000 * 2 ** attempt;
      this.logger.warn(
        `42 API rate limited on ${path}, retrying in ${backoffMs}ms (attempt ${attempt + 1}/${School42Service.MAX_429_RETRIES})`,
      );
      await sleep(backoffMs);
    }
  }

  private async get42<T>(path: string): Promise<T> {
    const res = await this.fetch42(path);

    if (!res.ok) {
      const err = await res.text();
      const error = new Error(`42 API error ${res.status} on ${path}: ${err}`) as Error & {
        status?: number;
      };
      error.status = res.status;
      throw error;
    }

    return res.json() as Promise<T>;
  }

  /**
   * Follows `page[number]` until every result is collected (per `X-Total`),
   * capped at `maxPages` as a safety net. `basePath` must not already carry
   * a `page[...]` param — this appends its own.
   */
  private async get42AllPages<T>(basePath: string, maxPages = 10): Promise<T[]> {
    const results: T[] = [];
    const separator = basePath.includes('?') ? '&' : '?';

    for (let page = 1; page <= maxPages; page++) {
      const res = await this.fetch42(`${basePath}${separator}page[number]=${page}&page[size]=100`);

      if (!res.ok) {
        const err = await res.text();
        const error = new Error(`42 API error ${res.status} on ${basePath}: ${err}`) as Error & {
          status?: number;
        };
        error.status = res.status;
        throw error;
      }

      const batch = (await res.json()) as T[];
      results.push(...batch);

      const total = Number(res.headers.get('x-total') ?? results.length);
      if (results.length >= total || batch.length === 0) break;
    }

    return results;
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

  /**
   * Exams scheduled at the campus within the next `days`, used to auto-generate
   * prediction markets. Defensive against the couple of key-naming variants
   * seen across 42 intra API deployments (campus_id vs campus_ids).
   *
   * `pastBufferDays` extends the lower bound backwards from "now" — a
   * `range[begin_at]` starting exactly at "now" excludes an exam that began
   * a few hours ago today but is still running (cadets `in_progress`,
   * corrections ongoing). Without this, a session found via the app's own
   * clock would silently vanish from sync the moment its `begin_at` ticks
   * into the past, even though registrants are still actively being graded.
   */
  async getUpcomingExams(days = 14, pastBufferDays = 2): Promise<Exam42[]> {
    try {
      const now = new Date();
      const from = new Date(now.getTime() - pastBufferDays * 24 * 60 * 60 * 1000);
      const until = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      const params = new URLSearchParams({
        'range[begin_at]': `${from.toISOString()},${until.toISOString()}`,
      });

      const exams = await this.get42AllPages<any>(
        `/campus/${this.campusId}/exams?${params.toString()}`,
      );

      return exams.filter((e) => e && e.id && e.begin_at).map((e) => this.mapExam(e));
    } catch (err) {
      this.logger.warn(`getUpcomingExams failed: ${err}`);
      return [];
    }
  }

  /** Single exam lookup, used when only the numeric id is on hand (e.g. resolving a stored market). */
  async getExam(examId: number): Promise<Exam42 | null> {
    try {
      const e = await this.get42<any>(`/exams/${examId}`);
      if (!e?.id) return null;
      return this.mapExam(e);
    } catch (err) {
      this.logger.warn(`getExam(${examId}) failed: ${err}`);
      return null;
    }
  }

  /**
   * `projects_users?filter[campus]=X` matches wherever the *attempt* took
   * place, not the cadet's home campus — network-wide staff/QA test accounts
   * (which hold a `campus_users` record at nearly every campus) slip through
   * that filter. This is the campus-primary membership list used to keep
   * markets covering only real 42 Luanda cadets.
   *
   * Fetched in bulk (`filter[primary_campus_id]`, a handful of paginated
   * requests for the whole campus) instead of one `/users/:login` call per
   * candidate — the per-candidate variant was the main source of 42's spam
   * rate limit kicking in, since it scaled linearly with exam registrations.
   *
   * `null` means "couldn't verify at all" (fresh fetch failed and nothing
   * cached) — callers must treat that as "do nothing" rather than as a
   * confirmed non-match; conflating "unverifiable" with "not a Luanda cadet"
   * would wrongly cancel real students' markets on a transient hiccup. On a
   * failed refresh with a previous list still in memory, the stale list is
   * returned instead: campus membership changes on the scale of weeks, so an
   * outdated list beats skipping the whole cycle.
   */
  async getPrimaryCampusLogins(): Promise<Set<string> | null> {
    const cached = this.primaryCampusLoginsCache;
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    try {
      const users = await this.get42AllPages<any>(
        `/users?filter[primary_campus_id]=${this.campusId}`,
        20,
      );
      const logins = new Set(users.map((u) => u?.login as string).filter(Boolean));

      // A campus always has students — an empty result means the filter
      // misbehaved, not that nobody studies here. Treating it as valid would
      // classify every candidate as "not a Luanda cadet" and cancel real
      // markets, so fall through to the stale/null path instead.
      if (logins.size === 0) {
        throw new Error('empty primary-campus list');
      }

      this.primaryCampusLoginsCache = {
        data: logins,
        expiresAt: Date.now() + School42Service.PRIMARY_CAMPUS_CACHE_TTL_MS,
      };
      return logins;
    } catch (err) {
      this.logger.warn(`getPrimaryCampusLogins failed: ${err}`);
      return cached ? cached.data : null;
    }
  }

  private mapExam(e: any): Exam42 {
    return {
      id: Number(e.id),
      name: e.name ?? `Exam ${e.id}`,
      beginAt: e.begin_at,
      endAt: e.end_at ?? e.begin_at,
      location: e.location ?? null,
      projectId: e.projects?.[0]?.id != null ? Number(e.projects[0].id) : null,
    };
  }

  /**
   * Grades for everyone with a `projects_users` record on the exam's linked
   * project, regardless of status — used to resolve markets once 42 marks a
   * cadet's attempt.
   *
   * `exams_users` (the direct exam-subscriber list) requires an
   * elevated/staff-scoped app token that this app doesn't have (403 for
   * plain client_credentials). Every 42 exam is graded through a linked
   * project of the same name (e.g. "Exam Rank 06" -> project "Exam Rank 06"),
   * and `projects_users` for that project *is* reachable with a normal app
   * token when filtered by campus. `finalMark` is `null` until 42 publishes
   * the grade; callers should treat that as "not graded yet", not "failed".
   */
  async getExamGrades(exam: Exam42): Promise<ExamCadet42[]> {
    const entries = await this.fetchProjectUsers(exam);
    return entries.map(({ status, ...c }) => c);
  }

  /**
   * Full roster (any status) with status kept, so callers can tell "gone
   * entirely" (deregistered) apart from "finished" (should resolve, not
   * cancel) — `getExamCadets`/`getExamGrades` alone can't distinguish those.
   */
  async getExamRoster(exam: Exam42): Promise<ExamRosterEntry42[]> {
    return this.fetchProjectUsers(exam);
  }

  /**
   * Deliberately does NOT swallow fetch errors into `[]` — an empty roster
   * here is indistinguishable from "everyone deregistered" to callers doing
   * deregistration cleanup, and a transient failure returned as `[]` would
   * make `syncExamMarkets` cancel every legitimate market for the exam. Let
   * it throw; the per-exam try/catch in the caller skips that exam for this
   * cycle instead.
   */
  private async fetchProjectUsers(exam: Exam42): Promise<ExamRosterEntry42[]> {
    const cached = this.projectUsersCache.get(exam.id);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const projectId = exam.projectId;
    if (projectId == null) {
      this.logger.warn(`fetchProjectUsers(${exam.id}): exam has no linked project, skipping`);
      return [];
    }

    const params = new URLSearchParams({ 'filter[campus]': String(this.campusId) });
    const projectsUsers = await this.get42AllPages<any>(
      `/projects/${projectId}/projects_users?${params.toString()}`,
    );

    const entries = projectsUsers
      .map((pu) => {
        const u = pu.user;
        if (!u?.login) return null;
        return {
          login: u.login,
          name: u.usual_full_name ?? u.displayname ?? u.login,
          avatar: this.extractAvatar(u.image),
          finalMark: pu.final_mark != null ? Number(pu.final_mark) : null,
          status: pu.status as string,
        };
      })
      .filter((c): c is ExamCadet42 & { status: string } => c !== null);

    this.projectUsersCache.set(exam.id, {
      data: entries,
      expiresAt: Date.now() + School42Service.PROJECT_USERS_CACHE_TTL_MS,
    });
    return entries;
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
