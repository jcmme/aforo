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

  // Dev: el frontend (Vite) corre en otro puerto. Restringir el origen en producción.
  app.enableCors();

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Los módulos ya se registraron a sí mismos (onModuleInit) para cuando
  // llegamos aquí. Sincronizamos su catálogo de permisos declarado con la
  // tabla `permiso` — así un módulo nuevo no necesita una migración de datos.
  await sincronizarPermisosDesdeRegistro(app.get(ModuleRegistryService), app.get(RbacService));

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  // Sin el host explícito, algunos entornos de contenedor (Railway incluido)
  // no logran alcanzar el proceso desde su proxy — hay que escuchar en
  // todas las interfaces, no solo localhost.
  await app.listen(port, '0.0.0.0');
}

bootstrap();
