import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpStatus } from '@nestjs/common';

jest.mock('../user/user.service', () => ({
  UserService: class UserService {},
}));

jest.mock('../bettor/bettor.service', () => ({
  BettorService: class BettorService {},
}));


jest.mock('./two-factor.service', () => ({
  TwoFactorService: class TwoFactorService {},
}));

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TwoFactorService } from './two-factor.service';
import { UserService } from '../user/user.service';
import { Response } from 'express';



const makeMockAuthService = () => ({
  signin: jest.fn(),
  signup: jest.fn(),
  googleLogin: jest.fn(),
  _42SchoolLogin: jest.fn(),
  generateTempToken: jest.fn(),
  verifyTempToken: jest.fn(),
  login: jest.fn(),
});

const makeMockConfigService = () => ({
  get: jest.fn(),
  getOrThrow: jest.fn(),
});

const makeMockTwoFactorService = () => ({
  generateSecret: jest.fn(),
  generateOtpAuthUrl: jest.fn(),
  generateQrCodeDataUrl: jest.fn(),
  verifyToken: jest.fn(),
});

const makeMockUserService = () => ({
  findOne: jest.fn(),
  setTwoFactorSecret: jest.fn(),
  enableTwoFactor: jest.fn(),
  disableTwoFactor: jest.fn(),
});



const makeRes = (): jest.Mocked<Partial<Response>> => ({
  cookie: jest.fn(),
  clearCookie: jest.fn(),
  redirect: jest.fn(),
});



describe('AuthController – Google OAuth', () => {
  let controller: AuthController;
  let mockAuthService: ReturnType<typeof makeMockAuthService>;
  let mockConfigService: ReturnType<typeof makeMockConfigService>;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockAuthService = makeMockAuthService();
    mockConfigService = makeMockConfigService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: TwoFactorService, useValue: makeMockTwoFactorService() },
        { provide: UserService, useValue: makeMockUserService() },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('googleAuth', () => {
    it('resolves with no body because the guard owns the redirect flow', async () => {
      const req = {};
      await expect(controller.googleAuth(req)).resolves.toBeUndefined();
      expect(mockAuthService.googleLogin).not.toHaveBeenCalled();
    });
  });

  describe('googleAuthCallBack', () => {
    it('sets the auth cookie and redirects to the frontend URL', async () => {
      mockAuthService.googleLogin.mockResolvedValue({
        access_token: 'jwt-token',
        result: { isTwoFactorEnabled: false },
      });
      mockConfigService.get.mockReturnValue('https://frontend.test');

      const req = { user: { email: 'google@test.com' } };
      const res = makeRes();

      await controller.googleAuthCallBack(req, res as Response);

      expect(mockAuthService.googleLogin).toHaveBeenCalledWith(req.user);
      expect(res.cookie).toHaveBeenCalledWith(
        expect.any(String),
        'jwt-token',
        expect.any(Object),
      );
      expect(res.redirect).toHaveBeenCalledWith('https://frontend.test');
    });

    it('sets temp 2FA cookie and redirects to the verify-2fa page when 2FA is enabled', async () => {
      mockAuthService.googleLogin.mockResolvedValue({
        access_token: 'jwt-token',
        result: { id: 'u1', isTwoFactorEnabled: true },
      });
      mockAuthService.generateTempToken.mockResolvedValue('temp-tok');
      mockConfigService.get.mockReturnValue('https://frontend.test');

      const req = { user: { email: 'google@test.com' } };
      const res = makeRes();

      await controller.googleAuthCallBack(req, res as Response);

      expect(res.cookie).toHaveBeenCalledWith('temp_2fa_token', 'temp-tok', expect.any(Object));
      expect(res.redirect).toHaveBeenCalledWith('https://frontend.test/verify-2fa');
    });
  });
});



describe('AuthController – 42 School OAuth', () => {
  let controller: AuthController;
  let mockAuthService: ReturnType<typeof makeMockAuthService>;

  const mockConfigService = {
    getOrThrow: jest.fn((key: string) => {
      const map: Record<string, string> = {
        _42SCHOOL_API_URL_AUTHORIRIZE: 'https://api.intra.42.fr/oauth/authorize',
        _42SCHOOL_CLIENT_ID: 'fake-client-id',
        _42SCHOOL_CALLBACK_URL: 'http://localhost:3000/auth/42luanda/callback',
      };
      if (!map[key]) throw new Error(`Missing config key: ${key}`);
      return map[key];
    }),
    get: jest.fn((key: string) => {
      const map: Record<string, string> = { FRONTEND_URL: 'http://localhost:5173' };
      return map[key];
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockAuthService = makeMockAuthService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: TwoFactorService, useValue: makeMockTwoFactorService() },
        { provide: UserService, useValue: makeMockUserService() },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('GET /auth/school', () => {
    it('redirects to the 42 authorization URL with correct query params', () => {
      const res = makeRes();
      controller._42schoolAuth(res as Response);

      expect(res.redirect).toHaveBeenCalledTimes(1);
      const [statusCode, redirectUrl] = (res.redirect as jest.Mock).mock.calls[0];
      expect(statusCode).toBe(302);

      const parsed = new URL(redirectUrl);
      expect(parsed.origin + parsed.pathname).toBe('https://api.intra.42.fr/oauth/authorize');
      expect(parsed.searchParams.get('client_id')).toBe('fake-client-id');
      expect(parsed.searchParams.get('redirect_uri')).toBe(
        'http://localhost:3000/auth/42luanda/callback',
      );
      expect(parsed.searchParams.get('scope')).toBe('public');
      expect(parsed.searchParams.get('response_type')).toBe('code');
      expect(parsed.searchParams.get('state')).toBe('xyz');
    });
  });

  describe('GET /auth/42luanda/callback', () => {
    it('exchanges code for token, sets cookie and redirects to frontend', async () => {
      mockAuthService._42SchoolLogin.mockResolvedValue({
        access_token: 'signed-jwt-token',
        user: { isTwoFactorEnabled: false },
      });

      const req = { query: { code: 'auth-code-abc' } };
      const res = makeRes();

      await controller._42schoolAuthCallBack(req, res as Response);

      expect(mockAuthService._42SchoolLogin).toHaveBeenCalledWith('auth-code-abc');
      expect(res.redirect).toHaveBeenCalledWith('http://localhost:5173');
    });

    it('sets the auth cookie with the JWT before redirecting', async () => {
      mockAuthService._42SchoolLogin.mockResolvedValue({
        access_token: 'my-jwt',
        user: { isTwoFactorEnabled: false },
      });

      const req = { query: { code: 'some-code' } };
      const res = makeRes();

      await controller._42schoolAuthCallBack(req, res as Response);

      expect(res.cookie).toHaveBeenCalledWith(
        expect.any(String),
        'my-jwt',
        expect.any(Object),
      );
    });

    it('sets temp 2FA cookie and redirects to the verify-2fa page when 2FA is enabled', async () => {
      mockAuthService._42SchoolLogin.mockResolvedValue({
        access_token: 'my-jwt',
        user: { id: 'u1', isTwoFactorEnabled: true },
      });
      mockAuthService.generateTempToken.mockResolvedValue('temp-tok');

      const req = { query: { code: 'some-code' } };
      const res = makeRes();

      await controller._42schoolAuthCallBack(req, res as Response);

      expect(res.cookie).toHaveBeenCalledWith('temp_2fa_token', 'temp-tok', expect.any(Object));
      expect(res.redirect).toHaveBeenCalledWith('http://localhost:5173/verify-2fa');
    });

    it('returns errorResponse structure when AuthService throws', async () => {
      const fakeError = new Error('token exchange failed');
      mockAuthService._42SchoolLogin.mockRejectedValue(fakeError);

      const req = { query: { code: 'bad-code' } };
      const res = makeRes();

      const result = await controller._42schoolAuthCallBack(req, res as Response);

      expect(result).toEqual({
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        data: null,
        error: fakeError,
      });
    });
  });
});



describe('AuthController – signin / signup / signout', () => {
  let controller: AuthController;
  let mockAuthService: ReturnType<typeof makeMockAuthService>;
  let mockConfigService: ReturnType<typeof makeMockConfigService>;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockAuthService = makeMockAuthService();
    mockConfigService = makeMockConfigService();
    mockConfigService.get.mockReturnValue('development'); // NODE_ENV

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: TwoFactorService, useValue: makeMockTwoFactorService() },
        { provide: UserService, useValue: makeMockUserService() },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('POST /auth/signin', () => {
    it('sets cookie and returns success when 2FA is disabled', async () => {
      mockAuthService.signin.mockResolvedValue({
        access_token: 'tok',
        user: { isTwoFactorEnabled: false },
      });

      const res = makeRes();
      const result = await controller.signin(
        { email: 'a@b.com', password: 'pass' } as any,
        res as Response,
      );

      expect(res.cookie).toHaveBeenCalledWith('access_token', 'tok', expect.any(Object));
      expect(result).toMatchObject({ statusCode: HttpStatus.OK });
    });

    it('sets temp 2FA cookie and returns 2FA-required message when 2FA is enabled', async () => {
      mockAuthService.signin.mockResolvedValue({
        access_token: 'tok',
        user: { isTwoFactorEnabled: true },
      });
      mockAuthService.generateTempToken.mockResolvedValue('temp-tok');

      const res = makeRes();
      const result = await controller.signin(
        { email: 'a@b.com', password: 'pass' } as any,
        res as Response,
      );

      expect(res.cookie).toHaveBeenCalledWith('temp_2fa_token', 'temp-tok', expect.any(Object));
      expect(result).toEqual({
        success: true,
        statusCode: HttpStatus.OK,
        data: { twoFactorRequired: true, message: '2FA required' },
        error: null,
      });
    });
  });

  describe('POST /auth/signup', () => {
    it('returns CREATED response on success', async () => {
      mockAuthService.signup.mockResolvedValue({ id: '1', email: 'a@b.com' });

      const result = await controller.signup({ email: 'a@b.com', password: 'pass' } as any);

      expect(result).toMatchObject({ statusCode: HttpStatus.CREATED });
    });
  });

  describe('POST /auth/signout', () => {
    it('clears the access_token cookie', async () => {
      const res = makeRes();
      await controller.signout(res as Response);
      expect(res.clearCookie).toHaveBeenCalledWith('access_token', { path: '/' });
    });
  });
});