import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import io from 'socket.io-client';
import {
  setActiveProject,
  setFileTree,
  setFileContent,
  updateFileContent,
  markFileSaved,
  openTab,
  setFileMarkers,
  setRunningState,
  setRunResult,
  updateCollabCursor,
  removeCollabCursor,
  clearCollabCursors,
  updateEditorSettings,
  setSaveStatus,
} from '../../store/slices/editorSlice';
import { addTerminal, setActiveTerminal, clearTerminals } from '../../store/slices/terminalSlice';
import VSCodeShell from '../layout/VSCodeShell';
import Logo from '../common/Logo';
import { X, FileCode, FolderOpen } from 'lucide-react';

let socket = null;


const getIDBDatabase = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('RRCodeVerseDB', 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('directoryHandles')) {
        db.createObjectStore('directoryHandles');
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
};

const saveDirectoryHandle = async (projectId, handle) => {
  try {
    const db = await getIDBDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('directoryHandles', 'readwrite');
      const store = tx.objectStore('directoryHandles');
      const request = store.put(handle, projectId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('Failed to save directory handle in IndexedDB:', e);
  }
};

const getDirectoryHandle = async (projectId) => {
  try {
    const db = await getIDBDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('directoryHandles', 'readonly');
      const store = tx.objectStore('directoryHandles');
      const request = store.get(projectId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('Failed to get directory handle from IndexedDB:', e);
    return null;
  }
};

const detectDominantLanguage = (fileList) => {
  const counts = {};
  fileList.forEach(({ path }) => {
    const ext = path.split('.').pop().toLowerCase();
    if (ext === 'html') counts.html = (counts.html || 0) + 1;
    else if (ext === 'js' || ext === 'jsx') counts.javascript = (counts.javascript || 0) + 1;
    else if (ext === 'ts' || ext === 'tsx') counts.typescript = (counts.typescript || 0) + 1;
    else if (ext === 'py') counts.python = (counts.python || 0) + 1;
    else if (ext === 'cpp' || ext === 'h') counts.cpp = (counts.cpp || 0) + 1;
    else if (ext === 'c') counts.c = (counts.c || 0) + 1;
    else if (ext === 'java') counts.java = (counts.java || 0) + 1;
    else if (ext === 'php') counts.php = (counts.php || 0) + 1;
    else if (ext === 'md') counts.markdown = (counts.markdown || 0) + 1;
  });
  
  let dominant = 'javascript';
  let maxCount = 0;
  Object.keys(counts).forEach(lang => {
    if (counts[lang] > maxCount) {
      maxCount = counts[lang];
      dominant = lang;
    }
  });
  return dominant;
};

const Workspace = () => {
  const { projectId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user);
  const activeFile = useSelector((state) => state.editor.activeFile);
  const fileContents = useSelector((state) => state.editor.fileContents);
  const isRunning = useSelector((state) => state.editor.isRunning);
  const settings = useSelector((state) => state.editor.settings);
  const dirtyFiles = useSelector((state) => state.editor.dirtyFiles) || {};
  const saveStatus = useSelector((state) => state.editor.saveStatus) || 'saved';

  const terminals = useSelector((state) => state.terminal.terminals);
  const activeTerminalId = useSelector((state) => state.terminal.activeTerminalId);
  const openTabs = useSelector((state) => state.editor.openTabs) || [];

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUnsavedModalOpen, setIsUnsavedModalOpen] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Socket connection details
  const [isCollabActive, setIsCollabActive] = useState(false);
  const [collabRoomId, setCollabRoomId] = useState(null);

  // Open Workspace Modal States
  const [isOpenWorkspaceModalOpen, setIsOpenWorkspaceModalOpen] = useState(false);
  const [openWorkspaceLoading, setOpenWorkspaceLoading] = useState(false);
  const [openWorkspaceLoadingText, setOpenWorkspaceLoadingText] = useState('');
  const [localDirHandle, setLocalDirHandle] = useState(null);

  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  const getHeaders = () => ({
    headers: { Authorization: `Bearer ${token}` },
  });

  // Save workspace state details to localStorage dynamically
  useEffect(() => {
    if (projectId) {
      localStorage.setItem(`open-tabs-${projectId}`, JSON.stringify(openTabs));
    }
  }, [openTabs, projectId]);

  useEffect(() => {
    if (projectId) {
      if (activeFile) {
        localStorage.setItem(`active-file-${projectId}`, activeFile);
      } else {
        localStorage.removeItem(`active-file-${projectId}`);
      }
    }
  }, [activeFile, projectId]);

  useEffect(() => {
    if (projectId) {
      localStorage.setItem(`terminals-${projectId}`, JSON.stringify(terminals));
    }
  }, [terminals, projectId]);

  useEffect(() => {
    if (projectId) {
      if (activeTerminalId) {
        localStorage.setItem(`active-terminal-${projectId}`, activeTerminalId);
      } else {
        localStorage.removeItem(`active-terminal-${projectId}`);
      }
    }
  }, [activeTerminalId, projectId]);

  // Save previous active file when switching tabs or files
  const prevActiveFileRef = useRef(activeFile);
  useEffect(() => {
    const prevFile = prevActiveFileRef.current;
    if (prevFile && prevFile !== activeFile) {
      if (dirtyFiles[prevFile]) {
        saveSpecificFile(prevFile);
      }
    }
    prevActiveFileRef.current = activeFile;
  }, [activeFile]);

  const restoreTabsContent = async (savedTabsList) => {
    for (const path of savedTabsList) {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/projects/${projectId}/file?filePath=${encodeURIComponent(path)}`,
          getHeaders()
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
        console.error(`Failed to restore content for tab ${path}:`, err);
        const draftContent = localStorage.getItem(`draft-${projectId}-${path}`);
        if (draftContent) {
          dispatch(setFileContent({ path, content: draftContent, isOriginal: true }));
          dispatch(updateFileContent({ path, content: draftContent }));
        }
      }
    }
  };

  const loadProject = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5000/api/projects/${projectId}`, getHeaders());
      if (res.data.success) {
        dispatch(setActiveProject(res.data.project));
        dispatch(setFileTree(res.data.fileTree));
        
        try {
          const storedHandle = await getDirectoryHandle(projectId);
          if (storedHandle) {
            setLocalDirHandle(storedHandle);
            console.log('Restored local directory handle for project:', projectId);
          }
        } catch (dbErr) {
          console.error('Error fetching handle from IDB:', dbErr);
        }
        
        // Connect Socket.IO
        socket = io('http://localhost:5000');
        
        socket.on('connect', () => {
          console.log('Connected to socket server');
          socket.emit('join-project', { projectId, username: user.username });
          setIsCollabActive(true);
          setCollabRoomId(projectId);
        });

        // Listen for collaborative file sync
        socket.on('file-synced', ({ filePath, content }) => {
          dispatch(setFileContent({ path: filePath, content, isOriginal: false }));
        });

        // Listen for collaborative cursors
        socket.on('cursor-moved', ({ socketId, username, filePath, cursor }) => {
          dispatch(updateCollabCursor({ socketId, username, filePath, cursor }));
        });

        socket.on('user-left', ({ socketId }) => {
          dispatch(removeCollabCursor(socketId));
        });

        socket.on('disconnect', () => {
          setIsCollabActive(false);
          setCollabRoomId(null);
          dispatch(clearCollabCursors());
        });

        // Restore terminals list from localStorage
        dispatch(clearTerminals());
        const savedTerms = localStorage.getItem(`terminals-${projectId}`);
        const savedActiveTerm = localStorage.getItem(`active-terminal-${projectId}`);
        if (savedTerms) {
          try {
            const parsed = JSON.parse(savedTerms);
            if (Array.isArray(parsed) && parsed.length > 0) {
              parsed.forEach((t) => {
                dispatch(addTerminal(t));
              });
              if (savedActiveTerm) {
                dispatch(setActiveTerminal(savedActiveTerm));
              }
            }
          } catch (e) {
            console.error('Failed to restore terminals:', e);
          }
        }

        // Restore open tabs from localStorage
        const savedTabs = localStorage.getItem(`open-tabs-${projectId}`);
        const savedActiveFile = localStorage.getItem(`active-file-${projectId}`);
        if (savedTabs) {
          try {
            const parsed = JSON.parse(savedTabs);
            if (Array.isArray(parsed) && parsed.length > 0) {
              parsed.forEach((tab) => {
                dispatch(openTab(tab));
              });
              await restoreTabsContent(parsed);
              if (savedActiveFile && parsed.includes(savedActiveFile)) {
                dispatch(openTab(savedActiveFile));
              }
            }
          } catch (e) {
            console.error('Failed to restore open tabs:', e);
          }
        }
      }
    } catch (err) {
      console.error(err);
      setError('Could not load project workspace');
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    loadProject();

    // Track last opened project ID
    localStorage.setItem('last-opened-project-id', projectId);

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [projectId, token]);

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
      console.log('Saved to local disk:', filePath);
    } catch (e) {
      console.error('Failed to write local file:', filePath, e);
    }
  };

  const createLocalFile = async (handle, filePath) => {
    await writeLocalFile(handle, filePath, '');
  };

  const createLocalFolder = async (handle, folderPath) => {
    try {
      const parts = folderPath.split('/');
      let current = handle;
      for (const part of parts) {
        current = await current.getDirectoryHandle(part, { create: true });
      }
      console.log('Created local folder:', folderPath);
    } catch (e) {
      console.error('Failed to create local folder:', folderPath, e);
    }
  };

  const handleOpenFolderClick = async () => {
    setIsOpenWorkspaceModalOpen(false);
    
    if (!window.showDirectoryPicker) {
      folderInputRef.current?.click();
      return;
    }
    
    try {
      const directoryHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
      setOpenWorkspaceLoading(true);
      setOpenWorkspaceLoadingText('Scanning folder contents...');
      
      const files = [];
      const readDirectoryRecursive = async (dirHandle, relativePath = '') => {
        for await (const entry of dirHandle.values()) {
          const entryPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
          if (entry.kind === 'file') {
            const file = await entry.getFile();
            files.push({ file, path: entryPath });
          } else if (entry.kind === 'directory') {
            if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== '.DS_Store' && entry.name !== 'dist' && entry.name !== 'build') {
              await readDirectoryRecursive(entry, entryPath);
            }
          }
        }
      };
      
      await readDirectoryRecursive(directoryHandle);
      
      if (files.length === 0) {
        alert("No files found in the selected folder.");
        setOpenWorkspaceLoading(false);
        return;
      }
      
      setOpenWorkspaceLoadingText('Creating project workspace...');
      const projectRes = await axios.post(
        'http://localhost:5000/api/projects',
        {
          name: directoryHandle.name,
          description: `Imported local workspace folder: ${directoryHandle.name}`,
          language: detectDominantLanguage(files),
        },
        getHeaders()
      );
      
      if (projectRes.data.success) {
        const project = projectRes.data.project;
        
        await saveDirectoryHandle(project._id, directoryHandle);
        
        setOpenWorkspaceLoadingText(`Uploading folder files (0/${files.length})...`);
        const batchSize = 30;
        for (let i = 0; i < files.length; i += batchSize) {
          const batch = files.slice(i, i + batchSize);
          const formData = new FormData();
          batch.forEach(({ file, path }) => {
            formData.append('files', file, path);
          });
          
          await axios.post(
            `http://localhost:5000/api/projects/${project._id}/upload`,
            formData,
            {
              headers: {
                ...getHeaders().headers,
                'Content-Type': 'multipart/form-data',
              },
            }
          );
          setOpenWorkspaceLoadingText(`Uploading folder files (${Math.min(i + batchSize, files.length)}/${files.length})...`);
        }
        
        setOpenWorkspaceLoading(false);
        dispatch(setActiveProject(project));
        navigate(`/workspace/${project._id}`);
      }
    } catch (err) {
      console.error('Directory picker failed:', err);
      setOpenWorkspaceLoading(false);
    }
  };

  const handleOpenFileChange = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    
    setIsOpenWorkspaceModalOpen(false);
    setOpenWorkspaceLoading(true);
    setOpenWorkspaceLoadingText('Loading file...');
    
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = event.target.result;
        const ext = file.name.split('.').pop().toLowerCase();
        const languageMap = {
          'html': 'html',
          'css': 'html',
          'js': 'javascript',
          'jsx': 'javascript',
          'ts': 'typescript',
          'tsx': 'typescript',
          'py': 'python',
          'cpp': 'cpp',
          'c': 'c',
          'java': 'java',
          'php': 'php',
          'md': 'markdown',
        };
        const language = languageMap[ext] || 'javascript';
        
        setOpenWorkspaceLoadingText('Creating workspace...');
        const projectRes = await axios.post(
          'http://localhost:5000/api/projects',
          {
            name: `File: ${file.name}`,
            description: `Loaded file: ${file.name}`,
            language,
          },
          getHeaders()
        );
        
        if (projectRes.data.success) {
          const project = projectRes.data.project;
          
          setOpenWorkspaceLoadingText('Writing file content...');
          await axios.post(
            `http://localhost:5000/api/projects/${project._id}/file`,
            { filePath: file.name, content },
            getHeaders()
          );
          
          setOpenWorkspaceLoading(false);
          dispatch(setActiveProject(project));
          navigate(`/workspace/${project._id}`);
        }
      };
      reader.readAsText(file);
    } catch (err) {
      console.error('File open error:', err);
      setOpenWorkspaceLoading(false);
    }
  };

  const handleOpenFolderChange = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsOpenWorkspaceModalOpen(false);
    setOpenWorkspaceLoading(true);
    setOpenWorkspaceLoadingText('Scanning files...');
    
    try {
      const folderName = files[0].webkitRelativePath.split('/')[0];
      
      const fileList = Array.from(files).map(file => {
        const parts = file.webkitRelativePath.split('/');
        parts.shift();
        const relativePath = parts.join('/');
        return { file, path: relativePath };
      });
      
      setOpenWorkspaceLoadingText('Creating project workspace...');
      const projectRes = await axios.post(
        'http://localhost:5000/api/projects',
        {
          name: folderName,
          description: `Uploaded local workspace folder: ${folderName}`,
          language: detectDominantLanguage(fileList),
        },
        getHeaders()
      );
      
      if (projectRes.data.success) {
        const project = projectRes.data.project;
        
        setOpenWorkspaceLoadingText(`Uploading folder files (0/${fileList.length})...`);
        const batchSize = 30;
        for (let i = 0; i < fileList.length; i += batchSize) {
          const batch = fileList.slice(i, i + batchSize);
          const formData = new FormData();
          batch.forEach(({ file, path }) => {
            formData.append('files', file, path);
          });
          
          await axios.post(
            `http://localhost:5000/api/projects/${project._id}/upload`,
            formData,
            {
              headers: {
                ...getHeaders().headers,
                'Content-Type': 'multipart/form-data',
              },
            }
          );
          setOpenWorkspaceLoadingText(`Uploading folder files (${Math.min(i + batchSize, fileList.length)}/${fileList.length})...`);
        }
        
        setOpenWorkspaceLoading(false);
        dispatch(setActiveProject(project));
        navigate(`/workspace/${project._id}`);
      }
    } catch (err) {
      console.error('Folder open error:', err);
      setOpenWorkspaceLoading(false);
    }
  };

  // Refetch only the file tree
  const refreshFileTree = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/projects/${projectId}`, getHeaders());
      if (res.data.success) {
        dispatch(setFileTree(res.data.fileTree));
      }
    } catch (err) {
      console.error('Error refreshing tree:', err);
    }
  };

  // CRUD handlers
  const handleCreateFile = async (filePath) => {
    try {
      const res = await axios.post(
        `http://localhost:5000/api/projects/${projectId}/file`,
        { filePath, content: '' },
        getHeaders()
      );
      if (res.data.success) {
        await refreshFileTree();
        dispatch(setFileContent({ path: filePath, content: '', isOriginal: true }));
        dispatch(openTab(filePath));
        
        if (localDirHandle) {
          const hasPerm = await ensureLocalPermission(localDirHandle);
          if (hasPerm) {
            await createLocalFile(localDirHandle, filePath);
          }
        }
      }
    } catch (err) {
      console.error('Error creating file:', err);
    }
  };

  const handleCreateFolder = async (folderPath) => {
    try {
      const res = await axios.post(
        `http://localhost:5000/api/projects/${projectId}/folder`,
        { folderPath },
        getHeaders()
      );
      if (res.data.success) {
        await refreshFileTree();
        
        if (localDirHandle) {
          const hasPerm = await ensureLocalPermission(localDirHandle);
          if (hasPerm) {
            await createLocalFolder(localDirHandle, folderPath);
          }
        }
      }
    } catch (err) {
      console.error('Error creating folder:', err);
    }
  };

  const saveFileContentToServer = async (filePath, content, retryCount = 0) => {
    if (filePath === 'settings.json') {
      try {
        dispatch(setSaveStatus('saving'));
        const parsed = JSON.parse(content);
        const updatedSettings = {};
        if (parsed['editor.fontSize'] !== undefined) updatedSettings.fontSize = Number(parsed['editor.fontSize']);
        if (parsed['editor.theme'] !== undefined) updatedSettings.theme = parsed['editor.theme'];
        if (parsed['editor.autoSave'] !== undefined) updatedSettings.autoSave = parsed['editor.autoSave'];
        if (parsed['editor.minimap'] !== undefined) updatedSettings.minimap = !!parsed['editor.minimap'];
        if (parsed['editor.tabSize'] !== undefined) updatedSettings.tabSize = Number(parsed['editor.tabSize']);
        if (parsed['editor.wordWrap'] !== undefined) updatedSettings.wordWrap = parsed['editor.wordWrap'];

        dispatch(updateEditorSettings(updatedSettings));
        await axios.post('http://localhost:5000/api/settings', updatedSettings, getHeaders());
        dispatch(markFileSaved('settings.json'));
        dispatch(setFileMarkers({ path: 'settings.json', markers: [] }));
        dispatch(setSaveStatus('saved'));
        localStorage.removeItem(`draft-${projectId}-settings.json`);
      } catch (jsonErr) {
        console.error(jsonErr);
        dispatch(setSaveStatus('failed'));
        dispatch(setFileMarkers({
          path: 'settings.json',
          markers: [{
            severity: 'error',
            message: `JSON Configuration Error: ${jsonErr.message}`,
            line: 1,
            column: 1,
          }],
        }));
      }
      return;
    }

    try {
      dispatch(setSaveStatus('saving'));
      const res = await axios.post(
        `http://localhost:5000/api/projects/${projectId}/file`,
        { filePath, content },
        getHeaders()
      );
      if (res.data.success) {
        dispatch(markFileSaved(filePath));
        dispatch(setFileMarkers({ path: filePath, markers: res.data.markers || [] }));
        dispatch(setSaveStatus('saved'));
        localStorage.removeItem(`draft-${projectId}-${filePath}`);
        
        if (localDirHandle) {
          const hasPerm = await ensureLocalPermission(localDirHandle);
          if (hasPerm) {
            await writeLocalFile(localDirHandle, filePath, content);
          }
        }
        
        // Notify other room collaborators
        if (socket && isCollabActive) {
          socket.emit('file-modified', { projectId, filePath: filePath, content });
        }
      } else {
        throw new Error('Save response success was false');
      }
    } catch (err) {
      console.error(`Failed to save file ${filePath} (retry: ${retryCount}):`, err);
      dispatch(setSaveStatus('failed'));
      
      // Auto-retry loop on network fails (5 attempts, 3s delay)
      if (retryCount < 5) {
        setTimeout(() => {
          const currentContent = fileContents[filePath];
          if (currentContent !== undefined) {
            saveFileContentToServer(filePath, currentContent, retryCount + 1);
          }
        }, 3000);
      }
    }
  };

  const saveSpecificFile = async (filePath) => {
    const content = fileContents[filePath];
    if (content !== undefined) {
      await saveFileContentToServer(filePath, content);
    }
  };

  const handleSaveFile = async () => {
    if (!activeFile) return;
    const content = fileContents[activeFile] || '';
    await saveFileContentToServer(activeFile, content);
  };

  const handleOpenSettingsFile = () => {
    const settingsPath = 'settings.json';
    const settingsJson = JSON.stringify({
      "editor.fontSize": settings.fontSize,
      "editor.theme": settings.theme,
      "editor.autoSave": settings.autoSave,
      "editor.minimap": settings.minimap,
      "editor.tabSize": settings.tabSize,
      "editor.wordWrap": settings.wordWrap,
    }, null, 2);

    dispatch(setFileContent({ path: settingsPath, content: settingsJson, isOriginal: true }));
    dispatch(openTab(settingsPath));
  };

  const handleUploadFile = async (files) => {
    if (!files || files.length === 0) return;
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file);
    }
    
    try {
      const res = await axios.post(
        `http://localhost:5000/api/projects/${projectId}/upload`,
        formData,
        {
          headers: {
            ...getHeaders().headers,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      if (res.data.success) {
        await refreshFileTree();
      }
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  const handleDownloadProject = () => {
    window.open(`http://localhost:5000/api/projects/${projectId}/zip?token=${token}`, '_blank');
  };

  const handleCursorMove = (cursor) => {
    if (socket && isCollabActive && activeFile) {
      socket.emit('cursor-move', {
        projectId,
        filePath: activeFile,
        cursor,
      });
    }
  };

  const handleRunCode = async () => {
    if (!activeFile || isRunning) return;

    // Auto-save the active file before running
    await handleSaveFile();

    const fileName = activeFile.split('/').pop();
    const ext = fileName.split('.').pop().toLowerCase();
    
    const executableExtensions = ['py', 'cpp', 'c', 'java', 'js', 'php'];
    if (!executableExtensions.includes(ext)) {
      alert("Language environment is not executable (C, C++, Java, JS, Python, PHP).");
      return;
    }

    const languageMap = {
      'py': 'python',
      'cpp': 'cpp',
      'c': 'c',
      'java': 'java',
      'js': 'javascript',
      'php': 'php',
    };

    const language = languageMap[ext];

    try {
      dispatch(setRunningState(true));
      dispatch(setRunResult({
        output: 'Spawning sandboxed Docker runtime container...\n',
        exitCode: null,
        runtime: null,
        sandboxMode: null,
      }));

      const res = await axios.post(
        `http://localhost:5000/api/projects/${projectId}/run`,
        { language, activeFileName: activeFile },
        getHeaders()
      );

      if (res.data.success) {
        dispatch(setRunResult({
          output: res.data.output,
          exitCode: res.data.exitCode,
          runtime: res.data.runtime,
          sandboxMode: res.data.sandboxMode,
        }));
      }
    } catch (err) {
      console.error(err);
      dispatch(setRunResult({
        output: `Execution failed:\n${err.response?.data?.message || err.message}`,
        exitCode: 1,
        runtime: 0,
        sandboxMode: 'System Error',
      }));
    } finally {
      dispatch(setRunningState(false));
    }
  };

  // Basic global search scanner on the frontend tree
  const handleSearchChange = (query) => {
    setSearchQuery(query);
    if (!query) {
      setSearchResults([]);
      return;
    }
    // We mock search scan logic on cached open file contents
    const results = [];
    Object.keys(fileContents).forEach((path) => {
      const content = fileContents[path];
      if (content.toLowerCase().includes(query.toLowerCase())) {
        const lines = content.split('\n');
        lines.forEach((lineText, idx) => {
          if (lineText.toLowerCase().includes(query.toLowerCase())) {
            results.push({
              fileName: path.split('/').pop(),
              filePath: path,
              line: idx + 1,
              text: lineText.trim(),
            });
          }
        });
      }
    });
    setSearchResults(results.slice(0, 10)); // Limit 10 items
  };

  const handleGoToDashboard = async () => {
    if (activeFile && dirtyFiles[activeFile]) {
      await handleSaveFile();
    }
    const dirtyPaths = Object.keys(dirtyFiles).filter(path => dirtyFiles[path]);
    if (dirtyPaths.length > 0) {
      setIsUnsavedModalOpen(true);
    } else {
      localStorage.setItem('explicit-dashboard-navigation', 'true');
      navigate('/');
    }
  };

  const handleSaveAndExit = async () => {
    setIsUnsavedModalOpen(false);
    setLoading(true);
    
    const dirtyPaths = Object.keys(dirtyFiles).filter(path => dirtyFiles[path]);
    
    for (const filePath of dirtyPaths) {
      const content = fileContents[filePath] || '';
      try {
        await saveFileContentToServer(filePath, content);
      } catch (err) {
        console.error('Failed to auto-save file on exit:', filePath, err);
      }
    }
    
    setLoading(false);
    localStorage.setItem('explicit-dashboard-navigation', 'true');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="w-screen h-screen bg-vscode-editor text-vscode-text flex flex-col gap-2 items-center justify-center font-vscode select-none">
        <div className="w-8 h-8 border-4 border-vscode-accent border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-vscode-textMuted">Booting RR CodeVerse workspace...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-screen h-screen bg-vscode-editor text-red-400 flex flex-col gap-3 items-center justify-center font-vscode select-none">
        <span>{error}</span>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-vscode-accent hover:bg-vscode-accentHover text-white rounded text-xs"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <>
      {openWorkspaceLoading && (
        <div className="fixed inset-0 bg-[#0D1117]/80 backdrop-blur-md flex flex-col gap-3 items-center justify-center z-50 select-none">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold text-white">{openWorkspaceLoadingText}</span>
        </div>
      )}

      <VSCodeShell
        isCollabActive={isCollabActive}
        collabRoomId={collabRoomId}
        onSaveFile={handleSaveFile}
        onRunCode={handleRunCode}
        onCursorMove={handleCursorMove}
        onOpenSettingsFile={handleOpenSettingsFile}
        onCreateFile={handleCreateFile}
        onCreateFolder={handleCreateFolder}
        onUploadFile={handleUploadFile}
        onDownloadProject={handleDownloadProject}
        onSearchChange={handleSearchChange}
        searchResults={searchResults}
        searchQuery={searchQuery}
        onGoToDashboard={handleGoToDashboard}
        onOpenWorkspace={() => setIsOpenWorkspaceModalOpen(true)}
        localDirHandle={localDirHandle}
      />

      {/* Save Failed Warning Notification */}
      {saveStatus === 'failed' && (
        <div className="fixed bottom-10 right-6 bg-red-900/90 backdrop-blur border border-red-500/30 px-4 py-3 rounded-xl shadow-2xl text-white text-xs flex items-center gap-3 z-50 animate-bounce select-none">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <div className="flex flex-col text-left">
            <span className="font-bold">Save Failed!</span>
            <span className="text-[10px] text-gray-300">Retrying automatically... Check network link.</span>
          </div>
        </div>
      )}

      {/* Open Workspace Picker Dialog Modal */}
      {isOpenWorkspaceModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-sm select-none">
          <div className="w-full max-w-[440px] bg-[#161B22]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 flex flex-col gap-6 text-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Logo className="w-5 h-5" />
                  <span>Open Workspace</span>
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Choose whether to load a single file or an entire folder into your workspace sandbox.
                </p>
              </div>
              <button
                onClick={() => setIsOpenWorkspaceModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Open File Card */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-4 p-5 rounded-2xl bg-[#0D1117]/60 border border-white/5 hover:border-purple-500/50 hover:bg-purple-600/10 transition-all duration-300 group cursor-pointer text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-600/10 flex items-center justify-center border border-purple-500/20 group-hover:scale-105 transition-transform text-purple-400">
                  <FileCode size={24} />
                </div>
                <div className="text-center">
                  <span className="font-bold text-xs text-white block">Open File</span>
                  <span className="text-[10px] text-gray-400 mt-0.5 block">HTML, JS, PY, CPP, Java...</span>
                </div>
              </button>

              {/* Open Folder Card */}
              <button
                onClick={handleOpenFolderClick}
                className="flex flex-col items-center justify-center gap-4 p-5 rounded-2xl bg-[#0D1117]/60 border border-white/5 hover:border-blue-500/50 hover:bg-blue-600/10 transition-all duration-300 group cursor-pointer text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-600/10 flex items-center justify-center border border-blue-500/20 group-hover:scale-105 transition-transform text-blue-400">
                  <FolderOpen size={24} />
                </div>
                <div className="text-center">
                  <span className="font-bold text-xs text-white block">Open Folder</span>
                  <span className="text-[10px] text-gray-400 mt-0.5 block">Load project directory</span>
                </div>
              </button>
            </div>

            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleOpenFileChange}
              accept=".html,.css,.js,.jsx,.ts,.tsx,.json,.cpp,.c,.java,.py,.php,.md,.txt"
              className="hidden"
            />

            {/* Hidden folder input */}
            <input
              type="file"
              ref={folderInputRef}
              onChange={handleOpenFolderChange}
              webkitdirectory=""
              directory=""
              multiple
              className="hidden"
            />
          </div>
        </div>
      )}

      {/* Unsaved Changes Confirmation Modal */}
      {isUnsavedModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-sm">
          <div className="w-full max-w-[420px] bg-[#141526]/90 backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl p-6 flex flex-col gap-5 text-gray-200">
            <div>
              <h3 className="text-sm font-bold text-white">Unsaved Changes</h3>
              <p className="text-xs text-gray-400 mt-1">
                You have unsaved changes in your workspace. Do you want to save before leaving?
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleSaveAndExit}
                className="w-full bg-gradient-to-r from-violet-600 to-blue-500 hover:from-violet-500 hover:to-blue-400 text-white font-semibold text-xs py-3 rounded-xl transition-all shadow-md active:scale-95"
              >
                Save & Go to Dashboard
              </button>
              <button
                onClick={() => {
                  setIsUnsavedModalOpen(false);
                  localStorage.setItem('explicit-dashboard-navigation', 'true');
                  navigate('/');
                }}
                className="w-full bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold text-xs py-3 rounded-xl transition-all border border-gray-700/50 active:scale-95"
              >
                Don't Save
              </button>
              <button
                onClick={() => setIsUnsavedModalOpen(false)}
                className="w-full bg-transparent hover:bg-white/5 text-gray-400 hover:text-white text-xs py-2 rounded-xl transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Workspace;
//
