import {
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService, User } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req: Request) {
    // Initiates Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const user = req.user as User;
    
    if (!user) {
      throw new UnauthorizedException('Authentication failed');
    }

    // Generate JWT token with 1 hour expiration
    const token = await this.authService.generateJWT(user);

    // Set httpOnly cookie with JWT and security settings
    res.cookie('access_token', token, {
      httpOnly: true, // Prevents JavaScript access
      secure: this.configService.get('NODE_ENV') === 'production', // HTTPS only in production
      sameSite: 'lax', // CSRF protection
      maxAge: 60 * 60 * 1000, // 1 hour (matches JWT expiration)
      path: '/', // Available for all routes
    });

    // Redirect to frontend
    const frontendUrl = this.configService.get('FRONTEND_URL');
    res.redirect(`${frontendUrl}/dashboard`);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@Req() req: Request) {
    const user = req.user as User;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
    };
  }

  @Post('logout')
  async logout(@Res() res: Response) {
    // Clear authentication cookie with proper settings
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: '/',
    });
    
    res.json({ message: 'Logged out successfully' });
  }

  @Post('refresh')
  @UseGuards(AuthGuard('jwt'))
  async refresh(@Req() req: Request, @Res() res: Response) {
    const user = req.user as User;
    
    // Generate new token with fresh expiration
    const token = await this.authService.refreshToken(user);

    // Set new httpOnly cookie with refreshed token
    res.cookie('access_token', token, {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000, // 1 hour
      path: '/',
    });

    res.json({ 
      message: 'Token refreshed successfully',
      expiresIn: 3600, // 1 hour in seconds
    });
  }
}