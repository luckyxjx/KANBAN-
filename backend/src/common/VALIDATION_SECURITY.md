# Input Validation and Security Implementation

## Overview

This document describes the comprehensive input validation and security measures implemented in the Kanban system to prevent XSS attacks, enforce data integrity, and protect against abuse through rate limiting.

## Components

### 1. Data Transfer Objects (DTOs)

All API endpoints use DTOs with comprehensive validation rules to ensure data integrity and prevent invalid input.

#### Validation Rules Applied

**String Fields:**
- `@IsString()` - Ensures value is a string
- `@MinLength(1)` - Prevents empty strings
- `@MaxLength(n)` - Enforces maximum length limits
- `@IsNotEmpty()` - Explicitly requires non-empty values

**Array Fields:**
- `@IsArray()` - Ensures value is an array
- `@ArrayMinSize(1)` - Prevents empty arrays
- `@IsString({ each: true })` - Validates each array element

**Enum Fields:**
- `@IsEnum()` - Validates against allowed enum values

**Email Fields:**
- `@IsEmail()` - Validates email format

**Numeric Fields:**
- `@IsInt()` - Ensures integer values
- `@Min(0)` - Enforces minimum values

**Color Fields:**
- `@Matches(/^#[0-9A-Fa-f]{6}$/)` - Validates hex color codes

#### Enhanced DTOs

**Board DTOs:**
- `CreateBoardDto`: name (1-100 chars), description (0-500 chars), color (hex format)
- `UpdateBoardDto`: optional fields with same constraints
- `CreateListDto`: name (1-100 chars)
- `UpdateListDto`: optional name field
- `CreateCardDto`: title (1-200 chars), description (0-2000 chars)
- `UpdateCardDto`: optional fields with same constraints
- `MoveCardDto`: targetListId (string), position (non-negative integer)
- `ReorderCardsDto`: cardIds (non-empty array of strings)
- `ReorderListsDto`: listIds (non-empty array of strings)

**Workspace DTOs:**
- `CreateWorkspaceDto`: name (1-100 chars), description (0-500 chars)
- `InviteUserDto`: email (valid email), role (enum)

### 2. Input Sanitization

The `sanitization.util.ts` module provides utilities to prevent XSS attacks by removing dangerous HTML and JavaScript patterns.

#### Sanitization Functions

**`sanitizeString(input: string): string`**
- Removes `<script>` and `<style>` tags with their content
- Removes all other HTML tags
- Removes `javascript:` protocol handlers
- Removes event handler attributes (onclick, onerror, etc.)
- Decodes HTML entities
- Trims whitespace

**`sanitizeObject<T>(obj: T): T`**
- Recursively sanitizes all string properties in an object
- Preserves non-string values (numbers, booleans, dates)
- Handles nested objects and arrays
- Maintains object structure

#### Usage

```typescript
import { sanitizeString, sanitizeObject } from './common/sanitization.util';

// Sanitize a single string
const cleanTitle = sanitizeString(userInput);

// Sanitize an entire DTO object
const cleanDto = sanitizeObject(createBoardDto);
```

### 3. Rate Limiting Middleware

The `rate-limit.middleware.ts` implements sliding window rate limiting to prevent API abuse.

#### Configuration

**Default Settings:**
- Window: 60 seconds
- Max Requests: 100 per window per user/IP
- Key Generation: Uses userId if authenticated, otherwise IP address

#### Features

- **Per-User Tracking**: Authenticated users are tracked by userId
- **Per-IP Fallback**: Unauthenticated requests tracked by IP address
- **Custom Key Generator**: Supports custom key generation logic
- **Rate Limit Headers**: Sets standard HTTP rate limit headers
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining in current window
  - `X-RateLimit-Reset`: Seconds until window resets
  - `Retry-After`: Seconds to wait before retrying (when limit exceeded)

#### Automatic Cleanup

- Expired entries are automatically cleaned up every 5 minutes
- Prevents memory leaks from accumulating old records

#### Usage

```typescript
// In app.module.ts
import { RateLimitMiddleware } from './common/rate-limit.middleware';

export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(new RateLimitMiddleware({
        windowMs: 60 * 1000,    // 1 minute
        maxRequests: 100,        // 100 requests
      }))
      .forRoutes('*');
  }
}
```

### 4. Global Validation Pipe

The global validation pipe in `main.ts` enforces DTO validation on all requests.

#### Configuration

```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,              // Remove unknown properties
  forbidNonWhitelisted: true,   // Reject unknown properties
  transform: true,              // Auto-transform to DTO class
}));
```

#### Behavior

- **Whitelist**: Removes any properties not defined in the DTO
- **Forbid Non-Whitelisted**: Returns 400 error if unknown properties are present
- **Transform**: Automatically converts plain objects to DTO class instances

## Security Properties Validated

### Property 18: Input Validation and Sanitization
*For any* API request or user input, the system should validate using DTOs and sanitize content to prevent security vulnerabilities.

**Validation Ensures:**
- All string inputs are within acceptable length limits
- Required fields are present and non-empty
- Enum values are from allowed set
- Email addresses are properly formatted
- Arrays contain valid elements

**Sanitization Ensures:**
- HTML tags are removed
- JavaScript protocols are blocked
- Event handlers are stripped
- XSS payloads are neutralized

### Property 23: Rate Limiting Enforcement
*For any* API request, the system should apply rate limiting per user and endpoint, returning appropriate HTTP status codes when limits are exceeded.

**Rate Limiting Ensures:**
- Users cannot make excessive requests
- System remains stable under load
- Abuse is prevented through per-user tracking
- Proper HTTP status codes (429) are returned

## Testing

### Unit Tests

**Sanitization Tests** (`sanitization.util.spec.ts`):
- HTML tag removal
- JavaScript protocol blocking
- Event handler removal
- Safe text preservation
- Nested object sanitization
- Array element sanitization

**Rate Limiting Tests** (`rate-limit.middleware.spec.ts`):
- Request counting within limits
- Rejection when limits exceeded
- Header setting
- Per-user tracking
- Window reset behavior
- Multiple user isolation

### Integration

All existing tests pass with the new validation and security measures in place.

## Best Practices

1. **Always use DTOs**: Never accept raw request bodies without DTO validation
2. **Sanitize before storage**: Sanitize user input before storing in database
3. **Validate on frontend**: Provide immediate feedback to users
4. **Monitor rate limits**: Track rate limit violations for security analysis
5. **Test edge cases**: Verify sanitization handles all XSS vectors

## Future Enhancements

1. **Endpoint-specific rate limits**: Different limits for different endpoints
2. **Distributed rate limiting**: Support for multi-instance deployments
3. **Advanced sanitization**: HTML whitelist approach for rich text
4. **CSRF protection**: Additional CSRF token validation
5. **Input logging**: Log suspicious input patterns for analysis
