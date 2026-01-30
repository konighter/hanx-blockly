import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Bot, User, Sparkles, Zap, Bug, Lightbulb } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import * as Blockly from 'blockly';
import { extensionManager } from '../services/ExtensionManager';
import type { AiSettings } from './SettingsDrawer';
import { ARDUINO_BLOCK_DEFINITIONS } from '../modes/arduino/blocks';

interface AiGeneratorChatProps {
  workspace: Blockly.WorkspaceSvg | null;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  { label: '连接 WiFi', icon: <Zap size={14} />, prompt: '连接到名为 "MyHome" 的 WiFi，密码是 "12345678"' },
  { label: '闪烁 LED', icon: <Lightbulb size={14} />, prompt: '让板载 LED 灯每隔 1 秒闪烁一次' },
  { label: '检测距离', icon: <Bug size={14} />, prompt: '使用超声波传感器读取距离，并通过串口打印出来' },
];

const AiGeneratorChat: React.FC<AiGeneratorChatProps> = ({ workspace }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<AiSettings | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '你好！我是你的 AI 编程助手。告诉我你想做什么，我会帮你生成积木代码。试试下方的快捷指令吧！' }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadSettings = () => {
    const saved = localStorage.getItem('ai_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        console.log("[AI] Loaded settings:", parsed);
        setSettings(parsed);
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
  };

  useEffect(() => {
    loadSettings();
    window.addEventListener('settings-updated', loadSettings);
    return () => window.removeEventListener('settings-updated', loadSettings);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleGenerate = async (customPrompt?: string) => {
    const textToProcess = customPrompt || prompt;
    if (!textToProcess.trim() || !workspace) return;
    
    // Validate Settings
    if (!settings?.apiKey && settings?.provider !== 'ollama') {
      setMessages(prev => [...prev, 
        { role: 'user', content: textToProcess },
        { role: 'assistant', content: '🚫 请先在设置中配置 API Key (点击右上角代码区旁边的设置图标)' }
      ]);
      setPrompt('');
      return;
    }

    setMessages(prev => [...prev, { role: 'user', content: textToProcess }]);
    setPrompt('');
    setIsLoading(true);

    try {
      const baseBlocks = ARDUINO_BLOCK_DEFINITIONS;
      const extensionBlocks = extensionManager.getAllBlockDefinitions();
      const allBlocks = [...baseBlocks, ...extensionBlocks];
      
      const context = JSON.stringify(allBlocks, null, 2);

      const args = {
        prompt: textToProcess,
        context,
        apiKey: settings?.apiKey,
        apiUrl: settings?.apiUrl,
        model: settings?.model
      };
      console.log("[AI] Invoking generate_blocks with:", args);

      const response = await invoke<string>('generate_blocks', args);
      let xmlText = response;
      xmlText = xmlText.replace(/```xml/g, '').replace(/```/g, '').trim();

      if (!xmlText.startsWith('<xml') && !xmlText.startsWith('<block')) {
         setMessages(prev => [...prev, { role: 'assistant', content: xmlText }]);
         return; 
      }
      
      if (!xmlText.startsWith('<xml')) {
        xmlText = `<xml xmlns="https://developers.google.com/blockly/xml">${xmlText}</xml>`;
      }

      const dom = Blockly.utils.xml.textToDom(xmlText);
      Blockly.Xml.domToWorkspace(dom, workspace);
      
      setMessages(prev => [...prev, { role: 'assistant', content: '已为您生成积木代码！快去画布看看吧。🎉' }]);

    } catch (err) {
      console.error("AI Generation Error:", err);
      const errorMsg = typeof err === 'string' ? err : (err instanceof Error ? err.message : '未知错误');
      setMessages(prev => [...prev, { role: 'assistant', content: `生成失败: ${errorMsg}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#f8fafc',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    }}>
      {/* Background Decor */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '128px',
        background: 'linear-gradient(to bottom, rgba(204, 251, 241, 0.5), transparent)',
        pointerEvents: 'none'
      }} />

      {/* Messages Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        zIndex: 10
      }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{
            display: 'flex',
            gap: '12px',
            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              background: msg.role === 'user' 
                ? 'linear-gradient(135deg, #0d9488, #0f766e)' 
                : 'linear-gradient(135deg, #6366f1, #8b5cf6)', // Bot keeps purple-ish or change to generic
              color: 'white'
            }}>
              {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
            </div>
            
            <div style={{
              maxWidth: '85%',
              padding: '14px',
              fontSize: '13.5px',
              lineHeight: '1.6',
              borderRadius: '16px',
              borderTopRightRadius: msg.role === 'user' ? '4px' : '16px',
              borderTopLeftRadius: msg.role === 'user' ? '16px' : '4px',
              backdropFilter: 'blur(4px)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              backgroundColor: msg.role === 'user' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.95)',
              color: '#1f2937',
              border: msg.role === 'user' 
                ? '1px solid rgba(13, 148, 136, 0.2)' // Teal border for user
                : '1px solid rgba(99, 102, 241, 0.1)' // Indigo border for bot
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div style={{ display: 'flex', gap: '12px' }}>
             <div style={{
               width: '36px',
               height: '36px',
               borderRadius: '12px',
               backgroundColor: 'rgba(20, 184, 166, 0.1)',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center'
             }}>
               <Loader2 className="animate-spin" style={{ color: '#0d9488', animation: 'spin 1s linear infinite' }} size={18} />
             </div>
             <div style={{
               backgroundColor: 'rgba(255, 255, 255, 0.9)',
               padding: '14px',
               borderRadius: '16px',
               borderTopLeftRadius: '4px',
               border: '1px solid rgba(20, 184, 166, 0.1)',
               fontSize: '14px',
               color: '#6b7280',
               display: 'flex',
               alignItems: 'center',
               gap: '8px'
             }}>
               <Sparkles size={14} style={{ color: '#2dd4bf' }} />
               正在构思逻辑...
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {!isLoading && messages.length < 3 && (
        <div style={{ 
          padding: '0 16px 8px 16px', 
          display: 'flex', 
          gap: '8px', 
          overflowX: 'auto',
          scrollbarWidth: 'none'
        }}>
          {SUGGESTIONS.map((item, idx) => (
             <button
               key={idx}
               onClick={() => handleGenerate(item.prompt)}
               style={{
                 display: 'flex',
                 alignItems: 'center',
                 gap: '6px',
                 padding: '6px 12px',
                 backgroundColor: 'white',
                 border: '1px solid #ccfbf1',
                 borderRadius: '999px',
                 fontSize: '12px',
                 color: '#0f766e',
                 cursor: 'pointer',
                 whiteSpace: 'nowrap',
                 boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                 transition: 'all 0.2s'
               }}
               onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0fdfa'}
               onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
             >
               {item.icon}
               {item.label}
             </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div style={{
        padding: '16px',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(8px)',
        borderTop: '1px solid #ccfbf1',
        position: 'sticky',
        bottom: 0,
        zIndex: 20
      }}>
        <div style={{ position: 'relative' }}>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleGenerate();
              }
            }}
            placeholder="告诉我你想实现什么..."
            style={{
              width: '100%',
              padding: '12px 48px 12px 16px',
              backgroundColor: 'white',
              border: '1px solid #ccfbf1',
              borderRadius: '12px',
              fontSize: '14px',
              color: '#374151',
              outline: 'none',
              resize: 'none',
              height: '52px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              fontFamily: 'inherit'
            }}
            onFocus={(e) => {
               e.target.style.borderColor = '#5eead4';
               e.target.style.boxShadow = '0 0 0 2px #ccfbf1';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#ccfbf1';
              e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
           }}
          />
          <button
            onClick={() => handleGenerate()}
            disabled={isLoading || !prompt.trim()}
            style={{
              position: 'absolute',
              right: '8px',
              bottom: '8px',
              padding: '8px',
              background: 'linear-gradient(to right, #0d9488, #0f766e)',
              color: 'white',
              borderRadius: '8px',
              border: 'none',
              cursor: isLoading || !prompt.trim() ? 'not-allowed' : 'pointer',
              opacity: isLoading || !prompt.trim() ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.1s'
            }}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default AiGeneratorChat;
