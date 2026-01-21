import type { IModeConfig } from './types';

// Automatically import all mode configurations from subdirectories
// We look for index.tsx files within each mode folder
const modeModules = import.meta.glob('./*/index.tsx', { eager: true });

export const modes: Record<string, IModeConfig> = {};

Object.entries(modeModules).forEach(([path, module]: [string, any]) => {
  const config = module.config || module.default;
  if (config && config.id) {
    modes[config.id] = config;
    console.log(`[Modes] Auto-loaded mode: ${config.label} (${config.id}) from ${path}`);
  }
});

export const getModeConfig = (modeId: string): IModeConfig => {
  return modes[modeId] || Object.values(modes)[0]; // Fallback to first available mode
};

export const getAllModes = (): IModeConfig[] => {
  return Object.values(modes);
};
