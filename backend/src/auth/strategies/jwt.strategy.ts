import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { AuthService, JwtPayload } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          // Extract JWT from httpOnly cookie
          const token = request?.cookies?.['access_token'];
          
          if (!token) {
            return null;
          }
          
          return token;
        },
      ]),
      ignoreExpiration: false, // Enforce token expiration
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload) {
    // Validate payload structure
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Invalid token payload');
    }

    try {
      // Validate user still exists and is valid
      const user = await this.authService.validateJWT(payload);
      return user;
    } catch (error) {
      throw new UnauthorizedException('Invalid token or user not found');
    }
  }
}