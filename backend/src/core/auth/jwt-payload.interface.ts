export interface JwtPayload {
  sub: string;
  email: string;
  corporativoId: string;
}

/** A qué cliente "entró" el Súper Admin (antroId = null: al corporativo completo). */
export interface VerComo {
  corporativoId: string;
  antroId: string | null;
}

export interface UsuarioAutenticado {
  id: string;
  email: string;
  /** El corporativo con el que opera este request: el suyo, o el del cliente al que entró el Súper Admin. */
  corporativoId: string;
  esSuperAdmin: boolean;
  viendoComo: VerComo | null;
}
