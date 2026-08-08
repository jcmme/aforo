// Carga de tipografía y fuente base uniforme para TODA la app.
//
// UNA sola familia: Jost (la jerarquía va por peso, no por familias distintas).
// Para que TODO <Text> use Jost sin tocar las 40+ pantallas, se parcha una vez
// el render de Text/TextInput inyectando la familia base; los estilos
// explícitos (roles del tema, tamaños, colores) siguen ganando por orden.

import { cloneElement } from 'react';
import { StyleSheet, Text as RNText, TextInput as RNTextInput } from 'react-native';

import {
  Jost_300Light,
  Jost_400Regular,
  Jost_500Medium,
  Jost_600SemiBold,
} from '@expo-google-fonts/jost';

import { familias } from '@/theme';

/** Mapa para `useFonts` en el layout raíz. Una sola familia: Jost. */
export const fuentesAforo = {
  Jost_300Light,
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
    // La familia base va primero y el estilo explícito gana. Se APLANA a un solo
    // objeto (StyleSheet.flatten) para no dejar arreglos anidados que
    // react-native-web no procesa (rompía con <Text> anidados con onPress).
    const style = StyleSheet.flatten([{ fontFamily: familias.sans }, el.props?.style]);
    return cloneElement(el, { style });
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
