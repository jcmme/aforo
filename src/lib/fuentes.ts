// Carga de tipografías y fuente base uniforme para TODA la app.
//
// Serif Cormorant (títulos) + sans Jost (interfaz). Para que el cuerpo use Jost
// sin tocar cada <Text> de las 40+ pantallas, se parcha una sola vez el render
// de Text/TextInput inyectando la familia base; los estilos explícitos (roles
// del tema con Cormorant, tamaños, colores) siguen ganando por orden.

import { cloneElement } from 'react';
import { Text as RNText, TextInput as RNTextInput } from 'react-native';

import {
  Cormorant_500Medium,
  Cormorant_600SemiBold,
  Cormorant_700Bold,
} from '@expo-google-fonts/cormorant';
import { Jost_400Regular, Jost_500Medium, Jost_600SemiBold } from '@expo-google-fonts/jost';

import { familias } from '@/theme';

/** Mapa para `useFonts` en el layout raíz. */
export const fuentesAforo = {
  Cormorant_500Medium,
  Cormorant_600SemiBold,
  Cormorant_700Bold,
  Jost_400Regular,
  Jost_500Medium,
  Jost_600SemiBold,
};

function parchar(Comp: unknown) {
  // Text/TextInput son forwardRef: su función vive en `.render`.
  const c = Comp as { render?: (...a: unknown[]) => any; __aforoFont?: boolean };
  if (!c || c.__aforoFont || typeof c.render !== 'function') return;
  const orig = c.render;
  c.render = function (this: unknown, ...args: unknown[]) {
    const el = orig.apply(this, args);
    if (!el) return el;
    // La familia base va primero; el estilo explícito del elemento gana.
    return cloneElement(el, { style: [{ fontFamily: familias.sans }, el.props?.style] });
  };
  c.__aforoFont = true;
}

let aplicado = false;
/** Fija Jost como fuente base de Text y TextInput (idempotente). */
export function aplicarFuenteBase() {
  if (aplicado) return;
  parchar(RNText);
  parchar(RNTextInput);
  aplicado = true;
}
