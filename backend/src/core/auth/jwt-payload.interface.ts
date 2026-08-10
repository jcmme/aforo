export interface JwtPayload {
  sub: string;
  email: string;
  corporativoId: string;
}

export interface UsuarioAutenticado {
  id: string;
  email: string;
  corporativoId: string;
}
