import * as Blockly from 'blockly';
import { invoke } from '@tauri-apps/api/core';

export interface ExtensionMetadata {
  id: string;
  name: string;
  platform: string;
  author?: string;
  version?: string;
  toolbox: any[];
}

export interface ExtensionData {
  metadata: ExtensionMetadata;
  blocks: any[] | null;
  generator: string | null;
  python_lib_path: string | null;
  arduino_lib_path: string | null;
  updated_at?: number;
}

class ExtensionManager {
  private extensions: ExtensionData[] = [];
  
  async loadExtensions(): Promise<ExtensionData[]> {
    try {
      this.extensions = await invoke<ExtensionData[]>('list_extensions');
      console.log('Loaded extensions:', this.extensions);
      return this.extensions;
    } catch (error) {
      console.error('Failed to load extensions:', error);
      return [];
    }
  }

  registerExtensions(generator: any, platform: string) {
    const platformExtensions = this.extensions.filter(ext => ext.metadata.platform === platform);
    
    platformExtensions.forEach(ext => {
      // 1. Register Blocks
      if (ext.blocks) {
        Blockly.defineBlocksWithJsonArray(ext.blocks);
      }

      // 2. Register Generators
      if (ext.generator) {
        try {
          // Wrapped in a function context to provide 'generator' and 'Blockly'
          const registerFn = new Function('generator', 'Blockly', ext.generator);
          registerFn(generator, Blockly);
        } catch (error) {
          console.error(`Failed to register generator for extension ${ext.metadata.id}:`, error);
        }
      }
    });
  }

  getToolboxItems(platform: string): any[] {
    return this.extensions
      .filter(ext => ext.metadata.platform === platform)
      .flatMap(ext => ext.metadata.toolbox || []);
  }

  getLibraryPaths(platform: string): string[] {
    return this.extensions
      .filter(ext => ext.metadata.platform === platform)
      .map(ext => platform === 'python' ? ext.python_lib_path : ext.arduino_lib_path)
      .filter((path): path is string => path !== null);
  }

  async importExtension(zipPath: string): Promise<string> {
    const result = await invoke<string>('import_extension', { zipPath });
    // Reload extensions after import
    await this.loadExtensions();
    return result;
  }

  async deleteExtension(extensionId: string): Promise<string> {
    const result = await invoke<string>('delete_extension', { extensionId });
    // Reload extensions after delete
    await this.loadExtensions();
    return result;
  }
}

export const extensionManager = new ExtensionManager();
