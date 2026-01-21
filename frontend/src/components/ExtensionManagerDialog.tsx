import React, { useState, useEffect } from 'react';
import { Package, Trash2, Upload, X } from 'lucide-react';
import { extensionManager, type ExtensionData } from '../services/ExtensionManager';
import { open } from '@tauri-apps/plugin-dialog';

interface ExtensionManagerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentMode: 'python' | 'arduino' | 'home';
}

const ExtensionManagerDialog: React.FC<ExtensionManagerDialogProps> = ({ isOpen, onClose, currentMode }) => {
  const [extensions, setExtensions] = useState<ExtensionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const loadExtensions = async () => {
    setLoading(true);
    const exts = await extensionManager.loadExtensions();
    if (currentMode !== 'home') {
        setExtensions(exts.filter(e => e.metadata.platform === currentMode));
    } else {
        setExtensions(exts);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadExtensions();
      setMessage(null);
    }
  }, [isOpen, currentMode]);

  const handleImport = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: 'Extension Package', extensions: ['zip'] }]
      });
      
      if (selected && typeof selected === 'string') {
        setLoading(true);
        const result = await extensionManager.importExtension(selected);
        setMessage({ text: result, type: 'success' });
        await loadExtensions();
      }
    } catch (e) {
      setMessage({ text: `Import failed: ${e}`, type: 'error' });
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete extension "${name}"?`)) {
      try {
        setLoading(true);
        const result = await extensionManager.deleteExtension(id);
        setMessage({ text: result, type: 'success' });
        await loadExtensions();
      } catch (e) {
        setMessage({ text: `Delete failed: ${e}`, type: 'error' });
        setLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="dialog-content" style={{
        backgroundColor: 'white', borderRadius: '8px', width: '800px',
        maxHeight: '85vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }}>
        <div className="dialog-header" style={{
          padding: '16px', borderBottom: '1px solid #eee',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          backgroundColor: '#fafafa', borderTopLeftRadius: '8px', borderTopRightRadius: '8px'
        }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#2d3748' }}>
            <Package size={20} /> Extension Manager ({currentMode === 'home' ? 'All' : currentMode})
          </h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#718096' }}>
            <X size={20} />
          </button>
        </div>

        <div className="dialog-body" style={{ padding: '0', overflowY: 'auto', flex: 1, maxHeight: '600px' }}>
          {message && (
            <div style={{
              padding: '12px 16px', margin: '16px', borderRadius: '4px',
              backgroundColor: message.type === 'success' ? '#f0fff4' : '#fff5f5',
              color: message.type === 'success' ? '#38a169' : '#c53030',
              border: `1px solid ${message.type === 'success' ? '#c6f6d5' : '#fed7d7'}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <span>{message.text}</span>
              <button 
                onClick={() => setMessage(null)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', /* color: 'inherit' */ }}
              >
                <X size={14} />
              </button>
            </div>
          )}

          <div style={{ padding: '16px', display: 'flex', justifyContent: 'flex-end', borderBottom: '1px solid #f0f0f0' }}>
            <button 
              onClick={handleImport}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 16px', backgroundColor: '#3182ce', color: 'white',
                border: 'none', borderRadius: '4px', cursor: 'pointer',
                fontWeight: 500, fontSize: '14px', transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2c5282'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3182ce'}
            >
              <Upload size={16} /> Import Extension
            </button>
          </div>

          <div className="extension-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            {/* Header */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '2fr 1.5fr 1fr 1.5fr 80px', 
              padding: '12px 16px', 
              backgroundColor: '#f7fafc',
              borderBottom: '1px solid #e2e8f0',
              fontWeight: 600,
              fontSize: '13px',
              color: '#4a5568'
            }}>
              <div>Extension Name / ID</div>
              <div>Author</div>
              <div>Version</div>
              <div>Last Updated</div>
              <div style={{textAlign: 'center'}}>Action</div>
            </div>

            {/* List */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>Loading component list...</div>
            ) : extensions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
                No extensions found for {currentMode === 'home' ? 'platform' : currentMode} mode.
              </div>
            ) : (
                extensions.map(ext => (
                  <div key={ext.metadata.id} style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '2fr 1.5fr 1fr 1.5fr 80px', 
                    padding: '12px 16px', 
                    borderBottom: '1px solid #edf2f7',
                    alignItems: 'center',
                    fontSize: '14px',
                    color: '#2d3748'
                  }}>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontWeight: 600, color: '#2b6cb0', marginBottom: '2px' }}>{ext.metadata.name}</div>
                      <div style={{ fontSize: '12px', color: '#a0aec0', fontFamily: 'monospace' }}>{ext.metadata.id}</div>
                    </div>
                    
                    <div style={{ color: '#4a5568' }}>{ext.metadata.author || <span style={{color:'#cbd5e0'}}>-</span>}</div>
                    
                    <div>
                        {ext.metadata.version ? (
                            <span style={{ 
                                backgroundColor: '#ebf8ff', color: '#3182ce', 
                                padding: '2px 6px', borderRadius: '4px', fontSize: '12px', fontWeight: 500 
                            }}>
                                v{ext.metadata.version}
                            </span>
                        ) : <span style={{color:'#cbd5e0'}}>-</span>}
                    </div>

                    <div style={{ fontSize: '13px', color: '#718096' }}>
                        {ext.updated_at ? new Date(ext.updated_at).toLocaleString() : <span style={{color:'#cbd5e0'}}>-</span>}
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <button 
                        onClick={() => handleDelete(ext.metadata.id, ext.metadata.name)}
                        style={{
                          border: 'none', background: 'transparent', color: '#e53e3e',
                          cursor: 'pointer', padding: '6px', borderRadius: '4px',
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fff5f5'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                        title="Delete Extension"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExtensionManagerDialog;
