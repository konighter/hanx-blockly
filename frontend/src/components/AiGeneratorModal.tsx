import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, X } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import * as Blockly from 'blockly';
import { extensionManager } from '../services/ExtensionManager';
import type { AiSettings } from './SettingsDrawer';

interface AiGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: Blockly.WorkspaceSvg | null;
}

const AiGeneratorModal: React.FC<AiGeneratorModalProps> = ({ isOpen, onClose, workspace }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<AiSettings | null>(null);

  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem('ai_settings');
      if (saved) {
        try {
          setSettings(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse settings", e);
        }
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim() || !workspace) return;

    // Validate Settings
    if (!settings?.apiKey && settings?.provider !== 'ollama') {
      setError('请先在设置中配置 API Key');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Gather Context (All available blocks)
      const allBlocks = extensionManager.getAllBlockDefinitions();
      const context = JSON.stringify(allBlocks, null, 2);

      // 2. Call Backend
      const response = await invoke<string>('generate_blocks', {
        prompt,
        context,
        apiKey: settings?.apiKey,
        apiUrl: settings?.apiUrl,
        model: settings?.model
      });

      // 3. Clean and Apply XML
      let xmlText = response;
      
      // Basic cleanup if AI returns markdown code blocks
      xmlText = xmlText.replace(/```xml/g, '').replace(/```/g, '').trim();

      if (!xmlText.startsWith('<xml') && !xmlText.startsWith('<block')) {
         // Fallback: If it's JSON logic, we might need a converter, but for now assuming XML
         throw new Error("AI returned invalid format. Expected Blockly XML.");
      }
      
      // Ensure XML is wrapped
      if (!xmlText.startsWith('<xml')) {
        xmlText = `<xml xmlns="https://developers.google.com/blockly/xml">${xmlText}</xml>`;
      }

      const dom = Blockly.utils.xml.textToDom(xmlText);
      Blockly.Xml.domToWorkspace(dom, workspace);
      
      onClose();
    } catch (err) {
      console.error("AI Generation Error:", err);
      setError(typeof err === 'string' ? err : (err instanceof Error ? err.message : "Failed to generate blocks"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-[600px] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-300" />
            <span className="font-semibold text-lg">AI 积木生成器</span>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-4">
          <p className="text-gray-600 text-sm">
            用自然语言描述您想要的功能，AI 将自动为您生成积木代码。
            <br/>
            <span className="text-xs text-gray-400">例如："每隔1秒闪烁一下LED灯" 或 "连接WiFi并打印IP地址"</span>
          </p>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="在此输入您的需求..."
            className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none text-gray-800"
            disabled={isLoading}
          />

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium"
            disabled={isLoading}
          >
            取消
          </button>
          <button 
            onClick={handleGenerate}
            disabled={isLoading || !prompt.trim()}
            className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin h-4 w-4" />
                正在生成...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                生成积木
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiGeneratorModal;
