import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Activer CORS pour la communication avec le frontend React
  app.enableCors({
    origin: true, // Permettre toutes les origines en dev
    credentials: true,
  });

  // Validation globale des schémas DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`[SYS] AgriFlow Backend lancé avec succès sur le port ${port}`);
}
bootstrap();
