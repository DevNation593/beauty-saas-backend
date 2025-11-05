import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port') || 3000;
  const appName = configService.get<string>('app.name') || 'Beauty SaaS';
  const appVersion = configService.get<string>('app.version') || '1.0.0';

  // Security middleware
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  // CORS configuration
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173', // Vite dev server
      /^https:\/\/.*\.vercel\.app$/, // Vercel deployments
      /^https:\/\/.*\.netlify\.app$/, // Netlify deployments
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-Tenant-Slug',
    ],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip props that are not defined in DTOs
      forbidNonWhitelisted: true, // Throw error if non-whitelisted props are present
      transform: true, // Transform payloads to be objects typed according to their DTO classes
      disableErrorMessages: configService.get('app.env') === 'production',
      validateCustomDecorators: true,
    }),
  );

  // API prefix
  app.setGlobalPrefix('api', {
    exclude: ['/health', '/metrics'],
  });

  // Swagger documentation
  if (configService.get('app.env') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle(appName)
      .setDescription(`${appName} API Documentation`)
      .setVersion(appVersion)
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addApiKey(
        {
          type: 'apiKey',
          name: 'X-Tenant-Slug',
          in: 'header',
          description: 'Tenant identifier for multi-tenant operations',
        },
        'tenant-key',
      )
      .addServer(`http://localhost:${port}`, 'Development server')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
      },
      customSiteTitle: `${appName} API Docs`,
    });

    logger.log(
      `📚 Swagger documentation available at http://localhost:${port}/api/docs`,
    );
  }

  // Health check endpoint
  app.use('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: configService.get('app.env'),
      version: appVersion,
    });
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.log('SIGTERM received, shutting down gracefully...');
    void app.close().then(() => {
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    logger.log('SIGINT received, shutting down gracefully...');
    void app.close().then(() => {
      process.exit(0);
    });
  });

  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 ${appName} is running on: http://localhost:${port}`);
  logger.log(`🌍 Environment: ${configService.get('app.env')}`);
  logger.log(`📦 Version: ${appVersion}`);
}

bootstrap().catch((error) => {
  console.error('Error during bootstrap:', error);
  process.exit(1);
});
