import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { IdentidadModule } from './core/identidad/identidad.module';
import { RbacModule } from './core/rbac/rbac.module';
import { ModuleRegistryModule } from './core/module-registry/module-registry.module';
import { ExportModule } from './core/export/export.module';
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
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        url: config.get<string>('DATABASE_URL'),
        entities: [join(__dirname, '**', '*.entity.{ts,js}')],
        synchronize: false,
        migrationsRun: false,
      }),
    }),
    ModuleRegistryModule,
    IdentidadModule,
    RbacModule,
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
