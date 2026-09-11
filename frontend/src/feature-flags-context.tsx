import { createContext, useContext } from 'react';

export interface FeatureFlagsContextValue {
  /** antroId -> lista de códigos de feature activos para ese antro. */
  featuresPorAntro: Record<string, string[]>;
}

export const FeatureFlagsContext = createContext<FeatureFlagsContextValue>({
  featuresPorAntro: {},
});

export function useFeatureFlags(): FeatureFlagsContextValue {
  return useContext(FeatureFlagsContext);
}

/** ¿Está activa `codigo` para `antroId`? Útil para gatear un pedazo de UI a la medida de un antro. */
export function useTieneFeature(antroId: string | null | undefined, codigo: string): boolean {
  const { featuresPorAntro } = useFeatureFlags();
  if (!antroId) return false;
  return featuresPorAntro[antroId]?.includes(codigo) ?? false;
}
