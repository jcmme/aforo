import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { configurarApp } from './bootstrap';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await configurarApp(app);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  // Sin el host explícito, algunos entornos de contenedor no logran
  // alcanzar el proceso desde su proxy — hay que escuchar en todas las
  // interfaces, no solo localhost.
  await app.listen(port, '0.0.0.0');
}

bootstrap();
