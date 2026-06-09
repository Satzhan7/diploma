import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
    }),
  );
  
  // Enable global interceptor for handling circular references
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Influencer Platform API')
    .setDescription('The Influencer Platform API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  new Logger('Bootstrap').log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
