import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import * as Blockly from 'blockly';
import 'blockly/blocks';
import * as Zh from 'blockly/msg/zh-hans';
import { ask, message } from '@tauri-apps/plugin-dialog';
import type { IModeConfig } from '../modes/types';

import { extensionManager } from '../services/ExtensionManager';

// @ts-ignore
Blockly.setLocale(Zh.default || Zh);

// Set custom dialogs for Tauri compatibility
Blockly.dialog.setAlert((msg, callback) => {
    message(msg).then(callback);
});

Blockly.dialog.setConfirm((msg, callback) => {
    ask(msg).then(callback);
});

interface BlocklyEditorProps {
  onCodeChange?: (code: string) => void;
  isCodeOpen: boolean;
  showSidebar: boolean;
  modeConfig: IModeConfig;
  extensionsLoaded: boolean;
}

// Public API exposed via ref
export interface BlocklyEditorRef {
  undo: () => void;
  redo: () => void;
  getWorkspaceXml: () => string;
  loadWorkspaceXml: (xml: string) => void;
  clearWorkspace: () => void;
}

const BlocklyEditor = forwardRef<BlocklyEditorRef, BlocklyEditorProps>(
  ({ onCodeChange, isCodeOpen, showSidebar, modeConfig, extensionsLoaded }, ref) => {
    const blocklyRef = useRef<HTMLDivElement>(null);
    const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
    const generatorRef = useRef<any>(null);
    const [generatedCode, setGeneratedCode] = useState('');

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
      undo: () => {
        if (workspaceRef.current) {
          workspaceRef.current.undo(false);
        }
      },
      redo: () => {
        if (workspaceRef.current) {
          workspaceRef.current.undo(true);
        }
      },
      getWorkspaceXml: () => {
        if (workspaceRef.current) {
          const dom = Blockly.Xml.workspaceToDom(workspaceRef.current);
          return Blockly.Xml.domToText(dom);
        }
        return '';
      },
      loadWorkspaceXml: (xml: string) => {
        if (workspaceRef.current) {
          workspaceRef.current.clear();
          const dom = Blockly.utils.xml.textToDom(xml);
          Blockly.Xml.domToWorkspace(dom, workspaceRef.current);
        }
      },
      clearWorkspace: () => {
        if (workspaceRef.current) {
          workspaceRef.current.clear();
        }
      }
    }));

    // Handle Sidebar Visibility
    useEffect(() => {
      if (workspaceRef.current) {
        const toolboxDiv = workspaceRef.current.getInjectionDiv().querySelector('.blocklyToolboxDiv') as HTMLElement;
        if (toolboxDiv) {
          toolboxDiv.style.display = showSidebar ? 'block' : 'none';
          Blockly.svgResize(workspaceRef.current);
        }
      }
    }, [showSidebar]);

    useEffect(() => {
      if (!blocklyRef.current || !extensionsLoaded) return;

      // Initialize Generator and Custom Blocks for the mode
      generatorRef.current = modeConfig.initGenerator();

      // Dispose existing workspace if any (to handle mode switch or extension reload)
      if (workspaceRef.current) {
        workspaceRef.current.dispose();
      }
      
      workspaceRef.current = Blockly.inject(blocklyRef.current, {
        toolbox: modeConfig.toolbox,
        grid: { spacing: 20, length: 3, colour: '#ccc', snap: true },
        zoom: { controls: true, wheel: true, startScale: 1.0, maxScale: 3, minScale: 0.3, scaleSpeed: 1.2 },
        trashcan: true,
        renderer: 'zelos', 
      });

      // -- Load Dynamic Extensions --
      extensionManager.registerExtensions(generatorRef.current, modeConfig.id);
      
      // Merge Dynamic Toolbox
      const dynamicItems = extensionManager.getToolboxItems(modeConfig.id);
      if (dynamicItems.length > 0) {
        const currentToolbox = { ...modeConfig.toolbox };
        currentToolbox.contents = [...currentToolbox.contents, ...dynamicItems];
        workspaceRef.current.updateToolbox(currentToolbox);
      }

      // Initial resize
      Blockly.svgResize(workspaceRef.current);

      workspaceRef.current.addChangeListener(() => {
        if (workspaceRef.current && generatorRef.current) {
           try {
             const code = generatorRef.current.workspaceToCode(workspaceRef.current);
             setGeneratedCode(code);
             if (onCodeChange) {
               onCodeChange(code);
             }
           } catch (e) {
             console.error("Code generation error:", e);
             setGeneratedCode("// Error generating code");
           }
        }
      });

      // Handle resizing using ResizeObserver
      const resizeObserver = new ResizeObserver((_) => {
        window.requestAnimationFrame(() => {
          if (workspaceRef.current) {
            Blockly.svgResize(workspaceRef.current);
          }
        });
      });
      
      resizeObserver.observe(blocklyRef.current);

      return () => {
        resizeObserver.disconnect();
        if (workspaceRef.current) {
          workspaceRef.current.dispose();
          workspaceRef.current = null;
        }
      };
    }, [modeConfig, extensionsLoaded]); // Re-run when modeConfig or extensions change

    // -- Custom Prompt State --
    const [promptState, setPromptState] = useState<{
      isOpen: boolean;
      message: string;
      defaultValue: string;
      callback: (result: string | null) => void;
    }>({
      isOpen: false,
      message: '',
      defaultValue: '',
      callback: () => {},
    });

    useEffect(() => {
      // Overwrite the prompt dialog globally to use our React modal
      Blockly.dialog.setPrompt((message, defaultValue, callback) => {
        setPromptState({
          isOpen: true,
          message,
          defaultValue,
          callback,
        });
      });
    }, []);

    const handlePromptConfirm = (value: string) => {
      const { callback } = promptState;
      setPromptState(prev => ({ ...prev, isOpen: false }));
      callback(value);
    };

    const handlePromptCancel = () => {
      const { callback } = promptState;
      setPromptState(prev => ({ ...prev, isOpen: false }));
      callback(null);
    };

    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <div 
            ref={blocklyRef} 
            style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0 
            }} 
          />
        </div>
        
        {/* Generated Code Preview */}
        <div className="preview-panel" style={{ 
          width: isCodeOpen ? '350px' : '0px', 
          display: isCodeOpen ? 'flex' : 'none', 
          flexDirection: 'column',
          borderLeft: '1px solid var(--border-color)',
          backgroundColor: '#f8fafc',
          transition: 'width 0.3s ease'
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--border-color)',
            fontWeight: '600',
            color: 'var(--text-muted)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'white'
          }}>
            <span>生成的代码</span>
            <span style={{ fontSize: '10px', padding: '2px 6px', background: '#e2e8f0', borderRadius: '4px' }}>
              {modeConfig.label}
            </span>
          </div>
          <pre style={{ 
            margin: 0, 
            padding: '16px', 
            flex: 1, 
            overflow: 'auto', 
            fontFamily: "'Fira Code', monospace", 
            fontSize: '13px',
            lineHeight: '1.6',
            color: '#334155'
          }}>
            {generatedCode || '# 等待编写代码...'}
          </pre>
        </div>

        {/* Custom Prompt Modal */}
        {promptState.isOpen && (
          <PromptModal 
            message={promptState.message} 
            defaultValue={promptState.defaultValue} 
            onConfirm={handlePromptConfirm} 
            onCancel={handlePromptCancel} 
          />
        )}
      </div>
    );
  }
);

interface PromptModalProps {
  message: string;
  defaultValue: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

const PromptModal = ({ message, defaultValue, onConfirm, onCancel }: PromptModalProps) => {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 className="modal-title">{message}</h3>
        <input 
          ref={inputRef}
          type="text" 
          value={value} 
          onChange={(e) => setValue(e.target.value)} 
          className="modal-input"
          onKeyDown={(e) => {
            if (e.key === 'Enter') onConfirm(value);
            if (e.key === 'Escape') onCancel();
          }}
        />
        <div className="modal-buttons">
          <button onClick={onCancel} className="modal-btn secondary">取消</button>
          <button onClick={() => onConfirm(value)} className="modal-btn primary">确定</button>
        </div>
      </div>
    </div>
  );
};

export default BlocklyEditor;
