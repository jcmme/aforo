export default function AccessDenied({ mensaje }: { mensaje: string }) {
  return <div className="access-denied">No tienes acceso a esta sección: {mensaje}</div>;
}
