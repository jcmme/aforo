import { FormEvent, useState } from 'react';
import { login, guardarSesion, ApiError } from '../api';

export default function Login({ onLogin }: { onLogin: (email: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      const token = await login(email, password);
      guardarSesion(token, email);
      onLogin(email);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo iniciar sesión.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="login-shell">
      <form className="login-card" onSubmit={enviar}>
        <div>
          <h1>Aforo</h1>
          <p className="subtitle">Control interno del corporativo</p>
        </div>

        {error && <div className="error-msg">{error}</div>}

        <div className="field">
          <label htmlFor="email">Correo</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
        </div>

        <div className="field">
          <label htmlFor="password">Contraseña</label>
          <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        <button className="btn" type="submit" disabled={cargando}>
          {cargando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
