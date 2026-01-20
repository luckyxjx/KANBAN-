import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies?.['access_token'];

    // If no token, let the route handler decide if authentication is required
    if (!token) {
      return next();
    }

    try {
      // Verify token from httpOnly cookie
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      // Attach user info to request for downstream use
      req['user'] = payload;
      
      next();
    } catch (error) {
      // Token is invalid or expired
      // Clear the invalid cookie
      res.clearCookie('access_token');
      
      // Let the route handler decide how to handle missing authentication
      next();
    }
  }
}
