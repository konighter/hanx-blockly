import React from 'react';

export interface ToolbarItemProps {
  isRunning: boolean;
  setIsRunning: (isRunning: boolean) => void;
  setOutput: React.Dispatch<React.SetStateAction<string>>;
  code: string;
  libs: string[];
  modeConfig: IModeConfig;
  modeState: any;
  onUndo: () => void;
  onRedo: () => void;
  // Optional handlers if the shell still provides defaults
  onRun?: () => void;
  onStop?: () => void;
  onCompile?: () => void;
}

export interface IModeConfig {
  id: string;
  name: string;
  label: string;
  toolbox: any; // Blockly Toolbox Definition
  initGenerator: () => any; // Function to retrieve/init generator
  onRun: (code: string, libs: string[], context?: any) => Promise<void>;
  onStop: () => Promise<void>;
  onCompile?: (code: string, libs: string[], context?: any) => Promise<void>;
  onInitialize?: (context: any) => (() => void) | void | Promise<(() => void) | void>;
  ToolbarExtra?: React.FC<ToolbarItemProps>;
  BottomPanel?: React.FC;
}
