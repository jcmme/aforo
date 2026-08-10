import { useState } from 'react';
import { getToken, getUsuarioSesion, cerrarSesion } from './api';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

export default function App() {
  const [sesion, setSesion] = useState(() => (getToken() ? getUsuarioSesion() : null));

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
      email={sesion.email}
      onLogout={() => {
        cerrarSesion();
        setSesion(null);
      }}
    />
  );
}
