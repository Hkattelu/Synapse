export const FLAGS = {
  ADVANCED_UI: (import.meta as any).env?.VITE_FEATURE_ADVANCED_UI === 'true',
  SHOW_FPS: (import.meta as any).env?.VITE_SHOW_FPS === 'true',
};

export type FlagKey = keyof typeof FLAGS;

export function isEnabled(flag: FlagKey): boolean {
  return !!FLAGS[flag];
}

