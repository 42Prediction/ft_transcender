import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ExecutionContext, UnauthorizedException, ValidationPipe, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { AuthController } from '../src/modules/auth/auth.controller';
import { AuthService } from '../src/modules/auth/auth.service';
import { ConfigService } from '@nestjs/config';
import { GoogleAuthGuard } from '../src/modules/auth/guards/google-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { BettorService } from '../src/modules/bettor/bettor.service';
import { UserService } from '../src/modules/user/user.service';
import { HttpException } from '@nestjs/common';

describe('AuthController (E2E)', () => {
  let app: INestApplication;

  let currentGoogleUser: { email: string } | null = { email: 'google@test.com' };

  const mockAuthService = {
    googleLogin: jest.fn(),
    _42SchoolLogin: jest.fn(),
    signin: jest.fn(),
    signup: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
    getOrThrow: jest.fn(),
  };

  class MockGoogleAuthGuard {
    canActivate(context: ExecutionContext): boolean {
      if (!currentGoogleUser) {
        throw new UnauthorizedException();
      }

      const req = context.switchToHttp().getRequest();
      req.user = currentGoogleUser;
      return true;
    }
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    })
      .overrideGuard(GoogleAuthGuard)
      .useClass(MockGoogleAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    currentGoogleUser = { email: 'google@test.com' };
    mockConfigService.get.mockReturnValue('https://frontend.test');
    mockAuthService.googleLogin.mockResolvedValue({ access_token: 'jwt-token' });
  });

  describe('Security Boundaries (Guard Validation)', () => {
    it('should return 401 Unauthorized if the Google guard does not authenticate a user', async () => {
      currentGoogleUser = null;

      await request(app.getHttpServer())
        .get('/auth/google/callback')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('Google OAuth Endpoints', () => {
    it('GET /auth/google -> should resolve through the Google guard without calling the service', async () => {
      await request(app.getHttpServer())
        .get('/auth/google')
        .expect(HttpStatus.OK);

      expect(mockAuthService.googleLogin).not.toHaveBeenCalled();
    });

    it('GET /auth/google/callback -> should set auth cookie and redirect to the frontend callback', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/google/callback')
        .expect(HttpStatus.FOUND); // 302

      expect(mockAuthService.googleLogin).toHaveBeenCalledWith({ email: 'google@test.com' });
      expect(response.headers['set-cookie']).toEqual(
        expect.arrayContaining([
          expect.stringContaining('access_token=jwt-token'),
        ]),
      );
      expect(response.headers.location).toBe('https://frontend.test');
    });
  });
});


const mockFetch = jest.fn();
global.fetch = mockFetch;

function make42TokenResponse(accessToken = '42-access-token') {
  return {
    ok: true,
    json: async () => ({ access_token: accessToken })
  };
}

function make42ProfileResponse(login = 'will', email = 'will@42luanda.com', campus = 'Luanda') {
  return {
    ok: true,
    json: async () => ({ login, email, campus: [{ name: campus }] })
  };
}

describe('Auth - 42School OAuth', () => {
  let app: INestApplication;
  const mockConfigService = {
    getOrThrow: jest.fn((key: string) => {
      const map: Record<string, string> = {
        _42SCHOOL_API_URL_AUTHORIRIZE:
          'https://api.intra.42.fr/oauth/authorize',
        _42SCHOOL_CLIENT_ID: 'e2e-client-id',
        _42SCHOOL_CLIENT_SECRET: 'e2e-client-secret',
        _42SCHOOL_CALLBACK_URL:
          'http://localhost:3000/auth/42luanda/callback',
        _42SCHOOL_API_URL_TOKEN: 'https://api.intra.42.fr/oauth/token',
        _42SCHOOL_API_URL_OAUTH_PROFILE: 'https://api.intra.42.fr/v2/me',
      };
      if (!map[key])
        throw new Error(`Missing E2E config key: ${key}`);
      return map[key];
    }),
    get: jest.fn((key: string) => {
      const map: Record<string, string> = {
        FRONTEND_URL: 'http://localhost:5173',
      };
      return map[key];
    }),
  };

  const mockUserService = {
    findOneByEmail: jest.fn(),
    createOauthUser: jest.fn(),
  };

  const mockBettorService = {
    create: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(() => 'signed-jwt-token'),
  };

  class MockGoogleAuthGuard {
    canActivate(): boolean {
      return true;
    }
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: BettorService,
          useValue: mockBettorService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    })
      .overrideProvider(ConfigService)
      .useValue(mockConfigService)
      .overrideGuard(GoogleAuthGuard)
      .useClass(MockGoogleAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
    mockUserService.findOneByEmail.mockResolvedValue({
      id: 'user-uuid-1',
      email: 'student@42luanda.com',
      role: 'user',
    });
    mockBettorService.create.mockResolvedValue({});
  });

  describe('GET /auth/school', () => {
    it('returns 302 and redirects to 42 authorization URL', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/school')
        .expect(HttpStatus.FOUND);

      const location = res.headers['location'];
      expect(location).toBeDefined();

      const parsed = new URL(location);
      expect(parsed.origin + parsed.pathname).toBe(
        'https://api.intra.42.fr/oauth/authorize',
      );
      expect(parsed.searchParams.get('client_id')).toBe('e2e-client-id');
      expect(parsed.searchParams.get('response_type')).toBe('code');
      expect(parsed.searchParams.get('scope')).toBe('public');
      expect(parsed.searchParams.get('state')).toBe('xyz');
    });

    it('redirect URL contains the correct redirect_uri', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/school')
        .expect(HttpStatus.FOUND);

      const location = new URL(res.headers['location']);
      expect(location.searchParams.get('redirect_uri')).toBe(
        'http://localhost:3000/auth/42luanda/callback',
      );
    });
  });


  describe('GET /auth/42luanda/callback', () => {
    let authServiceInstance: AuthService;

    beforeEach(() => {
      authServiceInstance = app.get<AuthService>(AuthService);
    });

    it('returns 302 to frontend after successful OAuth exchange', async () => {
      mockFetch
        .mockResolvedValueOnce(make42TokenResponse())
        .mockResolvedValueOnce(make42ProfileResponse());

      const res = await request(app.getHttpServer())
        .get('/auth/42luanda/callback')
        .query({ code: 'valid-code' })
        .expect(HttpStatus.FOUND);

      expect(res.headers['location']).toContain(
        'http://localhost:5173',
      );
    });

    it('sets an auth cookie in the response', async () => {
      mockFetch
        .mockResolvedValueOnce(make42TokenResponse())
        .mockResolvedValueOnce(make42ProfileResponse());

      const res = await request(app.getHttpServer())
        .get('/auth/42luanda/callback')
        .query({ code: 'valid-code' })
        .expect(HttpStatus.FOUND);

      const raw = res.headers['set-cookie'] as string | string[] | undefined;
      const cookies: string[] = Array.isArray(raw) ? raw : raw ? [raw] : [];
      const hasAuthCookie = cookies.some(
        (c) => c.includes('access_token=')
      );
      expect(hasAuthCookie).toBe(true);
    });

    it('calls the 42 token endpoint with correct parameters', async () => {
      mockFetch
        .mockResolvedValueOnce(make42TokenResponse())
        .mockResolvedValueOnce(make42ProfileResponse());

      await request(app.getHttpServer())
        .get('/auth/42luanda/callback')
        .query({ code: 'test-code-123' })
        .expect(HttpStatus.FOUND);

      const [tokenUrl, tokenOptions] = mockFetch.mock.calls[0];
      expect(tokenUrl).toBe('https://api.intra.42.fr/oauth/token');
      expect(tokenOptions.method).toBe('POST');

      const body = new URLSearchParams(tokenOptions.body);
      expect(body.get('code')).toBe('test-code-123');
      expect(body.get('grant_type')).toBe('authorization_code');
      expect(body.get('client_id')).toBe('e2e-client-id');
    });

    it('calls the 42 profile endpoint with the bearer token', async () => {
      mockFetch
        .mockResolvedValueOnce(make42TokenResponse('tok-xyz'))
        .mockResolvedValueOnce(make42ProfileResponse());

      await request(app.getHttpServer())
        .get('/auth/42luanda/callback')
        .query({ code: 'some-code' })
        .expect(HttpStatus.FOUND);

      const [profileUrl, profileOptions] = mockFetch.mock.calls[1];
      expect(profileUrl).toBe('https://api.intra.42.fr/v2/me');
      expect(profileOptions.headers['Authorization']).toBe('Bearer tok-xyz');
    });

    it('returns 200 (com wrapper de erro) quando o code está ausente', async () => {
      jest.spyOn(authServiceInstance, '_42SchoolLogin').mockRejectedValueOnce(
        new HttpException('Code is absent', HttpStatus.BAD_REQUEST)
      );

      const res = await request(app.getHttpServer())
        .get('/auth/42luanda/callback')
        .expect(HttpStatus.OK);

      expect(res.body.success).toBe(false);
      expect(res.body.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(res.body.error.message).toBe('Code is absent');
    });

    it('returns 200 (com wrapper de erro) quando o endpoint de token rejeita o code', async () => {
      jest.spyOn(authServiceInstance, '_42SchoolLogin').mockRejectedValueOnce(
        new HttpException('invalid_grant', HttpStatus.BAD_REQUEST)
      );

      const res = await request(app.getHttpServer())
        .get('/auth/42luanda/callback')
        .query({ code: 'expired-code' })
        .expect(HttpStatus.OK);

      expect(res.body.success).toBe(false);
      expect(res.body.statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it('returns 200 (com wrapper de erro 500) quando o profile falha e lança erro genérico', async () => {
      mockFetch
        .mockResolvedValueOnce(make42TokenResponse())
        .mockResolvedValueOnce({ ok: false, json: async () => ({}) });

      const res = await request(app.getHttpServer())
        .get('/auth/42luanda/callback')
        .query({ code: 'valid-code' })
        .expect(HttpStatus.OK);

      expect(res.body.success).toBe(false);
      expect(res.body.statusCode).toBe(HttpStatus.BAD_REQUEST);
    });
  });
});