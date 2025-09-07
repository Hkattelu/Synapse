export const FLAGS = {
  // Treat the string 'true' as enabled; anything else (including undefined) is disabled
  ADVANCED_UI: (import.meta.env.VITE_FEATURE_ADVANCED_UI ?? '') === 'true',
  SHOW_FPS: (import.meta.env.VITE_SHOW_FPS ?? '') === 'true',
  PRODUCT_HUNT: (import.meta.env.VITE_FEATURE_PRODUCT_HUNT ?? '') === 'true',
} as const;

export type FlagKey = keyof typeof FLAGS;

export function isEnabled(flag: FlagKey): boolean {
  return !!FLAGS[flag];
}
