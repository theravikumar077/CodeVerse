import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { Send, Bot, User, Sparkles, X, RotateCcw, AlertTriangle } from 'lucide-react';

const AIChatPanel = ({ onClose }) => {
  const activeFile = useSelector((state) => state.editor.activeFile);
  const fileContents = useSelector((state) => state.editor.fileContents) || {};
  const token = useSelector((state) => state.auth.token);

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am your RR CodeVerse AI Assistant. Select a code file and click any shortcut trigger above, or type custom questions to optimize, refactor, and fix bugs.',
      mode: 'System Welcome',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const activeCode = activeFile ? fileContents[activeFile] || '' : '';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const getHeaders = () => ({
    headers: { Authorization: `Bearer ${token}` },
  });

  const handleSend = async (customPrompt = null, command = null) => {
    const promptText = customPrompt || input;
    if (!promptText.trim()) return;

    if (!customPrompt) setInput('');

    // Append user message
    setMessages((prev) => [...prev, { role: 'user', content: promptText }]);
    setLoading(true);

    try {
      const res = await axios.post(
        'http://localhost:5000/api/ai/chat',
        {
          prompt: promptText,
          codeContext: activeCode,
          command,
        },
        getHeaders()
      );

      if (res.data.success) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: res.data.reply,
            mode: res.data.mode,
          },
        ]);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Failed to process AI response:\n${err.response?.data?.message || err.message}`,
          mode: 'System Error',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (actionType) => {
    if (!activeFile) {
      alert('Please open a file in the editor first to provide code context.');
      return;
    }

    let promptText = '';
    switch (actionType) {
      case 'explain':
        promptText = `Explain this file: ${activeFile.split('/').pop()}`;
        break;
      case 'fix':
        promptText = `Check for bugs and compile errors in ${activeFile.split('/').pop()}`;
        break;
      case 'refactor':
        promptText = `Clean up and refactor code formatting inside ${activeFile.split('/').pop()}`;
        break;
      case 'optimize':
        promptText = `Optimize complexity performance of ${activeFile.split('/').pop()}`;
        break;
      default:
        return;
    }

    handleSend(promptText, actionType);
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Chat history cleared. How can I help you program today?',
        mode: 'System Reset',
      },
    ]);
  };

  return (
    <div className="w-full h-full flex flex-col bg-vscode-sidebar border-l border-vscode-border select-none text-vscode-text font-vscode relative">
      {/* Header */}
      <div className="h-10 px-4 flex items-center justify-between border-b border-vscode-border bg-[#1e1e1f] flex-shrink-0">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
          <Sparkles size={14} className="text-vscode-accent" />
          <span>RR CodeVerse Copilot AI</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearChat}
            title="Reset Chat"
            className="p-1 hover:bg-[#2d2d2d] rounded text-vscode-textMuted hover:text-white transition-colors"
          >
            <RotateCcw size={13} />
          </button>
          <button
            onClick={onClose}
            title="Close Panel"
            className="p-1 hover:bg-[#2d2d2d] rounded text-vscode-textMuted hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Action Shortcut buttons */}
      <div className="p-3 border-b border-vscode-border bg-[#1b1b1c] flex flex-col gap-1.5 flex-shrink-0">
        <div className="text-[10px] uppercase font-bold text-vscode-textMuted tracking-wider mb-0.5">
          Inline Code Actions
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => handleAction('explain')}
            className="bg-[#2d2d2d] hover:bg-[#3c3c3c] border border-vscode-border px-2.5 py-1.5 rounded-lg text-[11px] text-gray-200 text-center font-medium transition-colors"
          >
            Explain Code
          </button>
          <button
            onClick={() => handleAction('fix')}
            className="bg-[#2d2d2d] hover:bg-[#3c3c3c] border border-vscode-border px-2.5 py-1.5 rounded-lg text-[11px] text-gray-200 text-center font-medium transition-colors"
          >
            Fix Errors
          </button>
          <button
            onClick={() => handleAction('refactor')}
            className="bg-[#2d2d2d] hover:bg-[#3c3c3c] border border-vscode-border px-2.5 py-1.5 rounded-lg text-[11px] text-gray-200 text-center font-medium transition-colors"
          >
            Refactor
          </button>
          <button
            onClick={() => handleAction('optimize')}
            className="bg-[#2d2d2d] hover:bg-[#3c3c3c] border border-vscode-border px-2.5 py-1.5 rounded-lg text-[11px] text-gray-200 text-center font-medium transition-colors"
          >
            Optimize
          </button>
        </div>
      </div>

      {/* Message history bubbles */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {messages.map((msg, index) => {
          const isAI = msg.role === 'assistant';
          return (
            <div key={index} className={`flex flex-col gap-1.5 ${isAI ? 'items-start' : 'items-end'}`}>
              {/* Bubble */}
              <div className={`max-w-[90%] p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap select-text
                ${isAI ? 'bg-[#252526] text-gray-200 border border-vscode-border rounded-tl-none' : 'bg-vscode-accent text-white rounded-tr-none shadow shadow-violet-500/10'}`}
              >
                {/* Mode Label */}
                {isAI && msg.mode && (
                  <div className="text-[9px] text-vscode-accent font-bold uppercase tracking-wider mb-1 flex items-center gap-1 border-b border-gray-800/40 pb-0.5 select-none">
                    {msg.mode.includes('Key Missing') ? (
                      <AlertTriangle size={9} className="text-yellow-500" />
                    ) : (
                      <Bot size={10} />
                    )}
                    <span>{msg.mode}</span>
                  </div>
                )}
                <span>{msg.content}</span>
              </div>
            </div>
          );
        })}

        {/* Loading bubble */}
        {loading && (
          <div className="flex items-center gap-1.5 bg-[#252526] border border-vscode-border p-3 rounded-2xl rounded-tl-none w-20 justify-center">
            <span className="w-1.5 h-1.5 bg-vscode-accent rounded-full animate-bounce" />
            <span className="w-1.5 h-1.5 bg-vscode-accent rounded-full animate-bounce [animation-delay:0.2s]" />
            <span className="w-1.5 h-1.5 bg-vscode-accent rounded-full animate-bounce [animation-delay:0.4s]" />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 border-t border-vscode-border bg-[#1e1e1f] flex items-center gap-2 flex-shrink-0"
      >
        <input
          type="text"
          placeholder="Ask AI anything..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          className="flex-1 bg-vscode-editor border border-vscode-border px-3 py-2 rounded-xl text-xs text-white focus:outline-none focus:border-vscode-accent placeholder-gray-500 font-sans"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-vscode-accent hover:bg-vscode-accentHover text-white p-2 rounded-xl transition-colors disabled:opacity-40"
        >
          <Send size={13} />
        </button>
      </form>
    </div>
  );
};

export default AIChatPanel;
