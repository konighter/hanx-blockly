import React from 'react';
import { Play, Square, Undo2, Redo2 } from 'lucide-react';
import type { ToolbarItemProps } from '../types';

export const PythonToolbar: React.FC<ToolbarItemProps> = ({ 
  isRunning, 
  setIsRunning,
  setOutput,
  code,
  libs,
  modeConfig,
  modeState,
  onUndo, 
  onRedo 
}) => {
  const handleRun = async () => {
    setOutput(`>>> Starting Python execution...\n`);
    setIsRunning(true);
    try {
      await modeConfig.onRun(code, libs, modeState);
    } catch (e) {
      setOutput(prev => prev + `Execution failed: ${e}\n`);
      setIsRunning(false);
    }
  };

  const handleStop = async () => {
    try {
      await modeConfig.onStop();
      setOutput(prev => prev + '\n>>> Execution stopped.\n');
      setIsRunning(false);
    } catch (e) {
      setOutput(prev => prev + `Stop failed: ${e}\n`);
    }
  };

  return (
    <>
      <div className="nav-item" onClick={onUndo} title="撤销">
        <Undo2 size={18} />
      </div>
      <div className="nav-item" onClick={onRedo} title="重做">
        <Redo2 size={18} />
      </div>
      
      <div style={{ width: '1px', height: '20px', background: 'var(--border-color)', margin: '0 4px' }} />
      
      <div 
        className={`nav-item ${!isRunning ? 'active' : ''}`} 
        onClick={handleRun}
        style={{ 
          color: !isRunning ? 'var(--primary-color)' : '',
          backgroundColor: !isRunning ? 'rgba(0, 139, 139, 0.1)' : ''
        }}
      >
        <Play size={18} fill={!isRunning ? "currentColor" : "none"} /> 运行
      </div>
      
      <div 
        className={`nav-item ${isRunning ? 'active' : ''}`} 
        onClick={handleStop}
        style={{ 
          color: isRunning ? '#f43f5e' : '',
          backgroundColor: isRunning ? 'rgba(244, 63, 94, 0.1)' : ''
        }}
      >
        <Square size={18} fill={isRunning ? "currentColor" : "none"} /> 停止
      </div>
    </>
  );
};
