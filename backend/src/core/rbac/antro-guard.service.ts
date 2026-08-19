import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Antro } from '../identidad/entities/antro.entity';
import { DataScope } from './data-scope';
import { PermissionScope } from './permission-scope.enum';

/**
 * Único lugar que valida "¿este antroId es de verdad uno de los míos?".
 * Antes cada módulo repetía a mano `alcance !== CORPORATIVO && !antroIds
 * .includes(antroId)`, lo cual para alcance CORPORATIVO nunca comprobaba
 * que el antroId mandado por el cliente perteneciera al corporativo del
 * que llama — solo lo hacía para alcance ANTRO. Aquí se comprueba siempre,
 * sin importar el alcance.
 */
@Injectable()
export class AntroGuardService {
  constructor(
    @InjectRepository(Antro)
    private readonly antroRepo: Repository<Antro>,
  ) {}

  async verificarAcceso(antroId: string, dataScope: DataScope): Promise<void> {
    if (dataScope.alcance !== PermissionScope.CORPORATIVO && !dataScope.antroIds?.includes(antroId)) {
      throw new ForbiddenException('No tienes acceso a ese antro.');
    }

    const antro = await this.antroRepo.findOne({ where: { id: antroId } });
    if (!antro || antro.corporativoId !== dataScope.corporativoId) {
      throw new ForbiddenException('Ese antro no pertenece a tu corporativo.');
    }
  }
}
