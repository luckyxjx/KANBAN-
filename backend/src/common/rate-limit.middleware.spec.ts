import { RateLimitMiddleware } from './rate-limit.middleware';
import { Request, Response } from 'express';
import { TooManyRequestsException } from '@nestjs/common';

describe('RateLimitMiddleware', () => {
  let middleware: RateLimitMiddleware;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let nextFn: jest.Mock;

  beforeEach(() => {
    middleware = new RateLimitMiddleware({
      windowMs: 1000, // 1 second for testing
      maxRequests: 3,
    });

    mockReq = {
      headers: {},
      socket: { remoteAddress: '127.0.0.1' } as any,
    };

    mockRes = {
      setHeader: jest.fn(),
      getHeader: jest.fn(),
    };

    nextFn = jest.fn();
  });

  describe('rate limiting', () => {
    it('should allow requests within limit', () => {
      for (let i = 0; i < 3; i++) {
        middleware.use(mockReq as Request, mockRes as Response, nextFn);
      }

      expect(nextFn).toHaveBeenCalledTimes(3);
    });

    it('should reject requests exceeding limit', () => {
      for (let i = 0; i < 3; i++) {
        middleware.use(mockReq as Request, mockRes as Response, nextFn);
      }

      expect(() => {
        middleware.use(mockReq as Request, mockRes as Response, nextFn);
      }).toThrow(TooManyRequestsException);
    });

    it('should set rate limit headers', () => {
      middleware.use(mockReq as Request, mockRes as Response, nextFn);

      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 3);
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'X-RateLimit-Remaining',
        2,
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(Number));
    });

    it('should set Retry-After header when limit exceeded', () => {
      for (let i = 0; i < 3; i++) {
        middleware.use(mockReq as Request, mockRes as Response, nextFn);
      }

      try {
        middleware.use(mockReq as Request, mockRes as Response, nextFn);
      } catch (e) {
        // Expected
      }

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Retry-After',
        expect.any(Number),
      );
    });
  });

  describe('key generation', () => {
    it('should use userId if user is authenticated', () => {
      mockReq.user = { id: 'user-123' } as any;

      middleware.use(mockReq as Request, mockRes as Response, nextFn);
      middleware.use(mockReq as Request, mockRes as Response, nextFn);

      expect(nextFn).toHaveBeenCalledTimes(2);
    });

    it('should use IP address if user is not authenticated', () => {
      mockReq.headers = { 'x-forwarded-for': '192.168.1.1' };

      middleware.use(mockReq as Request, mockRes as Response, nextFn);
      middleware.use(mockReq as Request, mockRes as Response, nextFn);

      expect(nextFn).toHaveBeenCalledTimes(2);
    });

    it('should use custom key generator if provided', () => {
      const customKeyGen = jest.fn(() => 'custom-key');
      middleware = new RateLimitMiddleware({
        windowMs: 1000,
        maxRequests: 2,
        keyGenerator: customKeyGen,
      });

      middleware.use(mockReq as Request, mockRes as Response, nextFn);
      middleware.use(mockReq as Request, mockRes as Response, nextFn);

      expect(customKeyGen).toHaveBeenCalledTimes(2);
      expect(nextFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('window reset', () => {
    it('should reset counter after window expires', (done) => {
      middleware = new RateLimitMiddleware({
        windowMs: 100, // 100ms for testing
        maxRequests: 1,
      });

      // First request
      middleware.use(mockReq as Request, mockRes as Response, nextFn);
      expect(nextFn).toHaveBeenCalledTimes(1);

      // Second request should fail
      expect(() => {
        middleware.use(mockReq as Request, mockRes as Response, nextFn);
      }).toThrow();

      // Wait for window to expire
      setTimeout(() => {
        // Third request should succeed (new window)
        middleware.use(mockReq as Request, mockRes as Response, nextFn);
        expect(nextFn).toHaveBeenCalledTimes(2);
        done();
      }, 150);
    });
  });

  describe('multiple users', () => {
    it('should track limits separately per user', () => {
      const req1 = { ...mockReq, user: { id: 'user-1' } } as any;
      const req2 = { ...mockReq, user: { id: 'user-2' } } as any;

      // User 1 makes 3 requests
      for (let i = 0; i < 3; i++) {
        middleware.use(req1 as Request, mockRes as Response, nextFn);
      }

      // User 2 should still be able to make requests
      middleware.use(req2 as Request, mockRes as Response, nextFn);

      expect(nextFn).toHaveBeenCalledTimes(4);

      // User 1 should be rate limited
      expect(() => {
        middleware.use(req1 as Request, mockRes as Response, nextFn);
      }).toThrow();

      // User 2 should still be able to make requests
      middleware.use(req2 as Request, mockRes as Response, nextFn);
      expect(nextFn).toHaveBeenCalledTimes(5);
    });
  });
});
