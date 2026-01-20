import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  iat?: number; // Issued at
  exp?: number; // Expiration time
}

@Injectable()
export class AuthService {
  private users: Map<string, User> = new Map();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateGoogleUser(googleUser: GoogleUser): Promise<User> {
    const { id, email, name, picture } = googleUser;

    // For demo purposes, store user in memory
    let user = Array.from(this.users.values()).find(u => u.email === email);

    if (!user) {
      user = {
        id: `user_${Date.now()}`,
        email,
        name,
        avatarUrl: picture,
      };
      this.users.set(user.id, user);
    }

    return user;
  }

  async generateJWT(user: User): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
    };

    // Generate short-lived access token (1 hour)
    return this.jwtService.sign(payload, {
      expiresIn: '1h',
    });
  }

  async validateJWT(payload: JwtPayload): Promise<User> {
    // Check if token has expired (additional check beyond JWT verification)
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      throw new UnauthorizedException('Token has expired');
    }

    const user = this.users.get(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async refreshToken(user: User): Promise<string> {
    // Generate new token with fresh expiration
    return this.generateJWT(user);
  }
}