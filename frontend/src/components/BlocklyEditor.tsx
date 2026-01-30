import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import * as Blockly from 'blockly';
import 'blockly/blocks';
import * as Zh from 'blockly/msg/zh-hans';
import { ask, message } from '@tauri-apps/plugin-dialog';
import { Copy, Check, Sparkles, Code2 } from 'lucide-react';
import CodeMirror from '@uiw/react-codemirror';
import { cpp } from '@codemirror/lang-cpp';
import type { IModeConfig } from '../modes/types';
import AiGeneratorChat from './AiGeneratorChat';
import SettingsDrawer from './SettingsDrawer';
import { Settings } from 'lucide-react';

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
    
    // Resize State
    const [rightPanelWidth, setRightPanelWidth] = useState(350);
    const isResizingRight = useRef(false);
    const startResizingX = useRef(0);
    const startWidth = useRef(350);
    const [isCopied, setIsCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<'code' | 'ai'>('code');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
             setGeneratedCode("// Error generating code:\n// " + (e instanceof Error ? e.message : String(e)));
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

    // Resize Handlers for Code View
    useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
        if (isResizingRight.current) {
          const delta = startResizingX.current - e.clientX; // Dragging left increases width
          const newWidth = startWidth.current + delta;
          const maxWidth = window.innerWidth * 0.33; // Max 1/3 width
          const minWidth = 200;
          
          if (newWidth >= minWidth && newWidth <= maxWidth) {
            setRightPanelWidth(newWidth);
          }
        }
      };
  
      const handleMouseUp = () => {
        isResizingRight.current = false;
        document.body.style.cursor = 'default';
        // Resize blockly workspace when panel size changes
        if (workspaceRef.current) {
           Blockly.svgResize(workspaceRef.current);
        }
      };
  
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
  
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
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

    const handleCopyCode = async () => {
      try {
        await navigator.clipboard.writeText(generatedCode);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy code:', err);
      }
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
          width: isCodeOpen ? `${rightPanelWidth}px` : '0px', 
          display: isCodeOpen ? 'flex' : 'none', 
          flexDirection: 'row',
          borderLeft: '1px solid var(--border-color)',
          backgroundColor: '#f8fafc',
          position: 'relative',
          transition: isResizingRight.current ? 'none' : 'width 0.3s ease' // Disable transition during drag
        }}>
          {/* Resize Handle */}
          <div 
             style={{
               position: 'absolute',
               left: -4,
               top: 0,
               bottom: 0,
               width: '8px',
               cursor: 'col-resize',
               zIndex: 10,
               backgroundColor: 'transparent'
             }}
             onMouseDown={(e) => {
               isResizingRight.current = true;
               startResizingX.current = e.clientX;
               startWidth.current = rightPanelWidth;
               document.body.style.cursor = 'col-resize';
               e.preventDefault();
             }}
          />
          {/* Content Area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
             {activeTab === 'code' ? (
                <>
                  <div style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'white'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>代码预览</span>
                    </div>
                    <button
                      onClick={handleCopyCode}
                      title="复制代码"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        fontSize: '12px',
                        color: isCopied ? '#10b981' : 'var(--text-main)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {isCopied ? <Check size={14} /> : <Copy size={14} />}
                      {isCopied ? '已复制' : '复制'}
                    </button>
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <CodeMirror
                      value={generatedCode || '// 等待编写代码...'}
                      height="100%"
                      theme="light"
                      extensions={[cpp()]}
                      readOnly={true}
                      basicSetup={{
                        lineNumbers: true,
                        foldGutter: true,
                        highlightActiveLine: false,
                      }}
                      style={{ fontSize: '13px', height: '100%' }}
                    />
                  </div>
                </>
             ) : (
                <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'white', fontWeight: 600, color: '#9333ea', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={16} />
                    AI 智能助手
                  </div>
                  <div style={{ flex: 1, padding: '0', overflow: 'hidden' }}>
                    <AiGeneratorChat workspace={workspaceRef.current} />
                  </div>
                </div>
             )}
          </div>

          {/* Right Vertical Tabs */}
          <div style={{ 
            width: '48px', 
            borderLeft: '1px solid var(--border-color)', 
            backgroundColor: 'white',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: '12px',
            gap: '8px'
          }}>
             <button
                onClick={() => setActiveTab('code')}
                title="代码预览"
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: activeTab === 'code' ? 'white' : '#64748b',
                  background: activeTab === 'code' ? 'linear-gradient(135deg, #0d9488, #0f766e)' : 'transparent',
                  border: activeTab === 'code' ? 'none' : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: activeTab === 'code' ? '0 4px 6px -1px rgba(13, 148, 136, 0.3)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'code') e.currentTarget.style.backgroundColor = '#f1f5f9';
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'code') e.currentTarget.style.backgroundColor = 'transparent';
                }}
             >
               <Code2 size={22} strokeWidth={activeTab === 'code' ? 2.5 : 2} />
             </button>
             <button
                onClick={() => setActiveTab('ai')}
                title="AI 助手"
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: activeTab === 'ai' ? 'white' : '#64748b',
                  background: activeTab === 'ai' ? 'linear-gradient(135deg, #7c3aed, #db2777)' : 'transparent',
                  border: activeTab === 'ai' ? 'none' : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: activeTab === 'ai' ? '0 4px 6px -1px rgba(124, 58, 237, 0.3)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'ai') e.currentTarget.style.backgroundColor = '#f1f5f9';
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'ai') e.currentTarget.style.backgroundColor = 'transparent';
                }}
             >
               <Sparkles size={22} strokeWidth={activeTab === 'ai' ? 2.5 : 2} />
             </button>
             
             <div style={{ width: '32px', height: '1px', backgroundColor: '#e2e8f0', margin: '4px 0' }} />

             <button
                onClick={() => setIsSettingsOpen(true)}
                title="设置"
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                  background: 'transparent',
                  border: '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
             >
               <Settings size={22} strokeWidth={2} />
             </button>
          </div>
        </div>

        <SettingsDrawer 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
        />

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
