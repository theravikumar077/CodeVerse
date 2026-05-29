import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import {
  openTab,
  setFileContent,
  updateFileContent,
  setFileTree,
} from '../../store/slices/editorSlice';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  Braces,
  MoreVertical,
  Plus,
  FolderPlus,
  Download,
  Upload,
} from 'lucide-react';


const ensureLocalPermission = async (handle) => {
  if (!handle) return false;
  if ((await handle.queryPermission({ mode: 'readwrite' })) === 'granted') {
    return true;
  }
  const status = await handle.requestPermission({ mode: 'readwrite' });
  return status === 'granted';
};

const writeLocalFile = async (handle, filePath, content) => {
  try {
    const parts = filePath.split('/');
    let current = handle;
    for (let i = 0; i < parts.length - 1; i++) {
      current = await current.getDirectoryHandle(parts[i], { create: true });
    }
    const fileHandle = await current.getFileHandle(parts[parts.length - 1], { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  } catch (e) {
    console.error('Failed to write local file:', filePath, e);
  }
};

const deleteLocalPath = async (handle, targetPath) => {
  try {
    const parts = targetPath.split('/');
    let current = handle;
    for (let i = 0; i < parts.length - 1; i++) {
      current = await current.getDirectoryHandle(parts[i]);
    }
    await current.removeEntry(parts[parts.length - 1], { recursive: true });
  } catch (e) {
    console.error('Failed to delete local path:', targetPath, e);
  }
};

const renameLocalPath = async (handle, oldPath, newPath) => {
  try {
    const partsOld = oldPath.split('/');
    let currentOld = handle;
    for (let i = 0; i < partsOld.length - 1; i++) {
      currentOld = await currentOld.getDirectoryHandle(partsOld[i]);
    }
    const fileHandle = await currentOld.getFileHandle(partsOld[partsOld.length - 1]);
    const file = await fileHandle.getFile();
    const content = await file.text();

    await writeLocalFile(handle, newPath, content);
    await currentOld.removeEntry(partsOld[partsOld.length - 1]);
  } catch (e) {
    console.error('Failed to rename local path:', oldPath, e);
  }
};

const FileTree = ({
  onCreateFile,
  onCreateFolder,
  onUploadFile,
  onDownloadProject,
  localDirHandle,
}) => {
  const dispatch = useDispatch();
  const fileTree = useSelector((state) => state.editor.fileTree) || [];
  const projectId = useSelector((state) => state.editor.activeProject?._id);
  const token = useSelector((state) => state.auth.token);
  const activeFile = useSelector((state) => state.editor.activeFile);

  // States
  const [expanded, setExpanded] = useState({}); // path -> bool
  const [contextMenu, setContextMenu] = useState(null); // { x, y, path, type }
  const [inlineInput, setInlineInput] = useState(null); // { parentPath, type: 'file'|'folder'|'rename', value, oldPath }

  const toggleFolder = (path) => {
    setExpanded((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  // Get File Icons matching VS Code Material Theme
  const getFileIcon = (fileName, isActive) => {
    const ext = fileName.split('.').pop().toLowerCase();
    const style = isActive ? 'scale-105 transition-transform' : '';
    
    switch (ext) {
      case 'html':
        return <FileCode className={`${style} text-orange-500`} size={16} />;
      case 'css':
        return <FileCode className={`${style} text-blue-400`} size={16} />;
      case 'js':
      case 'jsx':
        return <FileCode className={`${style} text-yellow-500`} size={16} />;
      case 'ts':
      case 'tsx':
        return <FileCode className={`${style} text-sky-400`} size={16} />;
      case 'json':
        return <Braces className={`${style} text-teal-500`} size={15} />;
      case 'py':
        return <FileCode className={`${style} text-yellow-600`} size={16} />;
      case 'cpp':
      case 'c':
        return <FileCode className={`${style} text-purple-400`} size={16} />;
      case 'java':
        return <FileCode className={`${style} text-red-500`} size={16} />;
      case 'php':
        return <FileCode className={`${style} text-violet-400`} size={16} />;
      case 'md':
        return <FileText className={`${style} text-indigo-400`} size={16} />;
      default:
        return <FileText className={`${style} text-gray-400`} size={16} />;
    }
  };

  // Load File Contents from Backend
  const handleFileClick = async (path) => {
    dispatch(openTab(path));
    try {
      const res = await axios.get(
        `http://localhost:5000/api/projects/${projectId}/file?filePath=${encodeURIComponent(path)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        const originalContent = res.data.content;
        const draftContent = localStorage.getItem(`draft-${projectId}-${path}`);
        
        dispatch(setFileContent({ path, content: originalContent, isOriginal: true }));
        if (draftContent && draftContent !== originalContent) {
          dispatch(updateFileContent({ path, content: draftContent }));
        }
      }
    } catch (err) {
      console.error('Failed to load file contents:', err);
      const draftContent = localStorage.getItem(`draft-${projectId}-${path}`);
      if (draftContent) {
        dispatch(setFileContent({ path, content: draftContent, isOriginal: true }));
        dispatch(updateFileContent({ path, content: draftContent }));
      }
    }
  };

  const handleContextMenu = (e, path, type) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      path,
      type,
    });
  };

  const closeContextMenu = () => setContextMenu(null);

  // File system API refresh helper
  const refreshTree = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/projects/${projectId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        dispatch(setFileTree(res.data.fileTree));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger inline input box
  const triggerInlineInput = (parentPath, type, oldPath = null, oldValue = '') => {
    closeContextMenu();
    setInlineInput({
      parentPath,
      type,
      value: oldValue,
      oldPath,
    });
  };

  // Process inline input action
  const handleInlineSubmit = async (e) => {
    e.preventDefault();
    if (!inlineInput.value.trim()) {
      setInlineInput(null);
      return;
    }

    const { parentPath, type, value, oldPath } = inlineInput;
    const cleanValue = value.trim();
    const newRelativePath = parentPath ? `${parentPath}/${cleanValue}` : cleanValue;

    try {
      if (type === 'file') {
        await onCreateFile(newRelativePath);
      } else if (type === 'folder') {
        await onCreateFolder(newRelativePath);
      } else if (type === 'rename') {
        const renamedPath = oldPath.split('/');
        renamedPath.pop();
        const baseDir = renamedPath.join('/');
        const newRenamedPath = baseDir ? `${baseDir}/${cleanValue}` : cleanValue;
        
        await axios.put(
          `http://localhost:5000/api/projects/${projectId}/rename`,
          { oldPath, newPath: newRenamedPath },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      await refreshTree();
    } catch (err) {
      console.error(err);
    } finally {
      setInlineInput(null);
    }
  };

  const handleDeletePath = async (targetPath) => {
    closeContextMenu();
    if (!window.confirm(`Delete "${targetPath}" permanently?`)) return;

    try {
      await axios.delete(`http://localhost:5000/api/projects/${projectId}/delete`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { targetPath },
      });
      await refreshTree();
    } catch (err) {
      console.error(err);
    }
  };

  // Render tree recursively
  const renderTreeNodes = (nodes, depth = 0) => {
    return nodes.map((node) => {
      const isFolder = node.type === 'directory';
      const isOpen = expanded[node.path];
      const isActive = activeFile === node.path;

      return (
        <div key={node.path} className="flex flex-col select-none">
          {/* Row */}
          <div
            onContextMenu={(e) => handleContextMenu(e, node.path, node.type)}
            onClick={() => (isFolder ? toggleFolder(node.path) : handleFileClick(node.path))}
            style={{ paddingLeft: `${depth * 12 + 12}px` }}
            className={`h-7 flex items-center justify-between text-xs hover:bg-[#2d2d2d] cursor-pointer group pr-2 transition-colors
              ${isActive ? 'bg-[#37373d] text-white font-medium border-l-[3px] border-vscode-accent' : 'text-gray-300'}`}
          >
            <div className="flex items-center gap-1.5 truncate">
              {isFolder ? (
                isOpen ? (
                  <FolderOpen size={16} className="text-yellow-500/90 flex-shrink-0" />
                ) : (
                  <Folder size={16} className="text-yellow-500/90 flex-shrink-0" />
                )
              ) : (
                getFileIcon(node.name, isActive)
              )}
              <span className="truncate text-[12px]">{node.name}</span>
            </div>

            {/* Actions Quick Menu */}
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
              {isFolder && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerInlineInput(node.path, 'file');
                    }}
                    title="New File"
                    className="p-0.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                  >
                    <Plus size={12} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerInlineInput(node.path, 'folder');
                    }}
                    title="New Folder"
                    className="p-0.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                  >
                    <FolderPlus size={12} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Inline input if trigger was launched under this directory */}
          {inlineInput &&
            inlineInput.parentPath === node.path &&
            inlineInput.type !== 'rename' && (
              <form
                onSubmit={handleInlineSubmit}
                style={{ paddingLeft: `${(depth + 1) * 12 + 12}px` }}
                className="h-7 flex items-center bg-vscode-sidebar border-b border-vscode-border pr-2"
                onClick={(e) => e.stopPropagation()}
              >
                {inlineInput.type === 'file' ? (
                  <FileText size={14} className="text-gray-500 mr-1.5" />
                ) : (
                  <Folder size={14} className="text-yellow-500 mr-1.5" />
                )}
                <input
                  autoFocus
                  type="text"
                  value={inlineInput.value}
                  onChange={(e) => setInlineInput({ ...inlineInput, value: e.target.value })}
                  onBlur={() => setInlineInput(null)}
                  placeholder={`Name ${inlineInput.type}...`}
                  className="w-full text-xs bg-vscode-editor border border-vscode-accent px-1 py-0.5 focus:outline-none text-white font-mono"
                />
              </form>
            )}

          {/* Children scan */}
          {isFolder && isOpen && node.children && (
            <div className="flex flex-col">
              {renderTreeNodes(node.children, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="w-full h-full flex flex-col relative" onClick={closeContextMenu}>
      {/* Workspace actions toolbar */}
      <div className="h-8 px-3 flex items-center justify-between border-b border-vscode-border bg-[#1e1e1f]">
        <span className="text-[10px] font-bold text-vscode-textMuted uppercase tracking-wider">
          Files Outline
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => triggerInlineInput('', 'file')}
            title="New File at root"
            className="p-1 hover:bg-[#2d2d2d] rounded text-vscode-textMuted hover:text-white transition-colors"
          >
            <Plus size={14} />
          </button>
          <button
            onClick={() => triggerInlineInput('', 'folder')}
            title="New Folder at root"
            className="p-1 hover:bg-[#2d2d2d] rounded text-vscode-textMuted hover:text-white transition-colors"
          >
            <FolderPlus size={14} />
          </button>
          <button
            onClick={onDownloadProject}
            title="Zip & Download Workspace"
            className="p-1 hover:bg-[#2d2d2d] rounded text-vscode-textMuted hover:text-white transition-colors"
          >
            <Download size={14} />
          </button>
          <label
            title="Upload files to project"
            className="p-1 hover:bg-[#2d2d2d] rounded text-vscode-textMuted hover:text-white transition-colors cursor-pointer"
          >
            <Upload size={14} />
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => onUploadFile(e.target.files)}
            />
          </label>
        </div>
      </div>

      {/* Root input block */}
      {inlineInput && !inlineInput.parentPath && inlineInput.type !== 'rename' && (
        <form
          onSubmit={handleInlineSubmit}
          className="h-8 px-4 flex items-center bg-[#252526]"
          onClick={(e) => e.stopPropagation()}
        >
          {inlineInput.type === 'file' ? (
            <FileText size={14} className="text-gray-500 mr-1.5" />
          ) : (
            <Folder size={14} className="text-yellow-500 mr-1.5" />
          )}
          <input
            autoFocus
            type="text"
            value={inlineInput.value}
            onChange={(e) => setInlineInput({ ...inlineInput, value: e.target.value })}
            onBlur={() => setInlineInput(null)}
            placeholder={`Name ${inlineInput.type}...`}
            className="w-full text-xs bg-vscode-editor border border-vscode-accent px-1.5 py-0.5 focus:outline-none text-white font-mono"
          />
        </form>
      )}

      {/* Tree items grid */}
      <div className="flex-1 overflow-y-auto py-1.5">
        {fileTree.length === 0 ? (
          <div className="p-4 text-xs text-vscode-textMuted text-center font-vscode leading-loose">
            Workspace is empty.<br />
            Create files to begin coding.
          </div>
        ) : (
          renderTreeNodes(fileTree)
        )}
      </div>

      {/* Floating Context Menu */}
      {contextMenu && (
        <div
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          className="fixed bg-[#252526] border border-[#3c3c3c] py-1 rounded shadow-2xl z-50 min-w-[130px] select-none text-xs"
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.type === 'directory' && (
            <>
              <button
                onClick={() => triggerInlineInput(contextMenu.path, 'file')}
                className="w-full text-left px-3 py-1.5 hover:bg-vscode-accent hover:text-white transition-colors"
              >
                New File
              </button>
              <button
                onClick={() => triggerInlineInput(contextMenu.path, 'folder')}
                className="w-full text-left px-3 py-1.5 hover:bg-vscode-accent hover:text-white transition-colors border-b border-[#3c3c3c]"
              >
                New Folder
              </button>
            </>
          )}
          <button
            onClick={() => triggerInlineInput(null, 'rename', contextMenu.path, contextMenu.path.split('/').pop())}
            className="w-full text-left px-3 py-1.5 hover:bg-vscode-accent hover:text-white transition-colors"
          >
            Rename
          </button>
          <button
            onClick={() => handleDeletePath(contextMenu.path)}
            className="w-full text-left px-3 py-1.5 hover:bg-vscode-accent hover:text-white text-red-400 transition-colors"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default FileTree;
