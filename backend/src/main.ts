import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpErrorFilter } from './common/errors/http-error.filter';
import { validationExceptionFactory } from './common/errors/validation';

async function bootstrap() {
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    const required = [
      'DB_HOST',
      'DB_USERNAME',
      'DB_PASSWORD',
      'DB_NAME',
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'CORS_ORIGIN',
    ];
    const missing = required.filter((name) => !process.env[name]?.trim());
    if (missing.length > 0) {
      throw new Error(
        `Missing required production environment variables: ${missing.join(', ')}`,
      );
    }
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // nginx is the single hop in front of the API. Trusting it makes req.ip the
  // client address from X-Forwarded-For, so the throttler buckets per client
  // instead of putting every user behind the proxy into one bucket.
  app.set('trust proxy', 1);

  // Standard security headers (SECURITY_AUDIT H5/L3).
  app.use(helmet());

  // Enable CORS. In production, restrict to CORS_ORIGIN (comma-separated list).
  // When CORS_ORIGIN is unset (dev/demo) fall back to reflecting any origin.
  const corsOrigin = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : true;
  app.enableCors({ origin: corsOrigin, credentials: true });

  // Enable validation pipes. whitelist+forbidNonWhitelisted reject unknown
  // body properties (mass-assignment guard, SECURITY_AUDIT H4).
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: validationExceptionFactory,
    }),
  );

  // Errors leave as { statusCode, code, message }; the frontend translates
  // `code`. 5xx details stay in the server log.
  app.useGlobalFilters(new HttpErrorFilter());

  // Enable global interceptor for handling circular references
  app.useGlobalInterceptors(new TransformInterceptor());

  // Keep API discovery available for local development only. Production does
  // not expose Swagger to unauthenticated internet users.
  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('Influencer Platform API')
      .setDescription('The Influencer Platform API description')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);
  new Logger('Bootstrap').log(
    `Application is running on: http://localhost:${port}`,
  );
}
bootstrap();
