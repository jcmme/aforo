export enum PermissionScope {
  PROPIO = 'propio',
  ANTRO = 'antro',
  CORPORATIVO = 'corporativo',
}

const ORDEN_ALCANCE: Record<PermissionScope, number> = {
  [PermissionScope.PROPIO]: 1,
  [PermissionScope.ANTRO]: 2,
  [PermissionScope.CORPORATIVO]: 3,
};

export function alcanceMasAmplio(a: PermissionScope, b: PermissionScope): PermissionScope {
  return ORDEN_ALCANCE[a] >= ORDEN_ALCANCE[b] ? a : b;
}
