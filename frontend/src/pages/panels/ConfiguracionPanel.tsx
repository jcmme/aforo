import { FormEvent, useState } from 'react';
import { cambiarPassword, ApiError } from '../../api';

export default function ConfiguracionPanel({ email, onLogout }: { email: string; onLogout: () => void }) {
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNuevo, setPasswordNuevo] = useState('');
  const [passwordConfirmar, setPasswordConfirmar] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setExito(false);

    if (passwordNuevo !== passwordConfirmar) {
      setError('La confirmación no coincide con la contraseña nueva.');
      return;
    }
    if (passwordNuevo.length < 8) {
      setError('La contraseña nueva debe tener al menos 8 caracteres.');
      return;
    }

    setEnviando(true);
    try {
      await cambiarPassword(passwordActual, passwordNuevo);
      setExito(true);
      setPasswordActual('');
      setPasswordNuevo('');
      setPasswordConfirmar('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo cambiar la contraseña.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <header>
        <h2>Configuración</h2>
        <p>Cuenta: {email}</p>
      </header>

      <div className="panel-card" style={{ maxWidth: '360px' }}>
        <h3>Cambiar contraseña</h3>
        <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {error && <div className="error-msg">{error}</div>}
          {exito && <p className="hint">Contraseña actualizada.</p>}

          <div className="field">
            <label htmlFor="passwordActual">Contraseña actual</label>
            <input
              id="passwordActual"
              type="password"
              required
              value={passwordActual}
              onChange={(e) => setPasswordActual(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="passwordNuevo">Contraseña nueva</label>
            <input
              id="passwordNuevo"
              type="password"
              required
              minLength={8}
              value={passwordNuevo}
              onChange={(e) => setPasswordNuevo(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="passwordConfirmar">Confirmar contraseña nueva</label>
            <input
              id="passwordConfirmar"
              type="password"
              required
              minLength={8}
              value={passwordConfirmar}
              onChange={(e) => setPasswordConfirmar(e.target.value)}
            />
          </div>

          <button className="btn" type="submit" disabled={enviando}>
            {enviando ? 'Guardando…' : 'Cambiar contraseña'}
          </button>
        </form>
      </div>

      <div className="panel-card panel-card-mobile-only">
        <button className="btn btn-secondary" onClick={onLogout}>
          Cerrar sesión
        </button>
      </div>
    </>
  );
}
