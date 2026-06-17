import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

jest.mock('../user/user.service', () => ({
  UserService: class UserService {},
}));

jest.mock('../bettor/bettor.service', () => ({
  BettorService: class BettorService {},
}));

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { access } from 'fs';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    signin: jest.fn(),
    signup: jest.fn(),
    googleLogin: jest.fn(),
    _42SchoolLogin: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
    getOrThrow: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
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
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('googleAuth', () => {
    it('should resolve with no body because the guard owns the redirect flow', async () => {
      await expect(controller.googleAuth()).resolves.toBeUndefined();
      expect(mockAuthService.googleLogin).not.toHaveBeenCalled();
    });
  });

  describe('googleAuthCallBack', () => {
    it('should set the auth cookie and redirect to the frontend callback', async () => {
      mockAuthService.googleLogin.mockResolvedValue({ access_token: 'jwt-token' });
      mockConfigService.get.mockReturnValue('https://frontend.test');

      const req = { user: { email: 'google@test.com' } };
      const res = {
        cookie: jest.fn(),
        redirect: jest.fn(),
      } as any;

      await controller.googleAuthCallBack(req, res);

      expect(mockAuthService.googleLogin).toHaveBeenCalledWith(req.user);
      expect(res.cookie).toHaveBeenCalledWith(
        expect.any(String),
        'jwt-token',
        expect.any(Object),
      );
      expect(res.redirect).toHaveBeenCalledWith('https://frontend.test');
    });
  });

});




describe('AuthController_2', () => {


  const mockConfigService = {
    getOrThrow: jest.fn((key: string) => {
      const map: Record<string, string> = {
        _42SCHOOL_API_URL_AUTHORIRIZE: 'https://api.intra.42.fr/oauth/authorize',
      _42SCHOOL_CLIENT_ID: 'fake-client-id',
      _42SCHOOL_CALLBACK_URL: 'http://localhost:3000/auth/42luanda/callback',
      };

      if (!map[key])
          throw new Error(`Missing config key: ${key}`);
      return map[key];
    }),

    get: jest.fn((key:string) => {
      const map: Record<string, string> = {
        FRONTEND_URL: 'http://localhost:5173',
      };
      return map[key];
    }),
  };


  const mockAuthService = {
     _42SchoolLogin: jest.fn(),
  };

  const makeRes = (): jest.Mocked<Partial<Response>> => ({
    redirect: jest.fn(),
    cookie:jest.fn(),
  });

  describe('AuthController_2 - 42 OAUTH', () => {
    let controller: AuthController;

    beforeEach(async() => {
      jest.clearAllMocks();
      const module: TestingModule = await Test.createTestingModule({
        controllers: [AuthController],
        providers: [
          {provide: AuthService, useValue: mockAuthService},
          {provide: ConfigService, useValue: mockConfigService}
        ],
      }).compile();
      controller = module.get<AuthController>(AuthController);
    });


  describe('GET /auth/school', ()=>{
    it('redirect to the 42 authorization URL with correct params', () => {
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
    it('exchanges code for token, sets cookie and redirects to frontend', async () =>{
      mockAuthService._42SchoolLogin.mockResolvedValue({
        access_token: 'signed-jwt-token',
      });
      const req = {query: {code: 'auth-code-abc'}};
      const res = makeRes();
      await controller._42schoolAuthCallBack(req, res as Response);
      expect(mockAuthService._42SchoolLogin).toHaveBeenCalledWith('auth-code-abc');
        expect(res.redirect).toHaveBeenCalledWith('http://localhost:5173/auth/callback');
    });
    it('sets the auth cookie with the JWT before redirecting', async ()=>{
      mockAuthService._42SchoolLogin.mockResolvedValue({
        access_token: 'my-jwt'
      });
      const req = {query:{ code: 'some-code'}};
      const res = makeRes();
      await controller._42schoolAuthCallBack(req, res as Response);
      expect(res.cookie).toHaveBeenCalledWith(
        expect.any(String),
        'my-jwt',
        expect.any(Object),
      );
    });

    it('propagates errors thrown by AuthService', async ()=>{
      mockAuthService._42SchoolLogin.mockRejectedValue(
        new Error('token exchange failed'),
      );
      const req = {query: {code: 'bad-code'}};
      const res = makeRes();
      await expect(
        controller._42schoolAuthCallBack(req, res as Response),
      ).rejects.toThrow('token exchange failed');
    });
  });

  });

});

