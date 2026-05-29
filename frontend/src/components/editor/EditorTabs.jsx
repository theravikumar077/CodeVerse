import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { openTab, closeTab } from '../../store/slices/editorSlice';
import { X } from 'lucide-react';

const EditorTabs = () => {
  const dispatch = useDispatch();
  const openTabs = useSelector((state) => state.editor.openTabs) || [];
  const activeFile = useSelector((state) => state.editor.activeFile);
  const dirtyFiles = useSelector((state) => state.editor.dirtyFiles) || {};

  const handleTabClick = (tabPath) => {
    dispatch(openTab(tabPath));
  };

  const handleTabClose = (e, tabPath) => {
    e.stopPropagation(); // Stop click propagating to selecting tab
    dispatch(closeTab(tabPath));
  };

  if (openTabs.length === 0) {
    return (
      <div className="h-9 w-full bg-[#1b1b1c] border-b border-vscode-border flex items-center px-4 select-none">
        <span className="text-[11px] text-vscode-textMuted font-vscode">No tabs open</span>
      </div>
    );
  }

  return (
    <div className="h-9 w-full bg-[#252526] border-b border-vscode-border flex items-center overflow-x-auto select-none scrollbar-none z-10">
      {openTabs.map((tabPath) => {
        const fileName = tabPath.split('/').pop();
        const isActive = activeFile === tabPath;
        const isDirty = dirtyFiles[tabPath];

        return (
          <div
            key={tabPath}
            onClick={() => handleTabClick(tabPath)}
            title={tabPath}
            className={`h-full min-w-[120px] max-w-[180px] px-3 flex items-center justify-between border-r border-[#252526] cursor-pointer group select-none text-[12px] font-vscode transition-all duration-150 relative
              ${isActive ? 'bg-vscode-editor text-white border-t-[2px] border-vscode-accent' : 'bg-[#2d2d2d] text-vscode-textMuted hover:bg-[#2d2d2d]/80'}`}
          >
            {/* Tab Title */}
            <span className={`truncate mr-4 ${isActive ? 'font-medium' : ''}`}>
              {fileName}
            </span>

            {/* Tab indicator / Close action */}
            <div className="relative flex items-center justify-center w-4 h-4 ml-1 flex-shrink-0">
              {/* If file is dirty, show circle, but switch to X on group hover */}
              {isDirty ? (
                <div className="w-2.5 h-2.5 rounded-full bg-white opacity-85 group-hover:hidden transition-all duration-100" />
              ) : null}

              {/* Close Button: visible on hover (or always if not dirty) */}
              <button
                onClick={(e) => handleTabClose(e, tabPath)}
                className={`p-0.5 rounded-md hover:bg-[#3c3c3c] text-vscode-textMuted hover:text-white transition-colors
                  ${isDirty ? 'hidden group-hover:flex' : 'flex'}`}
              >
                <X size={10} />
              </button>
            </div>

            {/* Active Bottom Highlight line */}
            {isActive && (
              <div className="absolute bottom-0 left-0 w-full h-[1px] bg-vscode-editor" />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default EditorTabs;
