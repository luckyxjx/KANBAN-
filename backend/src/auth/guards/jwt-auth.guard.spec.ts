import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard();
  });

  describe('handleRequest', () => {
    it('should return user when authentication is successful', () => {
      const user = { id: '1', email: 'test@example.com', name: 'Test User' };
      const result = guard.handleRequest(null, user, null);
      expect(result).toEqual(user);
    });

    it('should throw UnauthorizedException when token is expired', () => {
      const info = { name: 'TokenExpiredError' };
      expect(() => guard.handleRequest(null, null, info)).toThrow(
        UnauthorizedException,
      );
      expect(() => guard.handleRequest(null, null, info)).toThrow(
        'Token has expired. Please log in again.',
      );
    });

    it('should throw UnauthorizedException when token is invalid', () => {
      const info = { name: 'JsonWebTokenError' };
      expect(() => guard.handleRequest(null, null, info)).toThrow(
        UnauthorizedException,
      );
      expect(() => guard.handleRequest(null, null, info)).toThrow(
        'Invalid token. Please log in again.',
      );
    });

    it('should throw UnauthorizedException when no token is provided', () => {
      expect(() => guard.handleRequest(null, null, null)).toThrow(
        UnauthorizedException,
      );
      expect(() => guard.handleRequest(null, null, null)).toThrow(
        'No authentication token provided.',
      );
    });

    it('should throw error when authentication fails with error', () => {
      const error = new Error('Authentication failed');
      expect(() => guard.handleRequest(error, null, null)).toThrow(error);
    });
  });
});
