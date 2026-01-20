import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Override to allow requests without authentication
  handleRequest(err: any, user: any) {
    // Return user if authenticated, null otherwise
    // Don't throw errors for missing authentication
    return user || null;
  }

  canActivate(context: ExecutionContext) {
    // Always return true to allow the request through
    // The user will be attached if token is valid
    return super.canActivate(context) as Promise<boolean> | boolean;
  }
}
