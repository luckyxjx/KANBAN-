# Logging and Monitoring Guide

Comprehensive guide for setting up logging, monitoring, and observability for the multi-tenant Kanban system.

## Table of Contents

1. [Backend Logging](#backend-logging)
2. [Frontend Monitoring](#frontend-monitoring)
3. [Database Monitoring](#database-monitoring)
4. [Infrastructure Monitoring](#infrastructure-monitoring)
5. [Alert Configuration](#alert-configuration)
6. [Dashboards](#dashboards)
7. [Log Analysis](#log-analysis)

## Backend Logging

### Logging Configuration

#### Development Environment

```typescript
// src/main.ts
import { Logger } from '@nestjs/common';

const logger = new Logger('Application');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Development logging
  if (process.env.NODE_ENV === 'development') {
    app.useLogger(['debug', 'log', 'error', 'warn', 'verbose']);
  } else {
    app.useLogger(['error', 'warn']);
  }
  
  await app.listen(3000);
  logger.log('Application started on port 3000');
}
```

#### Production Environment

```typescript
// Use structured logging with JSON format
// Example: Winston or Pino logger

import * as winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'kanban-backend' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}
```

### Request Logging

```typescript
// src/common/logging.middleware.ts
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '';
    const userId = req.user?.id || 'anonymous';
    const workspaceId = req.headers['x-workspace-id'] || 'none';

    const start = Date.now();

    res.on('finish', () => {
      const { statusCode } = res;
      const contentLength = res.get('content-length');
      const duration = Date.now() - start;

      this.logger.log(
        `${method} ${originalUrl} ${statusCode} ${duration}ms - ` +
        `user:${userId} workspace:${workspaceId} ip:${ip}`,
      );

      // Log slow requests
      if (duration > 1000) {
        this.logger.warn(
          `Slow request: ${method} ${originalUrl} took ${duration}ms`,
        );
      }
    });

    next();
  }
}
```

### Error Logging

```typescript
// src/common/error-logging.filter.ts
import { Catch, ArgumentsHost, Logger, HttpException } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

@Catch()
export class ErrorLoggingFilter extends BaseExceptionFilter {
  private logger = new Logger('Error');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    const userId = request.user?.id || 'anonymous';
    const workspaceId = request.headers['x-workspace-id'] || 'none';
    const { method, originalUrl } = request;

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const message = exception.getResponse();

      this.logger.error(
        `${method} ${originalUrl} ${status} - ` +
        `user:${userId} workspace:${workspaceId} - ${JSON.stringify(message)}`,
      );
    } else if (exception instanceof Error) {
      this.logger.error(
        `${method} ${originalUrl} - ` +
        `user:${userId} workspace:${workspaceId} - ${exception.message}`,
        exception.stack,
      );
    }

    super.catch(exception, host);
  }
}
```

### Security Event Logging

```typescript
// src/common/security-logger.ts
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SecurityLogger {
  private logger = new Logger('Security');

  logAuthenticationFailure(email: string, reason: string) {
    this.logger.warn(
      `Authentication failure: email:${email} reason:${reason}`,
    );
  }

  logAuthorizationDenial(userId: string, workspaceId: string, resource: string) {
    this.logger.warn(
      `Authorization denial: userId:${userId} workspaceId:${workspaceId} resource:${resource}`,
    );
  }

  logUnauthorizedAccess(userId: string, workspaceId: string, endpoint: string) {
    this.logger.error(
      `Unauthorized access attempt: userId:${userId} workspaceId:${workspaceId} endpoint:${endpoint}`,
    );
  }

  logRateLimitViolation(userId: string, endpoint: string, limit: number) {
    this.logger.warn(
      `Rate limit violation: userId:${userId} endpoint:${endpoint} limit:${limit}`,
    );
  }

  logSuspiciousActivity(userId: string, activity: string, details: any) {
    this.logger.error(
      `Suspicious activity: userId:${userId} activity:${activity} details:${JSON.stringify(details)}`,
    );
  }
}
```

### Activity Logging

```typescript
// src/activity/activity-logger.ts
import { Injectable, Logger } from '@nestjs/common';
import { ActivityService } from './activity.service';

@Injectable()
export class ActivityLogger {
  private logger = new Logger('Activity');

  constructor(private activityService: ActivityService) {}

  async logCardCreated(userId: string, cardId: string, workspaceId: string, title: string) {
    this.logger.log(
      `Card created: userId:${userId} cardId:${cardId} workspace:${workspaceId} title:${title}`,
    );

    await this.activityService.logCardActivity(
      userId,
      cardId,
      'CREATED',
      { title },
    );
  }

  async logCardMoved(userId: string, cardId: string, workspaceId: string, fromList: string, toList: string) {
    this.logger.log(
      `Card moved: userId:${userId} cardId:${cardId} workspace:${workspaceId} from:${fromList} to:${toList}`,
    );

    await this.activityService.logCardActivity(
      userId,
      cardId,
      'MOVED',
      { fromList, toList },
    );
  }

  async logBoardCreated(userId: string, boardId: string, workspaceId: string, name: string) {
    this.logger.log(
      `Board created: userId:${userId} boardId:${boardId} workspace:${workspaceId} name:${name}`,
    );

    await this.activityService.logBoardActivity(
      userId,
      boardId,
      'CREATED',
      { name },
    );
  }
}
```

## Frontend Monitoring

### Error Tracking

```typescript
// src/services/errorTracking.ts
import * as Sentry from "@sentry/react";

export function initializeErrorTracking() {
  if (process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.VITE_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
      integrations: [
        new Sentry.Replay({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    });
  }
}

export function captureException(error: Error, context?: Record<string, any>) {
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, {
      contexts: {
        custom: context,
      },
    });
  } else {
    console.error('Error:', error, context);
  }
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureMessage(message, level);
  } else {
    console.log(`[${level.toUpperCase()}] ${message}`);
  }
}
```

### Performance Monitoring

```typescript
// src/services/performanceMonitoring.ts
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  startMeasure(label: string) {
    performance.mark(`${label}-start`);
  }

  endMeasure(label: string) {
    performance.mark(`${label}-end`);
    performance.measure(label, `${label}-start`, `${label}-end`);

    const measure = performance.getEntriesByName(label)[0];
    if (measure) {
      const duration = measure.duration;
      
      if (!this.metrics.has(label)) {
        this.metrics.set(label, []);
      }
      this.metrics.get(label)!.push(duration);

      // Log slow operations
      if (duration > 1000) {
        console.warn(`Slow operation: ${label} took ${duration}ms`);
      }
    }
  }

  getMetrics(label: string) {
    const durations = this.metrics.get(label) || [];
    if (durations.length === 0) return null;

    return {
      count: durations.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
      avg: durations.reduce((a, b) => a + b, 0) / durations.length,
      p95: this.percentile(durations, 0.95),
      p99: this.percentile(durations, 0.99),
    };
  }

  private percentile(values: number[], p: number): number {
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[index];
  }
}

export const performanceMonitor = new PerformanceMonitor();
```

### User Analytics

```typescript
// src/services/analytics.ts
export class Analytics {
  private events: any[] = [];

  trackEvent(eventName: string, properties?: Record<string, any>) {
    const event = {
      name: eventName,
      timestamp: new Date().toISOString(),
      properties,
    };

    this.events.push(event);

    // Send to analytics service
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics(event);
    } else {
      console.log('Analytics event:', event);
    }
  }

  trackPageView(pageName: string) {
    this.trackEvent('page_view', { page: pageName });
  }

  trackUserAction(action: string, details?: Record<string, any>) {
    this.trackEvent('user_action', { action, ...details });
  }

  private sendToAnalytics(event: any) {
    // Send to Mixpanel, Amplitude, or similar service
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    }).catch(err => console.error('Analytics error:', err));
  }
}

export const analytics = new Analytics();
```

## Database Monitoring

### Query Performance Monitoring

```sql
-- Enable slow query log
SET log_min_duration_statement = 500; -- Log queries > 500ms

-- View slow queries
SELECT query, calls, mean_time, max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Check missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY abs(correlation) DESC;
```

### Connection Pool Monitoring

```typescript
// src/database/connection-monitor.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class ConnectionMonitor {
  private logger = new Logger('ConnectionMonitor');

  constructor(private prisma: PrismaService) {
    this.startMonitoring();
  }

  private startMonitoring() {
    setInterval(async () => {
      try {
        const result = await this.prisma.$queryRaw`
          SELECT count(*) as connection_count
          FROM pg_stat_activity
          WHERE datname = current_database()
        `;

        const connectionCount = result[0].connection_count;
        this.logger.log(`Active connections: ${connectionCount}`);

        // Alert if connections are high
        if (connectionCount > 15) {
          this.logger.warn(`High connection count: ${connectionCount}`);
        }
      } catch (error) {
        this.logger.error('Failed to monitor connections', error);
      }
    }, 60000); // Check every minute
  }
}
```

### Database Health Check

```typescript
// src/health/database.health.ts
import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class DatabaseHealthIndicator extends HealthIndicator {
  constructor(private prisma: PrismaService) {
    super();
  }

  async isHealthy(): Promise<HealthIndicatorResult> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return this.getStatus('database', true);
    } catch (error) {
      throw new HealthCheckError('Database check failed', error);
    }
  }
}
```

## Infrastructure Monitoring

### Render Monitoring

```bash
# View application logs
curl https://api.render.com/v1/services/{service-id}/logs \
  -H "Authorization: Bearer $RENDER_API_KEY"

# Monitor metrics
# - CPU usage
# - Memory usage
# - Disk usage
# - Network I/O
# - Request count
# - Error rate
```

### Vercel Monitoring

```bash
# View deployment logs
vercel logs --follow

# Monitor analytics
# - Page views
# - Performance metrics
# - Error tracking
# - User sessions
```

### Neon Database Monitoring

```bash
# Monitor database metrics
# - Connection count
# - Query performance
# - Storage usage
# - Backup status
```

## Alert Configuration

### Critical Alerts

```typescript
// Alert if error rate > 1%
if (errorCount / totalRequests > 0.01) {
  sendAlert('High error rate detected', {
    errorRate: (errorCount / totalRequests * 100).toFixed(2) + '%',
    errorCount,
    totalRequests,
  });
}

// Alert if response time p95 > 1 second
if (responseTimeP95 > 1000) {
  sendAlert('High response time detected', {
    p95: responseTimeP95 + 'ms',
  });
}

// Alert if database connections > 15
if (connectionCount > 15) {
  sendAlert('High database connection count', {
    connectionCount,
  });
}

// Alert if authentication failures > 5/minute
if (authFailures > 5) {
  sendAlert('High authentication failure rate', {
    failures: authFailures,
  });
}
```

### Warning Alerts

```typescript
// Warn if response time p95 > 500ms
if (responseTimeP95 > 500) {
  sendWarning('Elevated response time', {
    p95: responseTimeP95 + 'ms',
  });
}

// Warn if rate limit violations > 1/minute
if (rateLimitViolations > 1) {
  sendWarning('Rate limit violations detected', {
    violations: rateLimitViolations,
  });
}

// Warn if WebSocket connections > 500
if (wsConnections > 500) {
  sendWarning('High WebSocket connection count', {
    connections: wsConnections,
  });
}
```

## Dashboards

### Backend Dashboard

Key metrics to display:
- Request count (per endpoint)
- Error rate (by status code)
- Response time (p50, p95, p99)
- Database query time
- WebSocket connections
- Rate limit violations
- Authentication failures
- Active users

### Frontend Dashboard

Key metrics to display:
- Page load time
- API response time
- WebSocket latency
- Error rate
- User sessions
- Feature usage
- Performance metrics

### Database Dashboard

Key metrics to display:
- Connection count
- Query performance
- Slow queries
- Index usage
- Storage usage
- Backup status
- Replication lag

### Infrastructure Dashboard

Key metrics to display:
- CPU usage
- Memory usage
- Disk usage
- Network I/O
- Request count
- Error rate
- Uptime

## Log Analysis

### Common Log Patterns

```bash
# Find authentication failures
grep "Authentication failure" logs/*.log

# Find authorization denials
grep "Authorization denial" logs/*.log

# Find slow requests
grep "Slow request" logs/*.log

# Find database errors
grep "Database error" logs/*.log

# Find WebSocket errors
grep "WebSocket error" logs/*.log
```

### Log Aggregation

```typescript
// Send logs to centralized service
import * as winston from 'winston';
import * as Papertrail from 'winston-papertrail';

const winstonPapertrail = new Papertrail({
  host: process.env.PAPERTRAIL_HOST,
  port: process.env.PAPERTRAIL_PORT,
  program: 'kanban-backend',
});

const logger = winston.createLogger({
  transports: [
    winstonPapertrail,
  ],
});
```

### Log Retention

```bash
# Keep logs for 30 days
find logs/ -name "*.log" -mtime +30 -delete

# Compress old logs
find logs/ -name "*.log" -mtime +7 -exec gzip {} \;

# Archive to S3
aws s3 sync logs/ s3://kanban-logs/$(date +%Y-%m-%d)/
```

---

**Last Updated**: 2024-01-20
**Version**: 1.0
