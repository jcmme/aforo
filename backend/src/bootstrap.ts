import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ModuleRegistryService } from './core/module-registry/module-registry.service';
import { RbacService } from './core/rbac/rbac.service';
import { sincronizarPermisosDesdeRegistro } from './core/module-registry/sincronizar-permisos.util';

/**
 * Configuración compartida entre el arranque local (main.ts, con
 * app.listen) y el entry point serverless de Vercel (api/index.ts, sin
 * listen) — para no duplicarla entre los dos.
 */
export async function configurarApp(app: INestApplication): Promise<void> {
  const configService = app.get(ConfigService);

  // Sin CORS_ORIGIN (dev local) queda abierto, como antes. En producción se
  // limita a los orígenes que se listen ahí, separados por comas.
  const corsOrigin = configService.get<string>('CORS_ORIGIN');
  app.enableCors({ origin: corsOrigin ? corsOrigin.split(',').map((o) => o.trim()) : true });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Los módulos ya se registraron a sí mismos (onModuleInit) para cuando
  // llegamos aquí. Sincronizamos su catálogo de permisos declarado con la
  // tabla `permiso` — así un módulo nuevo no necesita una migración de datos.
  await sincronizarPermisosDesdeRegistro(app.get(ModuleRegistryService), app.get(RbacService));
}
