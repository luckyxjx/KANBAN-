import { NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyGenerator?: (req: Request) => string; // Custom key generator
}

interface RequestRecord {
  count: number;
  resetTime: number;
}

/**
 * Rate limiting middleware that tracks requests per user/IP
 * Implements sliding window rate limiting
 */
export class RateLimitMiddleware implements NestMiddleware {
  private requestMap = new Map<string, RequestRecord>();
  private readonly windowMs: number;
  private readonly maxRequests: number;
  private readonly keyGenerator: (req: Request) => string;

  constructor(config?: RateLimitConfig) {
    this.windowMs = config?.windowMs || 60 * 1000; // 1 minute default
    this.maxRequests = config?.maxRequests || 100; // 100 requests default
    this.keyGenerator = config?.keyGenerator || this.defaultKeyGenerator;

    // Cleanup old entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  use(req: Request, res: Response, next: NextFunction) {
    const key = this.keyGenerator(req);
    const now = Date.now();

    let record = this.requestMap.get(key);

    // Initialize or reset if window expired
    if (!record || now > record.resetTime) {
      record = {
        count: 0,
        resetTime: now + this.windowMs,
      };
      this.requestMap.set(key, record);
    }

    record.count++;

    // Set rate limit headers
    const remaining = Math.max(0, this.maxRequests - record.count);
    const resetTime = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader('X-RateLimit-Limit', this.maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetTime);

    // Check if limit exceeded
    if (record.count > this.maxRequests) {
      res.setHeader('Retry-After', resetTime);
      throw new HttpException(
        `Rate limit exceeded. Try again in ${resetTime} seconds.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    next();
  }

  /**
   * Default key generator: uses userId if authenticated, otherwise uses IP
   */
  private defaultKeyGenerator = (req: Request): string => {
    const user = (req as any).user;
    if (user && user.id) {
      return `user:${user.id}`;
    }

    // Fallback to IP address
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.socket.remoteAddress ||
      'unknown';

    return `ip:${ip}`;
  };

  /**
   * Cleanup expired entries from the map
   */
  private cleanup() {
    const now = Date.now();
    for (const [key, record] of this.requestMap.entries()) {
      if (now > record.resetTime) {
        this.requestMap.delete(key);
      }
    }
  }
}

/**
 * Factory function to create rate limit middleware with custom config
 */
export function createRateLimitMiddleware(config?: RateLimitConfig) {
  return new RateLimitMiddleware(config);
}
