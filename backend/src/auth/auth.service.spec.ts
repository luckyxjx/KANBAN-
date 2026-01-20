import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService, GoogleUser, User } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateGoogleUser', () => {
    it('should create and return a new user for first-time Google login', async () => {
      const googleUser: GoogleUser = {
        id: 'google123',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/avatar.jpg',
      };

      const result = await service.validateGoogleUser(googleUser);

      expect(result).toMatchObject({
        email: googleUser.email,
        name: googleUser.name,
        avatarUrl: googleUser.picture,
      });
      expect(result.id).toBeDefined();
    });

    it('should return existing user for returning Google login', async () => {
      const googleUser: GoogleUser = {
        id: 'google123',
        email: 'test@example.com',
        name: 'Test User',
      };

      const firstResult = await service.validateGoogleUser(googleUser);
      const secondResult = await service.validateGoogleUser(googleUser);

      expect(firstResult.id).toBe(secondResult.id);
    });
  });

  describe('generateJWT', () => {
    it('should generate JWT token with correct payload and expiration', async () => {
      const user: User = {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
      };

      mockJwtService.sign.mockReturnValue('mock-jwt-token');

      const result = await service.generateJWT(user);

      expect(result).toBe('mock-jwt-token');
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        {
          sub: user.id,
          email: user.email,
          name: user.name,
        },
        { expiresIn: '1h' },
      );
    });
  });

  describe('validateJWT', () => {
    it('should return user when token payload is valid', async () => {
      const user: User = {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
      };

      // First create a user
      await service.validateGoogleUser({
        id: 'google123',
        email: user.email,
        name: user.name,
      });

      const payload = {
        sub: user.id,
        email: user.email,
        name: user.name,
      };

      // Manually add user to service's internal map for testing
      service['users'].set(user.id, user);

      const result = await service.validateJWT(payload);

      expect(result).toMatchObject({
        email: user.email,
        name: user.name,
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      const payload = {
        sub: 'nonexistent-user',
        email: 'test@example.com',
        name: 'Test User',
      };

      await expect(service.validateJWT(payload)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.validateJWT(payload)).rejects.toThrow(
        'User not found',
      );
    });

    it('should throw UnauthorizedException when token is expired', async () => {
      const user: User = {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
      };

      service['users'].set(user.id, user);

      const expiredPayload = {
        sub: user.id,
        email: user.email,
        name: user.name,
        exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
      };

      await expect(service.validateJWT(expiredPayload)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.validateJWT(expiredPayload)).rejects.toThrow(
        'Token has expired',
      );
    });
  });

  describe('refreshToken', () => {
    it('should generate new token for user', async () => {
      const user: User = {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
      };

      mockJwtService.sign.mockReturnValue('new-jwt-token');

      const result = await service.refreshToken(user);

      expect(result).toBe('new-jwt-token');
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        {
          sub: user.id,
          email: user.email,
          name: user.name,
        },
        { expiresIn: '1h' },
      );
    });
  });
});
