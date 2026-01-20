import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    // Handle token expiration
    if (info?.name === 'TokenExpiredError') {
      throw new UnauthorizedException('Token has expired. Please log in again.');
    }

    // Handle invalid token
    if (info?.name === 'JsonWebTokenError') {
      throw new UnauthorizedException('Invalid token. Please log in again.');
    }

    // Handle missing token
    if (!user && !err) {
      throw new UnauthorizedException('No authentication token provided.');
    }

    // Handle other errors
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication failed.');
    }

    return user;
  }
}