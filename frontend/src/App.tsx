import { useState, useEffect, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { open, save } from '@tauri-apps/plugin-dialog'
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs'
import { 
  Undo2, 
  Redo2, 
  Play, 
  Calendar, 
  BookOpen, 
  Monitor, 
  Terminal,
  PanelLeft,
  PanelBottom,
  PanelRight,
  User,
  Settings,
  LogIn,
  Package
} from 'lucide-react'
import './App.css'
import BlocklyEditor, { type BlocklyEditorRef } from './components/BlocklyEditor'
import Home from './components/Home'
import { getModeConfig } from './modes'
import { extensionManager } from './services/ExtensionManager'
import ExtensionManagerDialog from './components/ExtensionManagerDialog'
import { ModeProvider, useModeState } from './context/ModeContext'

const AppContent = () => {
  const [mode, setMode] = useState<'home' | 'python' | 'arduino'>('home');
  const [code, setCode] = useState('');
  const [showCode, setShowCode] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showBottomPanel, setShowBottomPanel] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const outputRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<BlocklyEditorRef>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
  const [extensionsLoaded, setExtensionsLoaded] = useState(false);
  const modeConfig = getModeConfig(mode);
  
  // Mode state from context
  const { output, setOutput, ...modeState } = useModeState();

  // -- Environment Initialization --
  useEffect(() => {
    if (mode !== 'home') {
        // Eagerly ensure environment for the selected mode
        invoke('ensure_environment', { platform: mode })
            .then((msg) => console.log(`[Env] ${msg}`))
            .catch((err) => console.error(`[Env] Init failed: ${err}`));
    }
  }, [mode]);

  useEffect(() => {
    // Load extensions on startup
    const initExtensions = async () => {
      await extensionManager.loadExtensions();
      setExtensionsLoaded(true);
    };
    initExtensions();
    
    // -- Mode-Specific Initialization (Listeners, etc.) --
    let modeCleanup: any = null;
    
    if (modeConfig.onInitialize) {
      const result = modeConfig.onInitialize({ ...modeState, setOutput });
      if (result instanceof Promise) {
        result.then(cleanup => { modeCleanup = cleanup; });
      } else {
        modeCleanup = result;
      }
    }

    // -- Global Menu Event Listeners --
    const unlistenOpen = listen('menu-open', () => handleOpenFile());
    const unlistenSave = listen('menu-save', () => handleSaveFile());
    const unlistenSaveAs = listen('menu-save-as', () => handleSaveAsFile());
    const unlistenUndo = listen('menu-undo', () => editorRef.current?.undo());
    const unlistenRedo = listen('menu-redo', () => editorRef.current?.redo());

    // Cleanup listeners on unmount or mode change
    return () => {
      if (modeCleanup) modeCleanup();
      unlistenOpen.then(f => f());
      unlistenSave.then(f => f());
      unlistenSaveAs.then(f => f());
      unlistenUndo.then(f => f());
      unlistenRedo.then(f => f());
    };
  }, [mode]); // Only depend on mode for re-init

  // File Operations
  const handleOpenFile = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: 'Blockly Project', extensions: ['xml'] }]
      });
      if (selected && typeof selected === 'string') {
        const content = await readTextFile(selected);
        editorRef.current?.loadWorkspaceXml(content);
        setCurrentFilePath(selected);
        setOutput(prev => prev + `>>> Opened: ${selected}\n`);
      }
    } catch (e) {
      setOutput(prev => prev + `Open failed: ${e}\n`);
    }
  };

  const handleSaveFile = async () => {
    try {
      const xml = editorRef.current?.getWorkspaceXml() || '';
      let filePath = currentFilePath;
      if (!filePath) {
        filePath = await save({
          filters: [{ name: 'Blockly Project', extensions: ['xml'] }]
        });
      }
      if (filePath) {
        await writeTextFile(filePath, xml);
        setCurrentFilePath(filePath);
        setOutput(prev => prev + `>>> Saved: ${filePath}\n`);
      }
    } catch (e) {
      setOutput(prev => prev + `Save failed: ${e}\n`);
    }
  };

  const handleSaveAsFile = async () => {
    try {
      const xml = editorRef.current?.getWorkspaceXml() || '';
      const filePath = await save({
        filters: [{ name: 'Blockly Project', extensions: ['xml'] }]
      });
      if (filePath) {
        await writeTextFile(filePath, xml);
        setCurrentFilePath(filePath);
        setOutput(prev => prev + `>>> Saved: ${filePath}\n`);
      }
    } catch (e) {
      setOutput(prev => prev + `Save As failed: ${e}\n`);
    }
  };


  // Extension Dialog State
  const [showExtensionDialog, setShowExtensionDialog] = useState(false);

  const handleOpenExtensionManager = () => {
    setShowExtensionDialog(true);
    setShowUserMenu(false);
  };

  if (mode === 'home') {
    return <Home onSelectLanguage={(lang) => setMode(lang as any)} />;
  }

  const ToolbarExtra = modeConfig.ToolbarExtra;

  return (
    <div className="ide-layout">
      <header className="ide-navbar">
        <div className="nav-left">
          <div className="nav-item" onClick={() => setMode('home')}>
            <strong style={{ fontSize: '18px', color: 'var(--primary-color)' }}>HanX Blockly</strong>
          </div>
          <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 8px' }} />
          {ToolbarExtra ? (
            <ToolbarExtra 
              isRunning={isRunning} 
              setIsRunning={setIsRunning}
              setOutput={setOutput}
              code={code}
              libs={extensionManager.getLibraryPaths(mode)}
              modeConfig={modeConfig}
              modeState={{ ...modeState, output, setOutput }}
              onUndo={() => editorRef.current?.undo()}
              onRedo={() => editorRef.current?.redo()}
            />
          ) : (
            <>
              <div className="nav-item" onClick={() => editorRef.current?.undo()}><Undo2 size={18} /> 撤销</div>
              <div className="nav-item" onClick={() => editorRef.current?.redo()}><Redo2 size={18} /> 重做</div>
              <div className="nav-item active" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                <Play size={18} /> 运行
              </div>
            </>
          )}
        </div>
        <div className="nav-center">{modeConfig.label} 编程模式</div>
        <div className="nav-right">
          {/* <div className="nav-item"><Calendar size={18} /></div>
          <div className="nav-item"><BookOpen size={18} /></div>
          <div className="nav-item"><Monitor size={18} /></div> */}
          <div style={{ width: '1px', height: '20px', background: 'var(--border-color)', margin: '0 8px' }} />
          <div className={`nav-item ${showSidebar ? 'active' : ''}`} onClick={() => setShowSidebar(!showSidebar)} title="Toggle Sidebar"><PanelLeft size={18} /></div>
          <div className={`nav-item ${showBottomPanel ? 'active' : ''}`} onClick={() => setShowBottomPanel(!showBottomPanel)} title="Toggle Panel"><PanelBottom size={18} /></div>
          <div className={`nav-item ${showCode ? 'active' : ''}`} onClick={() => setShowCode(!showCode)} title="Toggle Code View"><PanelRight size={18} /></div>
          <div style={{ width: '1px', height: '20px', background: 'var(--border-color)', margin: '0 8px' }} />
          <div className={`nav-item ${showUserMenu ? 'active' : ''}`} style={{ position: 'relative' }} onClick={() => setShowUserMenu(!showUserMenu)}>
             <User size={18} />
             {showUserMenu && (
               <div className="dropdown-menu">
                 <div className="dropdown-item"><LogIn size={14} /> 登录</div>
                 <div className="dropdown-item" onClick={handleOpenExtensionManager}><Package size={14} /> 管理组件</div>
                 <div className="dropdown-item"><Settings size={14} /> 设置</div>
               </div>
             )}
          </div>
        </div>
      </header>
      <main className="ide-main">
        <div className="workspace-container">
          <BlocklyEditor ref={editorRef} onCodeChange={setCode} isCodeOpen={showCode} showSidebar={showSidebar} modeConfig={modeConfig} extensionsLoaded={extensionsLoaded} />
        </div>
        <div className="bottom-panel" style={{ display: showBottomPanel ? 'flex' : 'none', height: showBottomPanel ? '200px' : '0' }}>
          {modeConfig.BottomPanel ? <modeConfig.BottomPanel /> : (
            <>
              <div className="panel-header"><Terminal size={14} style={{ marginRight: '8px' }} /> 控制台输出</div>
              <div className="panel-content" ref={outputRef}>{output || '等待运行...'}</div>
            </>
          )}
        </div>
      </main>
      <footer className="ide-statusbar">
        <div className="status-left"><div className="nav-item" style={{ color: 'white', padding: '0' }}><Calendar size={14} /> 准备就绪</div></div>
        <div className="status-right"><span>&lt;/&gt; {modeConfig.name}</span><span>⬛ {modeConfig.label}</span><div className="nav-item" style={{ color: 'white', padding: '0' }}><Terminal size={14} /> 消息</div></div>
      </footer>
      <ExtensionManagerDialog isOpen={showExtensionDialog} onClose={() => { setShowExtensionDialog(false); setExtensionsLoaded(false); setTimeout(() => { extensionManager.loadExtensions().then(() => setExtensionsLoaded(true)); }, 1000); }} currentMode={mode} />
    </div>
  );
};

const App = () => (
  <ModeProvider>
    <AppContent />
  </ModeProvider>
);


export default App
