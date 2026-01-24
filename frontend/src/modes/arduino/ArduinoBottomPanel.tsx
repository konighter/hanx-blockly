import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Activity, Trash2, CornerDownLeft, ScrollText } from 'lucide-react';
import { useModeState } from '../../context/ModeContext';
import { invoke } from '@tauri-apps/api/core';

export const ArduinoBottomPanel: React.FC = () => {
  const { 
    output, setOutput, 
    serialLog, setSerialLog, 
    selectedPort,
    baudRate, setBaudRate,
    isSerialOpen, setIsSerialOpen,
    activeBottomTab: activeTab, setActiveBottomTab: setActiveTab
  } = useModeState();
  
  const [inputMessage, setInputMessage] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [output, serialLog, activeTab, autoScroll]);

  const handleSendSerial = async () => {
    if (!inputMessage || !selectedPort) return;
    try {
      await invoke('write_serial', { port: selectedPort, data: inputMessage });
      setSerialLog(prev => prev + `> ${inputMessage}\n`);
      setInputMessage('');
    } catch (e) {
      setSerialLog(prev => prev + `[Error] Failed to send: ${e}\n`);
    }
  };

  const toggleSerial = async () => {
    if (!selectedPort) return;
    try {
      if (isSerialOpen) {
        await invoke('close_serial', { port: selectedPort });
        setIsSerialOpen(false);
        setSerialLog(prev => prev + `\n[System] Serial port closed.\n`);
      } else {
        await invoke('open_serial', { port: selectedPort, baudRate: parseInt(baudRate) });
        setIsSerialOpen(true);
        setSerialLog(prev => prev + `\n[System] Serial port opened at ${baudRate} baud.\n`);
      }
    } catch (e) {
      setSerialLog(prev => prev + `\n[Error] ${e}\n`);
    }
  };

  return (
    <div className="arduino-panel-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      <div className="panel-tabs" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '4px', 
        padding: '0 16px', 
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(10px)'
      }}>
        <div 
          className={`panel-tab ${activeTab === 'output' ? 'active' : ''}`}
          onClick={() => setActiveTab('output')}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            color: activeTab === 'output' ? 'var(--primary-color)' : 'var(--text-muted)',
            borderBottom: activeTab === 'output' ? '2px solid var(--primary-color)' : '2px solid transparent',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Terminal size={14} /> 编译输出
        </div>
        <div 
          className={`panel-tab ${activeTab === 'serial' ? 'active' : ''}`}
          onClick={() => setActiveTab('serial')}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            color: activeTab === 'serial' ? 'var(--primary-color)' : 'var(--text-muted)',
            borderBottom: activeTab === 'serial' ? '2px solid var(--primary-color)' : '2px solid transparent',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Activity size={14} /> 串口监视器
        </div>
        
        <div style={{ flex: 1 }} />
        
        <div className="panel-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {activeTab === 'serial' && (
            <>
              <select 
                value={baudRate} 
                onChange={(e) => setBaudRate(e.target.value)}
                style={{
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  color: 'white',
                  fontSize: '11px',
                  padding: '2px 4px'
                }}
              >
                <option value="9600">9600 baud</option>
                <option value="115200">115200 baud</option>
                <option value="57600">57600 baud</option>
              </select>
              <button 
                onClick={toggleSerial}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  backgroundColor: isSerialOpen ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                  color: isSerialOpen ? '#f87171' : '#4ade80',
                  border: `1px solid ${isSerialOpen ? '#ef4444' : '#22c55e'}`,
                  cursor: 'pointer'
                }}
              >
                {isSerialOpen ? '断开' : '连接'}
              </button>
            </>
          )}
          <div className="action-icon" title="Auto Scroll" onClick={() => setAutoScroll(!autoScroll)} style={{ color: autoScroll ? 'var(--primary-color)' : 'var(--text-muted)', cursor: 'pointer' }}>
            <ScrollText size={16} />
          </div>
          <div className="action-icon" title="Clear" onClick={() => activeTab === 'output' ? setOutput('') : setSerialLog('')} style={{ color: 'var(--text-muted)', cursor: 'pointer' }}>
            <Trash2 size={16} />
          </div>
        </div>
      </div>

      <div className="panel-content-area" style={{ flex: 1, position: 'relative', overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.3)' }}>
        <div 
          ref={scrollRef}
          style={{
            height: '100%',
            overflowY: 'auto',
            padding: '12px 16px',
            fontFamily: "'Fira Code', monospace",
            fontSize: '13px',
            lineHeight: '1.6',
            color: '#e2e8f0',
            whiteSpace: 'pre-wrap'
          }}
        >
          {activeTab === 'output' ? (output || '等待编译输出...') : (serialLog || '串口就绪...')}
        </div>
        
        
        {activeTab === 'serial' && (
          <div className="serial-input-bar" style={{
            padding: '8px 16px',
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            backdropFilter: 'blur(5px)',
            flexShrink: 0  // Prevent shrinking
          }}>
            <input 
              type="text" 
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendSerial()}
              placeholder="发送消息到串口..."
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                color: 'white',
                padding: '6px 12px',
                fontSize: '13px'
              }}
            />
            <button 
              onClick={handleSendSerial}
              style={{
                background: 'var(--primary-gradient)',
                border: 'none',
                borderRadius: '6px',
                color: 'white',
                padding: '6px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              发送 <CornerDownLeft size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
