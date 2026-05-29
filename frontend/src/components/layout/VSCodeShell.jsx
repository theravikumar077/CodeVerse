import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ActivityBar from './ActivityBar';
import Sidebar from './Sidebar';
import EditorTabs from '../editor/EditorTabs';
import CodeEditor from '../editor/CodeEditor';
import TerminalPanel from '../terminal/TerminalPanel';
import AIChatPanel from '../ai/AIChatPanel';
import StatusBar from './StatusBar';
import CommandPalette from '../common/CommandPalette';
import useKeyboardShortcuts from '../../hooks/useKeyboardShortcuts';
import { toggleSidebar, updateEditorSettings } from '../../store/slices/editorSlice';
import BrowserPreview from '../preview/BrowserPreview';
import { Eye } from 'lucide-react';

const VSCodeShell = ({
  isCollabActive,
  collabRoomId,
  onSaveFile,
  onRunCode,
  onCursorMove,
  onOpenSettingsFile,
  onCreateFile,
  onCreateFolder,
  onUploadFile,
  onUploadFolder,
  onDownloadProject,
  onSearchChange,
  searchResults,
  searchQuery,
  onGoToDashboard,
  onOpenWorkspace,
  localDirHandle,
}) => {
  const dispatch = useDispatch();
  const sidebarView = useSelector((state) => state.editor.sidebarView);
  const activeFile = useSelector((state) => state.editor.activeFile);
  const settings = useSelector((state) => state.editor.settings);
  const activeProject = useSelector((state) => state.editor.activeProject);

  // Layout Dimensions State
  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(200);
  const [aiPanelWidth, setAiPanelWidth] = useState(300);

  // Collapsible Open States
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [commandPaletteMode, setCommandPaletteMode] = useState('command'); // 'command' | 'file'

  // Settings / Profile Dialog Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // References for dragging
  const containerRef = useRef(null);

  // Custom keybind hooks registration
  useKeyboardShortcuts({
    onToggleSidebar: () => {
      dispatch(toggleSidebar(sidebarView === 'none' ? 'explorer' : sidebarView));
    },
    onToggleTerminal: () => {
      setIsTerminalOpen(prev => !prev);
    },
    onSaveFile: () => {
      if (onSaveFile && activeFile) onSaveFile();
    },
    onOpenCommandPalette: () => {
      setCommandPaletteMode('command');
      setIsCommandPaletteOpen(true);
    },
    onOpenFileSearch: () => {
      setCommandPaletteMode('file');
      setIsCommandPaletteOpen(true);
    },
  });

  // Apply active theme class to root body
  useEffect(() => {
    const body = document.body;
    body.className = ''; // Reset classes
    body.classList.add(`theme-${settings.theme}`);
  }, [settings.theme]);

  // Sidebar Drag Handler
  const startSidebarResize = (e) => {
    e.preventDefault();
    const handleMouseMove = (moveEvent) => {
      const newWidth = moveEvent.clientX - 48; // Activity bar is 48px width
      if (newWidth > 150 && newWidth < 450) {
        setSidebarWidth(newWidth);
      }
    };
    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Terminal Resizer Drag Handler
  const startTerminalResize = (e) => {
    e.preventDefault();
    const handleMouseMove = (moveEvent) => {
      const newHeight = window.innerHeight - moveEvent.clientY - 24; // Status bar is 24px height
      if (newHeight > 50 && newHeight < window.innerHeight - 150) {
        setBottomPanelHeight(newHeight);
      }
    };
    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // AI Panel Drag Handler
  const startAiResize = (e) => {
    e.preventDefault();
    const handleMouseMove = (moveEvent) => {
      const newWidth = window.innerWidth - moveEvent.clientX;
      if (newWidth > 200 && newWidth < 500) {
        setAiPanelWidth(newWidth);
      }
    };
    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Available commands for Command Palette
  const sampleCommands = [
    {
      id: 'open_workspace',
      category: 'Workspaces',
      label: 'Open Workspace / Project / Existing Workspace',
      action: () => {
        if (onOpenWorkspace) onOpenWorkspace();
      },
    },
    {
      id: 'theme_dark',
      category: 'Preferences',
      label: 'Color Theme: Dark+ (Default)',
      action: () => dispatch(updateEditorSettings({ theme: 'dark-plus' })),
    },
    {
      id: 'theme_dracula',
      category: 'Preferences',
      label: 'Color Theme: Dracula',
      action: () => dispatch(updateEditorSettings({ theme: 'dracula' })),
    },
    {
      id: 'theme_monokai',
      category: 'Preferences',
      label: 'Color Theme: Monokai',
      action: () => dispatch(updateEditorSettings({ theme: 'monokai' })),
    },
    {
      id: 'theme_light',
      category: 'Preferences',
      label: 'Color Theme: Light+ (Default)',
      action: () => dispatch(updateEditorSettings({ theme: 'light-plus' })),
    },
    {
      id: 'theme_github_dark',
      category: 'Preferences',
      label: 'Color Theme: GitHub Dark',
      action: () => dispatch(updateEditorSettings({ theme: 'github-dark' })),
    },
    {
      id: 'toggle_terminal',
      category: 'View',
      label: 'Toggle Integrated Terminal',
      shortcut: 'Ctrl+`',
      action: () => setIsTerminalOpen(prev => !prev),
    },
    {
      id: 'toggle_sidebar',
      category: 'View',
      label: 'Toggle Side Bar Visibility',
      shortcut: 'Ctrl+B',
      action: () => dispatch(toggleSidebar(sidebarView === 'none' ? 'explorer' : sidebarView)),
    },
    {
      id: 'toggle_ai_chat',
      category: 'View',
      label: 'Toggle AI Assistant Panel',
      action: () => setIsAiOpen(prev => !prev),
    },
  ];

  return (
    <div ref={containerRef} className="w-screen h-screen flex flex-col overflow-hidden bg-vscode-editor font-vscode select-none text-[13px] relative">
      {/* Workspace Core Area */}
      <div className="flex-1 flex w-full min-h-0 relative">
        {/* 1. Activity Bar (Left, 48px) */}
        <ActivityBar
          onSettingsOpen={onOpenSettingsFile}
          onProfileOpen={() => setIsProfileOpen(true)}
          onGoToDashboard={onGoToDashboard}
        />

        {/* 2. Collapsible & Resizable Sidebar */}
        {sidebarView !== 'none' && (
          <div
            style={{ width: `${sidebarWidth}px` }}
            className="h-full relative flex min-w-0"
          >
            <Sidebar
              onCreateFile={onCreateFile}
              onCreateFolder={onCreateFolder}
              onUploadFile={onUploadFile}
              onUploadFolder={onUploadFolder}
              onDownloadProject={onDownloadProject}
              onSearchChange={onSearchChange}
              searchResults={searchResults}
              searchQuery={searchQuery}
              onOpenWorkspace={onOpenWorkspace}
              localDirHandle={localDirHandle}
            />
            {/* Sidebar resize bar handle */}
            <div
              onMouseDown={startSidebarResize}
              className="absolute top-0 right-0 w-[4px] h-full cursor-col-resize hover:bg-vscode-accent bg-transparent z-20 custom-panel-resizer"
            />
          </div>
        )}

        {/* 3. Editor & Bottom Panel Container */}
        <div className="flex-1 flex flex-col min-w-0 h-full relative">
          {/* Main workspace (tabs + editor) */}
          <div className="flex-1 min-h-0 relative flex flex-col">
            <EditorTabs />
            <div className="flex-1 min-h-0 flex">
              <div className="flex-1 min-w-0 h-full">
                <CodeEditor onSaveFile={onSaveFile} onCursorMove={onCursorMove} />
              </div>
              {isPreviewOpen && activeProject && (
                <div className="w-[50%] h-full flex-shrink-0">
                  <BrowserPreview projectId={activeProject._id} />
                </div>
              )}
            </div>

            {/* Run floating play button (Top Right relative overlay if tabs are active) */}
            {activeFile && (
              <div className="absolute top-1.5 right-4 z-10 flex items-center gap-2">
                <button
                  onClick={() => setIsPreviewOpen(prev => !prev)}
                  title="Toggle Side Preview"
                  className={`text-xs px-2.5 py-1 rounded transition-colors flex items-center gap-1 shadow
                    ${isPreviewOpen ? 'bg-vscode-accent text-white font-medium' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'}`}
                >
                  <Eye size={12} />
                  <span>Preview</span>
                </button>
                <button
                  onClick={() => {
                    if (onRunCode) onRunCode();
                    setIsTerminalOpen(true);
                  }}
                  title="Run Code (Docker Sandbox)"
                  className="bg-green-600 hover:bg-green-700 text-white font-medium text-xs px-2.5 py-1 rounded transition-colors flex items-center gap-1 shadow"
                >
                  <span className="w-2.5 h-2.5 border-t-2 border-r-2 border-white rotate-45 inline-block mr-0.5" />
                  Run
                </button>
                <button
                  onClick={() => setIsAiOpen(prev => !prev)}
                  title="Ask AI"
                  className="bg-vscode-accent hover:bg-vscode-accentHover text-white text-xs px-2.5 py-1 rounded transition-colors"
                >
                  AI Chat
                </button>
              </div>
            )}
          </div>

          {/* 4. Collapsible & Resizable Bottom Panel (Terminal) */}
          {isTerminalOpen && (
            <div
              style={{ height: `${bottomPanelHeight}px` }}
              className="relative flex flex-col min-h-0 bg-vscode-terminal border-t border-vscode-border"
            >
              {/* Bottom Resizer handle */}
              <div
                onMouseDown={startTerminalResize}
                className="absolute top-0 left-0 w-full h-[4px] cursor-row-resize hover:bg-vscode-accent bg-transparent z-20 custom-panel-resizer"
              />
              <div className="flex-1 min-h-0">
                <TerminalPanel />
              </div>
            </div>
          )}
        </div>

        {/* 5. Collapsible & Resizable AI Chat Assistant Panel (Right) */}
        {isAiOpen && (
          <div
            style={{ width: `${aiPanelWidth}px` }}
            className="h-full relative flex min-w-0"
          >
            {/* Left resizer handle */}
            <div
              onMouseDown={startAiResize}
              className="absolute top-0 left-0 w-[4px] h-full cursor-col-resize hover:bg-vscode-accent bg-transparent z-20 custom-panel-resizer"
            />
            <div className="flex-1 h-full min-w-0">
              <AIChatPanel onClose={() => setIsAiOpen(false)} />
            </div>
          </div>
        )}
      </div>

      {/* 6. Status Bar (Bottom, 24px) */}
      <StatusBar
        isCollabActive={isCollabActive}
        collabRoomId={collabRoomId}
      />

      {/* Command Palette Overlay */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        commands={sampleCommands}
        files={[]} // Hook into editor project files in later modules
        initialMode={commandPaletteMode}
      />

      {/* Profile Modal Placeholder */}
      {isProfileOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#252526] border border-vscode-border rounded-lg shadow-2xl w-[400px] p-5 text-vscode-text">
            <h3 className="text-sm font-semibold mb-4">User Settings Profile</h3>
            <p className="text-xs text-vscode-textMuted mb-4">
              Upload custom avatars and update biographical details here.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsProfileOpen(false)}
                className="px-3 py-1.5 bg-vscode-accent hover:bg-vscode-accentHover text-white rounded text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal Placeholder */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#252526] border border-vscode-border rounded-lg shadow-2xl w-[450px] p-5 text-vscode-text">
            <h3 className="text-sm font-semibold mb-4">Preferences Settings</h3>
            <div className="flex flex-col gap-3 mb-5">
              <div className="flex justify-between items-center text-xs">
                <span>Font Size (px)</span>
                <input
                  type="number"
                  value={settings.fontSize}
                  onChange={(e) => dispatch(updateEditorSettings({ fontSize: Number(e.target.value) }))}
                  className="w-16 bg-vscode-editor border border-vscode-border px-2 py-1 rounded focus:outline-none"
                />
              </div>
              <div className="flex justify-between items-center text-xs">
                <span>Font Family</span>
                <span className="text-[11px] text-vscode-textMuted truncate max-w-[200px]">
                  {settings.fontFamily}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span>Auto Save</span>
                <select
                  value={settings.autoSave}
                  onChange={(e) => dispatch(updateEditorSettings({ autoSave: e.target.value }))}
                  className="bg-vscode-editor border border-vscode-border px-2 py-1 rounded focus:outline-none text-xs"
                >
                  <option value="off">Off</option>
                  <option value="on">On Focus Change</option>
                  <option value="afterDelay">After Delay (1s)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-3 py-1.5 bg-vscode-accent hover:bg-vscode-accentHover text-white rounded text-xs"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VSCodeShell;
