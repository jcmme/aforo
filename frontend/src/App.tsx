import { useState } from 'react';
import { getToken, getUsuarioSesion, cerrarSesion } from './api';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

export default function App() {
  const [sesion, setSesion] = useState(() => (getToken() ? getUsuarioSesion() : null));
  // Cambia al entrar/salir de la vista de un cliente: remonta el Dashboard.
  const [vista, setVista] = useState(0);

  if (!sesion) {
    return (
      <Login
        onLogin={(email) => {
          setSesion({ email });
        }}
      />
    );
  }

  return (
    <Dashboard
      key={vista}
      email={sesion.email}
      onCambiarVista={() => setVista((v) => v + 1)}
      onLogout={() => {
        cerrarSesion();
        setSesion(null);
      }}
    />
  );
}
