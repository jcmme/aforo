import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { ModuleRegistryService } from './core/module-registry/module-registry.service';
import { RbacService } from './core/rbac/rbac.service';
import { sincronizarPermisosDesdeRegistro } from './core/module-registry/sincronizar-permisos.util';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Los módulos ya se registraron a sí mismos (onModuleInit) para cuando
  // llegamos aquí. Sincronizamos su catálogo de permisos declarado con la
  // tabla `permiso` — así un módulo nuevo no necesita una migración de datos.
  await sincronizarPermisosDesdeRegistro(app.get(ModuleRegistryService), app.get(RbacService));

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);
}

bootstrap();
