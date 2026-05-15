import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('CleanAir System API')
    .setDescription('The CleanAir System API provides a comprehensive set of endpoints for monitoring air quality, managing user accounts, and handling administrative tasks. This documentation is designed to help frontend developers integrate with the backend services seamlessly.')
    .setVersion('1.0.0')
    .addBearerAuth()
    .setContact('CleanAir Support', 'https://cleanair-system.example.com', 'support@cleanair.com')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
