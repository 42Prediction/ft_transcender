import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

jest.mock('../user/user.service', () => ({
  UserService: class UserService { },
}));

jest.mock('../bettor/bettor.service', () => ({
  BettorService: class BettorService { },
}));

import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { BettorService } from '../bettor/bettor.service';
import { User } from '../user/entities/user.entity';
import { URLSearchParams } from 'url';
import { Profile42Dto } from '../bettor/dto/profile-42.dto';

describe('AuthService', () => {
  let service: AuthService;

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockUserService = {
    findOneByEmail: jest.fn(),
    createOauthUser: jest.fn(),
  };

  const mockBettorService = {
    create: jest.fn(),
  };

  const mockConfigService = {
    getOrThrow: jest.fn(),
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
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
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('googleLogin', () => {
    it('should throw NotFoundException when userGoogle is missing', async () => {
      await expect(service.googleLogin(null)).rejects.toThrow(NotFoundException);
    });

    it('should sign a JWT for an existing Google user without creating a new one', async () => {
      const existingUser = {
        id: 'user-1',
        email: 'google@test.com',
        role: 'USER',
      } as unknown as User;

      mockUserService.findOneByEmail.mockResolvedValue(existingUser);
      mockJwtService.sign.mockReturnValue('signed-token');

      const result = await service.googleLogin({ email: 'google@test.com' });

      expect(mockUserService.findOneByEmail).toHaveBeenCalledWith('google@test.com');
      expect(mockUserService.createOauthUser).not.toHaveBeenCalled();
      expect(mockBettorService.create).not.toHaveBeenCalled();
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'google@test.com',
        role: 'USER',
      });
      expect(result).toEqual({
        access_token: 'signed-token',
        result: {
          id: 'user-1',
          email: 'google@test.com',
          role: 'USER',
        },
      });
    });

    it('should create oauth user and bettor when the email does not exist', async () => {
      const createdUser = {
        id: 'oauth-user-1',
        email: 'new-google@test.com',
        role: 'USER',
      } as unknown as User;

      mockUserService.findOneByEmail.mockResolvedValue(null);
      mockUserService.createOauthUser.mockResolvedValue(createdUser);
      mockBettorService.create.mockResolvedValue({});
      mockJwtService.sign.mockReturnValue('new-signed-token');

      const result = await service.googleLogin({ email: 'new-google@test.com' });

      expect(mockUserService.findOneByEmail).toHaveBeenCalledWith('new-google@test.com');
      expect(mockUserService.createOauthUser).toHaveBeenCalledWith({
        email: 'new-google@test.com',
      });
      expect(mockBettorService.create).toHaveBeenCalledWith(createdUser);
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 'oauth-user-1',
        email: 'new-google@test.com',
        role: 'USER',
      });
      expect(result).toEqual({
        access_token: 'new-signed-token',
        result: {
          id: 'oauth-user-1',
          email: 'new-google@test.com',
          role: 'USER',
        },
      });
    });
  });

  describe('_42SchoolLogin', () => {
    it('should throw BadRequestException when code is missing', async () => {
      await expect(service._42SchoolLogin('')).rejects.toThrow(BadRequestException);
    });
  });
});






describe('AuthService_2', () => {
  const mockFetch = jest.fn();
  global.fetch = mockFetch;

  const makeUser = (overrides = {}) => ({
    id: 'user-uuid-1',
    email: 'student@42luanda.com',
    role: 'user',
    ...overrides,
  });

  const mockConfigService = {
    getOrThrow: jest.fn((key: string) => {
      const map: Record<string, string> = {
        _42SCHOOL_API_URL_TOKEN: 'https://api.intra.42.fr/oauth/token',
        _42SCHOOL_CLIENT_ID: 'fake-client-id',
        _42SCHOOL_CLIENT_SECRET: 'fake-client-secret',
        _42SCHOOL_CALLBACK_URL: 'http://localhost:3000/auth/42luanda/callback',
        _42SCHOOL_API_URL_OAUTH_PROFILE: 'https://api.intra.42.fr/v2/me',
      };
      if (!map[key])
        throw new Error(`Missing config key: ${key}`);
      return map[key];
    }),
    get: jest.fn((key: string) => undefined),
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

  describe('AuthService_2 - 42school OAuth', () => {
    let service: AuthService;

    beforeEach(async () => {
      jest.clearAllMocks();
      mockFetch.mockReset();

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AuthService,
          { provide: ConfigService, useValue: mockConfigService },
          { provide: UserService, useValue: mockUserService },
          { provide: BettorService, useValue: mockBettorService },
          { provide: JwtService, useValue: mockJwtService }
        ],
      }).compile();
      service = module.get<AuthService>(AuthService);
    });


    describe('_42SchoolLogin', () => {
      it('throws BadRequestException when code is missing', async () => {
        await expect(service._42SchoolLogin('')).rejects.toThrow(
          new BadRequestException('Missing code from 42 callback')
        );
        expect(mockFetch).not.toHaveBeenCalled();
      });

      it('throws BadRequestException when the token endpoint returns an error', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          text: async () => 'invalid_grant'
        });
        await expect(service._42SchoolLogin('bad-code')).rejects.toThrow(
          BadRequestException
        );
      });

      it('returns an access_token for an existing user', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: '42-access-token' }),
        });
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ login: 'guiguito', email: 'student@42luanda.com', campus: [{ name: '42Luanda' }] }),
        });

        mockUserService.findOneByEmail.mockResolvedValue(makeUser());

        const result = await service._42SchoolLogin('valid-code');
        expect(result).toEqual({
          access_token: 'signed-jwt-token',
          user: {
            id: 'user-uuid-1',
            email: 'student@42luanda.com',
            role: 'user',
            isTwoFactorEnabled: undefined,
          },
        });
        expect(mockUserService.createOauthUser).not.toHaveBeenCalled();
        expect(mockBettorService.create).not.toHaveBeenCalled();
      });

      it('creates a new user and bettor when user does not exist', async () => {
        const newUser = makeUser({ id: 'new-uuid', email: 'new@42luanda.com' });
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: '42-access-token' })
        });
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ login: 'newbie', email: 'new@42luanda.com', campus: [{ name: '42Luanda' }] })
        });
        mockUserService.findOneByEmail.mockResolvedValue(null);
        mockUserService.createOauthUser.mockResolvedValue(newUser);
        mockBettorService.create.mockResolvedValue({});

        const result = await service._42SchoolLogin('valid-code');

        expect(mockUserService.createOauthUser).toHaveBeenCalledWith({
          email: 'new@42luanda.com'
        });
        expect(mockBettorService.create).toHaveBeenCalledWith(newUser, {
          campus: '42Luanda',
          school42Login: 'newbie',
          level: 0
        });
        expect(result).toEqual({
          access_token: 'signed-jwt-token',
          user: {
            id: 'new-uuid',
            email: 'new@42luanda.com',
            role: 'user',
            isTwoFactorEnabled: undefined,
          },
        });
      });

      it('call token endpoint with the correct body', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: '42-access-token' })
        });
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ login: 'wilili', email: 'student@42luanda.com', campus: [{ name: '42Luanda' }] }),
        });
        mockUserService.findOneByEmail.mockResolvedValue(makeUser());

        await service._42SchoolLogin('my-code');

        const [url, options] = mockFetch.mock.calls[0];
        expect(url).toBe('https://api.intra.42.fr/oauth/token');
        expect(options.method).toBe('POST');

        const body = new URLSearchParams(options.body);
        expect(body.get('grant_type')).toBe('authorization_code');
        expect(body.get('client_id')).toBe('fake-client-id');
        expect(body.get('client_secret')).toBe('fake-client-secret');
        expect(body.get('code')).toBe('my-code');
        expect(body.get('redirect_uri')).toBe(
          'http://localhost:3000/auth/42luanda/callback',
        );
      });
    });

    describe('profileOauth42School', () => {
      it('returns name and email from the profile endpoint', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ login: 'jdoe', email: 'jdoe@42luanda.com', campus: [{ name: '42Luanda' }] }),
        });


        const profile = await (service as any).profileOauth42School('some-token');

        expect(profile).toEqual({ name: 'jdoe', email: 'jdoe@42luanda.com', campus: '42Luanda', level: 0 });
        expect(mockFetch).toHaveBeenCalledWith(
          'https://api.intra.42.fr/v2/me',
          expect.objectContaining({
            headers: { Authorization: 'Bearer some-token' },
          }),
        );
      });

      it("throws BadRequestException when profile endpoint fails", async () => {
        mockFetch.mockResolvedValueOnce({ ok: false });

        await expect(
          (service as any).profileOauth42School('bad-token'),
        ).rejects.toThrow(new BadRequestException("Can't get user profile of API"));
      });
    });



    describe('generateToken (indirect)', () => {
      it('signs the JWT with correct payload for existing user', async () => {
        const user = makeUser({ id: 'uid-99', role: 'admin' });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: '42-tok' }),
        });
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ login: 'admin', email: 'student@42luanda.com', campus: [{ name: '42Luanda' }] }),
        });
        mockUserService.findOneByEmail.mockResolvedValue(user);

        await service._42SchoolLogin('code-x');

        expect(mockJwtService.sign).toHaveBeenCalledWith({
          sub: 'uid-99',
          email: 'student@42luanda.com',
          role: 'admin',
        });
      });

    });

  });

});