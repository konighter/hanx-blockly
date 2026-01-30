import React, { useState, useEffect } from 'react';
import { X, Save, RotateCcw, Eye, EyeOff } from 'lucide-react';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface AiSettings {
  provider: 'deepseek' | 'openai' | 'ollama' | 'custom';
  apiKey: string;
  apiUrl: string;
  model: string;
}

// Default Configurations
const DEFAULTS: Record<string, AiSettings> = {
  deepseek: {
    provider: 'deepseek',
    apiKey: '',
    apiUrl: 'https://api.deepseek.com/chat/completions',
    model: 'deepseek-chat',
  },
  openai: {
    provider: 'openai',
    apiKey: '',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-3.5-turbo',
  },
  ollama: {
    provider: 'ollama',
    apiKey: 'ollama', // Ollama mostly doesn't need key
    apiUrl: 'http://localhost:11434/api/chat',
    model: 'llama3',
  }
};

const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<AiSettings>(DEFAULTS.deepseek);
  const [showKey, setShowKey] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('ai_settings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
  }, []);

  const handleProviderChange = (provider: AiSettings['provider']) => {
    // If switching to a known provider, prepopulate defaults but keep entered key if possible or reasonable
    // Actually, usually users want fresh defaults when switching, unless custom.
    const newDefaults = DEFAULTS[provider] || { ...settings, provider };
    setSettings(prev => ({
      ...newDefaults,
      // Optional: retain key if switching between compatible providers? No, usually distinct keys.
      apiKey: provider === 'ollama' ? 'ollama' : '', 
    }));
  };

  const handleSave = () => {
    localStorage.setItem('ai_settings', JSON.stringify(settings));
    onClose();
    // Dispatch a custom event to notify other components if needed, or just rely on them reading storage on act
    window.dispatchEvent(new Event('settings-updated'));
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.3)',
          zIndex: 40,
          backdropFilter: 'blur(2px)',
          transition: 'opacity 0.3s'
        }}
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '400px',
        backgroundColor: 'white',
        boxShadow: '-4px 0 15px rgba(0,0,0,0.1)',
        zIndex: 50,
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '-apple-system, system-ui, sans-serif'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(to right, #f8fafc, #fff)'
        }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a', margin: 0 }}>偏好设置</h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>配置 AI 助手与其他选项</p>
          </div>
          <button 
            onClick={onClose}
            style={{ padding: '8px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X size={20} />
          </button>
        </div>

        {/* content */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          
          <div style={{ marginBottom: '24px' }}>
             <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
               <span style={{ width: '4px', height: '16px', backgroundColor: '#0d9488', borderRadius: '2px' }}/>
               AI 模型配置
             </h3>

             {/* Provider Select */}
             <div style={{ marginBottom: '16px' }}>
               <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#475569', marginBottom: '8px' }}>服务提供商</label>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                 {(['deepseek', 'openai', 'ollama', 'custom'] as const).map(p => (
                   <button
                     key={p}
                     onClick={() => handleProviderChange(p)}
                     style={{
                       padding: '10px',
                       borderRadius: '8px',
                       border: settings.provider === p ? '2px solid #0d9488' : '1px solid #cbd5e1',
                       backgroundColor: settings.provider === p ? '#f0fdfa' : 'white',
                       color: settings.provider === p ? '#0f766e' : '#64748b',
                       fontSize: '13px',
                       fontWeight: '500',
                       cursor: 'pointer',
                       textTransform: 'capitalize'
                     }}
                   >
                     {p}
                   </button>
                 ))}
               </div>
             </div>

             {/* API Key */}
             <div style={{ marginBottom: '16px' }}>
               <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#475569', marginBottom: '8px' }}>API Key</label>
               <div style={{ position: 'relative' }}>
                 <input 
                   type={showKey ? 'text' : 'password'}
                   value={settings.apiKey}
                   onChange={(e) => setSettings(s => ({ ...s, apiKey: e.target.value }))}
                   placeholder="sk-..."
                   style={{
                     width: '100%',
                     padding: '10px 40px 10px 12px',
                     borderRadius: '8px',
                     border: '1px solid #cbd5e1',
                     fontSize: '13px',
                     outline: 'none',
                     fontFamily: 'monospace'
                   }}
                   onFocus={(e) => e.target.style.borderColor = '#0d9488'}
                   onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                 />
                 <button
                   onClick={() => setShowKey(!showKey)}
                   style={{
                     position: 'absolute',
                     right: '8px',
                     top: '50%',
                     transform: 'translateY(-50%)',
                     background: 'none',
                     border: 'none',
                     color: '#94a3b8',
                     cursor: 'pointer'
                   }}
                 >
                   {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                 </button>
               </div>
               <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                 {settings.provider === 'ollama' ? '本地运行无需 Key' : '您的 Key 仅存储在本地'}
               </p>
             </div>

             {/* Base URL */}
             <div style={{ marginBottom: '16px' }}>
               <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#475569', marginBottom: '8px' }}>API Base URL</label>
               <input 
                 type="text"
                 value={settings.apiUrl}
                 onChange={(e) => setSettings(s => ({ ...s, apiUrl: e.target.value }))}
                 style={{
                   width: '100%',
                   padding: '10px 12px',
                   borderRadius: '8px',
                   border: '1px solid #cbd5e1',
                   fontSize: '13px',
                   outline: 'none',
                   color: '#334155'
                 }}
                 onFocus={(e) => e.target.style.borderColor = '#0d9488'}
                 onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
               />
             </div>

             {/* Model */}
             <div style={{ marginBottom: '16px' }}>
               <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#475569', marginBottom: '8px' }}>Model Name</label>
               <input 
                 type="text"
                 value={settings.model}
                 onChange={(e) => setSettings(s => ({ ...s, model: e.target.value }))}
                 placeholder="e.g. gpt-4, deepseek-chat"
                 style={{
                   width: '100%',
                   padding: '10px 12px',
                   borderRadius: '8px',
                   border: '1px solid #cbd5e1',
                   fontSize: '13px',
                   outline: 'none',
                   color: '#334155'
                 }}
                 onFocus={(e) => e.target.style.borderColor = '#0d9488'}
                 onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
               />
             </div>
          </div>

        </div>

        {/* Footer */}
        <div style={{
          padding: '20px',
          borderTop: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
           <button
             onClick={() => setSettings(DEFAULTS.deepseek)}
             style={{
               padding: '10px 16px',
               borderRadius: '8px',
               border: '1px solid #cbd5e1',
               backgroundColor: 'white',
               color: '#475569',
               fontSize: '13px',
               fontWeight: '500',
               cursor: 'pointer',
               display: 'flex',
               alignItems: 'center',
               gap: '6px'
             }}
           >
             <RotateCcw size={16} />
             重置
           </button>
           <button
             onClick={handleSave}
             style={{
               padding: '10px 24px',
               borderRadius: '8px',
               background: 'linear-gradient(135deg, #0d9488, #0f766e)',
               border: 'none',
               color: 'white',
               fontSize: '13px',
               fontWeight: '500',
               cursor: 'pointer',
               display: 'flex',
               alignItems: 'center',
               gap: '6px',
               boxShadow: '0 4px 6px -1px rgba(13, 148, 136, 0.3)'
             }}
           >
             <Save size={16} />
             保存配置
           </button>
        </div>
      </div>
    </>
  );
};

export default SettingsDrawer;
