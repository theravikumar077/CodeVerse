import React from 'react';
import { useSelector } from 'react-redux';
import FileTree from '../explorer/FileTree';
import GitPanel from '../git/GitPanel';
import ExtensionsPanel from '../extensions/ExtensionsPanel';
import Logo from '../common/Logo';
import { FolderOpen } from 'lucide-react';

const Sidebar = ({
  onCreateFile,
  onCreateFolder,
  onUploadFile,
  onUploadFolder,
  onDownloadProject,
  onSearchQuery,
  onSearchChange,
  searchResults,
  searchQuery,
  onOpenWorkspace,
  localDirHandle,
}) => {
  const currentView = useSelector((state) => state.editor.sidebarView);
  const activeProject = useSelector((state) => state.editor.activeProject);

  if (currentView === 'none') return null;

  return (
    <div className="w-64 h-full flex flex-col bg-vscode-sidebar border-r border-vscode-border select-none text-vscode-text">
      {/* Sidebar Header */}
      <div className="h-10 px-3 flex items-center justify-between border-b border-vscode-border">
        <span className="text-xs font-semibold uppercase tracking-wider text-vscode-textMuted flex items-center gap-1.5 truncate max-w-[190px]">
          {currentView === 'explorer' ? (
            <>
              <Logo className="w-5 h-5" glow={false} />
              <span className="truncate">{activeProject ? activeProject.name : 'RR CodeVerse'}</span>
            </>
          ) : (
            <>
              {currentView === 'search' && 'Search'}
              {currentView === 'git' && 'Source Control'}
              {currentView === 'run' && 'Run & Debug'}
              {currentView === 'extensions' && 'Extension'}
            </>
          )}
        </span>
        {currentView === 'explorer' && (
          <button
            onClick={onOpenWorkspace}
            title="Open Workspace / Project"
            className="p-1 hover:bg-[#2d2d2d] rounded text-vscode-textMuted hover:text-white transition-colors flex-shrink-0"
          >
            <FolderOpen size={13} />
          </button>
        )}
      </div>

      {/* Sidebar Content */}
      <div className="flex-1 overflow-y-auto">
        {!activeProject && currentView !== 'extensions' ? (
          <div className="p-4 text-xs text-vscode-textMuted text-center flex flex-col gap-3 items-center">
            <span>No project open. Create or select a project to get started.</span>
            <div className="flex flex-col gap-2 w-full mt-2">
              <button
                onClick={onOpenWorkspace}
                className="w-full py-2 bg-[#2d2d2d] hover:bg-[#3d3d3d] text-gray-200 rounded text-xs transition-colors font-medium active:scale-95 border border-white/5 flex items-center justify-center gap-1.5"
              >
                📄 Open File
              </button>
              <button
                onClick={onOpenWorkspace}
                className="w-full py-2 bg-[#1e1e1e] hover:bg-[#2e2e2e] text-gray-200 rounded text-xs transition-colors font-medium active:scale-95 border border-white/5 flex items-center justify-center gap-1.5"
              >
                📁 Open Folder
              </button>
              <button
                onClick={onOpenWorkspace}
                className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs transition-colors font-medium active:scale-95 shadow-md flex items-center justify-center gap-1.5"
              >
                📂 Open Workspace
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* View 1: File Explorer */}
            {currentView === 'explorer' && (
              <FileTree
                onCreateFile={onCreateFile}
                onCreateFolder={onCreateFolder}
                onUploadFile={onUploadFile}
                onUploadFolder={onUploadFolder}
                onDownloadProject={onDownloadProject}
                localDirHandle={localDirHandle}
              />
            )}

            {/* View 2: Search */}
            {currentView === 'search' && (
              <div className="p-3 flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Search (e.g. text or keyword)"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full text-xs bg-vscode-editor border border-vscode-border px-2 py-1.5 rounded focus:outline-none focus:border-vscode-accent text-vscode-text"
                />
                
                {/* Search Results */}
                <div className="mt-2 flex flex-col gap-2">
                  {searchResults.length === 0 ? (
                    <span className="text-xs text-vscode-textMuted">No matches found.</span>
                  ) : (
                    searchResults.map((result, idx) => (
                      <div key={idx} className="text-xs hover:bg-vscode-tabInactive p-1 rounded cursor-pointer">
                        <div className="font-semibold text-vscode-accent">{result.fileName}</div>
                        <div className="text-vscode-textMuted text-[11px] truncate">
                          Line {result.line}: <span className="text-vscode-text">{result.text}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* View 3: Git Control */}
            {currentView === 'git' && <GitPanel />}

            {/* View 4: Run & Debug */}
            {currentView === 'run' && (
              <div className="p-4 flex flex-col gap-4">
                <div className="text-xs font-semibold text-vscode-textMuted">Isolated Sandbox Run</div>
                <p className="text-xs text-vscode-textMuted leading-relaxed">
                  Open a file (e.g. C, C++, Java, JS, Python, PHP) and click the **Run** button in the top-right toolbar to start compiling inside isolated Docker sandbox container.
                </p>
                <div className="border border-vscode-border rounded p-3 bg-vscode-editor text-xs flex flex-col gap-1.5">
                  <div className="flex justify-between">
                    <span className="text-vscode-textMuted">Container Status:</span>
                    <span className="text-green-500 font-semibold">Active Sandbox</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-vscode-textMuted">Isolated Env:</span>
                    <span>Docker Engine</span>
                  </div>
                </div>
              </div>
            )}

            {/* View 5: Extensions Marketplace */}
            {currentView === 'extensions' && <ExtensionsPanel />}
          </>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
