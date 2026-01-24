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
    console.log('%c[ExtensionManager] 开始加载扩展...', 'color: #4CAF50; font-weight: bold');
    try {
      this.extensions = await invoke<ExtensionData[]>('list_extensions');
      console.log('%c[ExtensionManager] 已加载扩展列表:', 'color: #4CAF50', this.extensions.length, '个');
      this.extensions.forEach(ext => {
        console.log(`  📦 ${ext.metadata.name} (${ext.metadata.id}) - 平台: ${ext.metadata.platform}`);
        console.log(`     - 积木数量: ${ext.blocks ? (Array.isArray(ext.blocks) ? ext.blocks.length : 'N/A') : 0}`);
        console.log(`     - 生成器: ${ext.generator ? '✓' : '✗'}`);
      });
      return this.extensions;
    } catch (error) {
      console.error('%c[ExtensionManager] 加载扩展失败:', 'color: #F44336', error);
      return [];
    }
  }

  async prepareExtensions(platform: string): Promise<void> {
    console.log(`%c[ExtensionManager] 准备 ${platform} 平台扩展依赖...`, 'color: #2196F3; font-weight: bold');
    try {
      await invoke('install_extension_dependencies', { platform });
      console.log(`%c[ExtensionManager] ${platform} 平台依赖安装完成`, 'color: #4CAF50');
    } catch (error) {
      console.error(`%c[ExtensionManager] ${platform} 平台依赖安装失败:`, 'color: #F44336', error);
      // We still continue as some extensions might work without dependencies
    }
  }

  registerExtensions(generator: any, platform: string) {
    const platformExtensions = this.extensions.filter(ext => ext.metadata.platform === platform);
    console.log(`%c[ExtensionManager] 注册 ${platform} 平台扩展:`, 'color: #9C27B0; font-weight: bold', platformExtensions.length, '个');
    
    platformExtensions.forEach(ext => {
      console.log(`  🔧 注册扩展: ${ext.metadata.name}`);
      
      // 1. Register Blocks
      if (ext.blocks) {
        const blockCount = Array.isArray(ext.blocks) ? ext.blocks.length : 0;
        Blockly.defineBlocksWithJsonArray(ext.blocks);
        console.log(`     ✓ 已注册 ${blockCount} 个积木块`);
      }

      // 2. Register Generators
      if (ext.generator) {
        try {
          // Wrapped in a function context to provide 'generator' and 'Blockly'
          const registerFn = new Function('generator', 'Blockly', ext.generator);
          registerFn(generator, Blockly);
          console.log(`     ✓ 已注册代码生成器`);
        } catch (error) {
          console.error(`     ✗ 代码生成器注册失败:`, error);
        }
      }
    });
    console.log(`%c[ExtensionManager] ${platform} 平台扩展注册完成`, 'color: #4CAF50');
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
