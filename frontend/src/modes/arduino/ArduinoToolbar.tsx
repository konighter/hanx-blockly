import React, { useEffect, useState } from 'react';
import { Play, Undo2, Redo2, Cpu, Zap, Activity } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import type { ToolbarItemProps } from '../types';
import CustomSelect, { type SelectOption } from '../../components/CustomSelect';
import { useModeState } from '../../context/ModeContext';

export const ArduinoToolbar: React.FC<ToolbarItemProps> = ({ 
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
  const { selectedPort, setSelectedPort, selectedBoard, setSelectedBoard } = useModeState();
  const [ports, setPorts] = useState<SelectOption[]>([]);
  const defaultBoards = [
    { value: 'arduino:avr:uno', label: 'Arduino Uno', icon: <Cpu size={14} /> },
    { value: 'arduino:avr:nano', label: 'Arduino Nano', icon: <Cpu size={14} /> },
    { value: 'arduino:avr:mega', label: 'Arduino Mega', icon: <Cpu size={14} /> },
  ];
  const [boards, setBoards] = useState<SelectOption[]>(defaultBoards);

  const handleCompile = async () => {
    if (!modeConfig?.onCompile) return;
    setOutput(`>>> Compiling ${modeConfig.label}...\n`);
    setIsRunning(true);
    try {
      await modeConfig.onCompile(code, libs, modeState);
    } catch (e) {
      setOutput(prev => prev + `Compilation failed: ${e}\n`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleUpload = async () => {
    setOutput(`>>> Sending ${modeConfig.label} code to hardware...\n`);
    setIsRunning(true);
    try {
      await modeConfig.onRun(code, libs, modeState);
    } catch (e) {
      setOutput(prev => prev + `Upload failed: ${e}\n`);
      setIsRunning(false);
    }
  };


  const refreshPorts = async () => {
    try {
      // 1. Get raw ports (existing logic)
      const availablePorts: any[] = await invoke('list_ports');
      const newPortsList = availablePorts.map(p => p.port_name).sort().join(',');
      
      setPorts(prev => {
        const currentPortsList = prev.map(p => p.value).sort().join(',');
        if (newPortsList === currentPortsList) return prev;
        
        return availablePorts.map(p => ({
          value: p.port_name,
          label: p.port_name,
          icon: <Activity size={14} />
        }));
      });

      // 2. Arduino-specific board discovery
      const detectedBoards: any[] = await invoke('discover_arduino_boards');
      
      const newBoardOptions = [...defaultBoards];
      let firstValid: any = null;

      if (detectedBoards && detectedBoards.length > 0) {
        detectedBoards.forEach(b => {
          if (b.fqbn) {
            // Add to options if not already present (case insensitive check)
            if (!newBoardOptions.find(opt => opt.value.toLowerCase() === b.fqbn.toLowerCase())) {
              newBoardOptions.push({
                value: b.fqbn,
                label: b.board_name || b.label || b.fqbn,
                icon: <Cpu size={14} />
              });
            }
            if (!firstValid) firstValid = b;
          }
        });
      }

      setBoards(newBoardOptions);

      if (firstValid) {
        // Auto-select Board: 
        // Only if currently using the generic 'uno' or nothing, and we found a concrete physical match
        const isGenericUno = selectedBoard === 'arduino:avr:uno';
        if (!selectedBoard || (isGenericUno && firstValid.fqbn !== 'arduino:avr:uno')) {
           setSelectedBoard(firstValid.fqbn);
        }
        
        // Auto-select Port:
        // Only if no port selected
        if (!selectedPort) {
           setSelectedPort(firstValid.port);
        }
      }
    } catch (e) {
      console.error("Failed to list ports or boards:", e);
    }
  };

  useEffect(() => {
    refreshPorts();
    const timer = setInterval(refreshPorts, 5000);
    return () => clearInterval(timer);
  }, []);

  // Auto-select first port if none selected (fallback)
  useEffect(() => {
    if (ports.length > 0 && !selectedPort) {
      setSelectedPort(ports[0].value);
    }
  }, [ports, selectedPort]);

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
        onClick={handleCompile}
        style={{ 
          color: !isRunning ? 'var(--primary-color)' : '',
          backgroundColor: !isRunning ? 'rgba(0, 139, 139, 0.1)' : ''
        }}
        title="验证/编译"
      >
        <Zap size={18} fill={!isRunning ? "currentColor" : "none"} /> 编译
      </div>
      
      <div 
        className={`nav-item ${!isRunning ? 'active' : ''}`} 
        onClick={handleUpload}
        style={{ 
          color: !isRunning ? '#0ea5e9' : '',
          backgroundColor: !isRunning ? 'rgba(14, 165, 233, 0.1)' : ''
        }}
        title="烧录/上传"
      >
        <Play size={18} fill={!isRunning ? "currentColor" : "none"} /> 上传
      </div>

      <div style={{ width: '1px', height: '20px', background: 'var(--border-color)', margin: '0 8px' }} />

      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          paddingLeft: '8px',
          flexShrink: 0
        }}
      >
        <div style={{ width: '180px', flexShrink: 0 }}>
          <CustomSelect 
            options={boards}
            value={selectedBoard}
            onChange={setSelectedBoard}
            icon={<Cpu size={14} />}
            placeholder="选择开发板"
          />
        </div>
        <div style={{ width: '200px', flexShrink: 0 }}>
          <CustomSelect 
            options={ports}
            value={selectedPort}
            onChange={setSelectedPort}
            icon={<Activity size={14} />}
            placeholder="选择串口"
          />
        </div>
      </div>
    </>
  );
};
