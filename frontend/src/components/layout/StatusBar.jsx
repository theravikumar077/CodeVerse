import React from 'react';
import { useSelector } from 'react-redux';
import { GitBranch, RefreshCw, AlertCircle, AlertTriangle, Users, Terminal } from 'lucide-react';

const StatusBar = ({ line = 1, column = 1, isCollabActive = false, collabRoomId = null }) => {
  const currentBranch = useSelector((state) => state.git.currentBranch) || 'main';
  const activeProject = useSelector((state) => state.editor.activeProject);
  const activeFile = useSelector((state) => state.editor.activeFile);
  const saveStatus = useSelector((state) => state.editor.saveStatus) || 'saved';

  const getLanguageLabel = (filePath) => {
    if (!filePath) return 'Plain Text';
    const ext = filePath.split('.').pop().toLowerCase();
    switch (ext) {
      case 'html': return 'HTML';
      case 'css': return 'CSS';
      case 'js': return 'JavaScript';
      case 'jsx': return 'JavaScript React';
      case 'ts': return 'TypeScript';
      case 'tsx': return 'TypeScript React';
      case 'py': return 'Python';
      case 'cpp': return 'C++';
      case 'c': return 'C';
      case 'java': return 'Java';
      case 'php': return 'PHP';
      case 'md': return 'Markdown';
      case 'json': return 'JSON';
      default: return 'Plain Text';
    }
  };

  return (
    <div className="h-6 w-full bg-vscode-status text-white flex items-center justify-between px-3 select-none text-[11.5px] font-medium z-10">
      {/* Left side */}
      <div className="flex items-center gap-3">
        {/* Environment status indicator */}
        <div className="flex items-center gap-1.5 px-1.5 hover:bg-white/10 cursor-pointer h-full transition-colors">
          <Terminal size={12} />
          <span>RR CodeVerse Sandbox</span>
        </div>

        {/* Git Branch Info */}
        {activeProject && (
          <div className="flex items-center gap-1 hover:bg-white/10 cursor-pointer px-1.5 h-full transition-colors">
            <GitBranch size={12} />
            <span>{currentBranch}</span>
            <RefreshCw size={10} className="ml-1 opacity-70 hover:rotate-180 transition-transform duration-300" />
          </div>
        )}

        {/* Real-time Collaboration indicators */}
        {isCollabActive && (
          <div className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 cursor-pointer px-2 h-full transition-colors">
            <Users size={12} />
            <span>Live Share: {collabRoomId}</span>
          </div>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4 h-full">
        {/* Save Status Indicator */}
        <div className="hover:bg-white/10 px-2 h-full flex items-center transition-colors gap-1.5 cursor-pointer">
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1.5 text-yellow-400">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
              <span>● Saving...</span>
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>✓ Saved</span>
            </span>
          )}
          {saveStatus === 'failed' && (
            <span className="flex items-center gap-1.5 text-red-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
              <span>⚠ Save Failed</span>
            </span>
          )}
        </div>

        {/* Language selector */}
        {activeFile && (
          <div className="hover:bg-white/10 cursor-pointer px-2 h-full flex items-center transition-colors">
            {getLanguageLabel(activeFile)}
          </div>
        )}

        {/* Line & Column indicators */}
        {activeFile && (
          <div className="hover:bg-white/10 cursor-pointer px-2 h-full flex items-center transition-colors">
            Ln {line}, Col {column}
          </div>
        )}

        {/* Indent style indicator */}
        <div className="hover:bg-white/10 cursor-pointer px-2 h-full flex items-center transition-colors hidden md:flex">
          Spaces: 4
        </div>

        {/* Encoding */}
        <div className="hover:bg-white/10 cursor-pointer px-2 h-full flex items-center transition-colors hidden md:flex">
          UTF-8
        </div>

        {/* Platform State */}
        <div className="px-2 bg-vscode-accent text-xs font-semibold h-full flex items-center select-none uppercase">
          Stable
        </div>
      </div>
    </div>
  );
};

export default StatusBar;
