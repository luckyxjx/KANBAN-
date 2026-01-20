# Authentication Module

## Overview
This module implements JWT-based authentication with Google OAuth, using httpOnly cookies for secure token storage.

## Components

### Guards
- **JwtAuthGuard**: Protects routes requiring authentication
- **OptionalJwtAuthGuard**: Allows optional authentication

### Middleware
- **AuthMiddleware**: Verifies tokens from httpOnly cookies

### Strategies
- **GoogleStrategy**: Handles Google OAuth authentication
- **JwtStrategy**: Validates JWT tokens from cookies

## Features
- JWT tokens stored in httpOnly cookies (prevents XSS)
- Short-lived tokens (1 hour expiration)
- Token refresh endpoint
- Comprehensive error handling for expired/invalid tokens
- Secure cookie settings (httpOnly, sameSite, secure in production)

## Usage

### Protecting Routes
```typescript
@UseGuards(JwtAuthGuard)
@Get('protected')
async protectedRoute(@Req() req: Request) {
  const user = req.user;
  // ...
}
```

### Token Refresh
Clients should call `/auth/refresh` before token expiration to get a new token.

## Requirements Satisfied
- 1.5: JWT token verification on protected routes
- 1.7: Token expiration enforcement
- 1.8: Short-lived access tokens for security
