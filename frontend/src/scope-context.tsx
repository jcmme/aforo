import { createContext, useContext } from 'react';
import { Antro } from './api';

export type Alcance = 'corporativo' | 'antro' | 'rp';

export interface AlcanceContextValue {
  antros: Antro[];
  alcance: Alcance;
  antroFiltro: string | null;
  setAntroFiltro: (id: string | null) => void;
}

export const AlcanceContext = createContext<AlcanceContextValue>({
  antros: [],
  alcance: 'antro',
  antroFiltro: null,
  setAntroFiltro: () => {},
});

/** Alcance del usuario actual: cuántos antros ve determina si es vista corporativa o de un solo antro. */
export function useAlcance(): AlcanceContextValue {
  return useContext(AlcanceContext);
}
