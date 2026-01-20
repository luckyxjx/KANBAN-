import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import * as fs from 'fs';

async function bootstrap() {
  const configService = new ConfigService();
  
  // HTTPS configuration for development only
  let httpsOptions: any = undefined;
  if (configService.get('NODE_ENV') === 'development') {
    try {
      const keyPath = configService.get('HTTPS_KEY_PATH');
      const certPath = configService.get('HTTPS_CERT_PATH');
      
      if (keyPath && certPath && fs.existsSync(keyPath) && fs.existsSync(certPath)) {
        httpsOptions = {
          key: fs.readFileSync(keyPath),
          cert: fs.readFileSync(certPath),
        };
        console.log('HTTPS enabled for development');
      }
    } catch (error) {
      console.warn('HTTPS certificates not found, using HTTP for development');
    }
  }

  const app = await NestFactory.create(AppModule, {
    httpsOptions,
  });

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }));

  // Cookie parser for JWT tokens
  app.use(cookieParser());

  // CORS configuration
  app.enableCors({
    origin: configService.get('FRONTEND_URL'),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  const port = configService.get('PORT') || 3000;
  await app.listen(port);
  
  const protocol = httpsOptions ? 'https' : 'http';
  console.log(`Application is running on: ${protocol}://localhost:${port}`);
}

bootstrap();
