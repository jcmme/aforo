import { Linking } from 'react-native';

/**
 * Abre WhatsApp con un mensaje prellenado (wa.me). Sin dependencia nueva: solo
 * construye la URL y la abre. Si se pasa `telefono`, el chat se abre
 * directamente con ese número (formato con solo dígitos, sin "+").
 */
export function enviarPorWhatsApp(mensaje: string, telefono?: string | null): void {
  const tel = telefono ? telefono.replace(/\D/g, '') : '';
  const url = `https://wa.me/${tel}?text=${encodeURIComponent(mensaje)}`;
  Linking.openURL(url).catch(() => {
    // Sin WhatsApp instalado/disponible: no hay más que hacer desde aquí.
  });
}

/** Mensaje de invitación a un acceso, mismo patrón que usan apps de acceso. */
export function mensajeInvitacion(params: {
  nombreInvitado: string;
  lugar: string;
  link: string;
  vigencia?: string;
}): string {
  const { nombreInvitado, lugar, link, vigencia } = params;
  const lineas = [
    `Hola ${nombreInvitado.split(' ')[0]},`,
    '',
    `Te comparto tu acceso para ${lugar}.`,
    '',
    'Para entrar:',
    `1. Abre este link: ${link}`,
    '2. Ahí verás tu QR de entrada.',
  ];
  if (vigencia) lineas.push('', `Vigencia: ${vigencia}`);
  lineas.push('', 'Exclusivo para este número de celular.', '', 'Powered by AFORO');
  return lineas.join('\n');
}
