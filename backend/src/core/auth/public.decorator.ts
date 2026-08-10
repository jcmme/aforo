import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'es_publico';

/** Marca un endpoint que no requiere sesión (ej. login). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
