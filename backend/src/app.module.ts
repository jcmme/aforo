import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { IdentidadModule } from './core/identidad/identidad.module';
import { RbacModule } from './core/rbac/rbac.module';
import { ModuleRegistryModule } from './core/module-registry/module-registry.module';
import { ExportModule } from './core/export/export.module';
import { AuditoriaModule } from './core/auditoria/auditoria.module';
import { OnboardingModule } from './core/onboarding/onboarding.module';
import { FeatureFlagsModule } from './core/feature-flags/feature-flags.module';
import { AuthModule } from './core/auth/auth.module';
import { ReservasModule } from './modules/reservas/reservas.module';
import { RequisicionesModule } from './modules/requisiciones/requisiciones.module';
import { PersonalModule } from './modules/personal/personal.module';
import { MetricasModule } from './modules/metricas/metricas.module';
import { ProveedoresModule } from './modules/proveedores/proveedores.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        // Supabase exige SSL y, en serverless, hay que mantener el pool
        // chico (cada invocación puede ser un proceso nuevo) — se activan
        // los dos juntos con DATABASE_SSL=true. En local (sin esa var) se
        // queda igual que siempre.
        const ssl = config.get<string>('DATABASE_SSL') === 'true';
        return {
          type: 'postgres' as const,
          url: config.get<string>('DATABASE_URL'),
          entities: [join(__dirname, '**', '*.entity.{ts,js}')],
          synchronize: false,
          migrationsRun: false,
          ssl: ssl ? { rejectUnauthorized: false } : false,
          extra: ssl ? { max: 1 } : undefined,
        };
      },
    }),
    ModuleRegistryModule,
    IdentidadModule,
    RbacModule,
    AuditoriaModule,
    OnboardingModule,
    FeatureFlagsModule,
    AuthModule,
    ExportModule,
    ReservasModule,
    RequisicionesModule,
    PersonalModule,
    MetricasModule,
    ProveedoresModule,
  ],
})
export class AppModule {}
