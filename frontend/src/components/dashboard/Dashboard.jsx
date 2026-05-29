import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { logout } from '../../store/slices/authSlice';
import { setActiveProject } from '../../store/slices/editorSlice';
import Logo from '../common/Logo';
import {
  LayoutDashboard,
  Folder,
  LogOut,
  Code,
  Clock,
  Trash2,
  Plus,
  GitBranch,
  Settings,
  User,
  Blocks,
  ChevronLeft,
  ChevronRight,
  HardDrive,
  FileCode,
  ArrowUpRight,
  Activity,
  FolderDown,
  Sparkles,
  FolderOpen,
  X
} from 'lucide-react';

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

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('workspaces'); // 'workspaces' | 'extensions' | 'settings'
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    language: 'html',
    gitRepoUrl: '',
  });
  const [createLoading, setCreateLoading] = useState(false);

  // Open Workspace Modal States
  const [isOpenWorkspaceModalOpen, setIsOpenWorkspaceModalOpen] = useState(false);
  const [openWorkspaceLoading, setOpenWorkspaceLoading] = useState(false);
  const [openWorkspaceLoadingText, setOpenWorkspaceLoadingText] = useState('');

  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  // Time States
  const [currentTime, setCurrentTime] = useState(new Date());

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user);

  // Sync Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  // Configure Axios headers
  const getHeaders = () => ({
    headers: { Authorization: `Bearer ${token}` },
  });

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/projects', getHeaders());
      if (res.data.success) {
        setProjects(res.data.projects);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch projects.');
      if (err.response?.status === 401) {
        dispatch(logout());
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
    
    // Auto-Restore Last Opened Workspace:
    const explicitNav = localStorage.getItem('explicit-dashboard-navigation');
    const lastProjectId = localStorage.getItem('last-opened-project-id');
    if (lastProjectId && explicitNav !== 'true') {
      navigate(`/workspace/${lastProjectId}`);
      return;
    }
    // Clear explicit flag so subsequent reloads restore workspace
    localStorage.removeItem('explicit-dashboard-navigation');

    fetchProjects();
  }, [token]);

  const handleCreateProject = async (e) => {
    if (e) e.preventDefault();
    if (!newProject.name) return;

    try {
      setCreateLoading(true);
      const res = await axios.post('http://localhost:5000/api/projects', newProject, getHeaders());
      if (res.data.success) {
        setProjects([res.data.project, ...projects]);
        setIsModalOpen(false);
        setNewProject({ name: '', description: '', language: 'html', gitRepoUrl: '' });
        dispatch(setActiveProject(res.data.project));
        navigate(`/workspace/${res.data.project._id}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error creating project');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteProject = async (projectId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this workspace and ALL files? This cannot be undone.')) return;

    try {
      const res = await axios.delete(`http://localhost:5000/api/projects/${projectId}`, getHeaders());
      if (res.data.success) {
        setProjects(projects.filter((p) => p._id !== projectId));
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete project');
    }
  };

  const selectProject = (project) => {
    dispatch(setActiveProject(project));
    navigate(`/workspace/${project._id}`);
  };

  const handleQuickPreset = async (presetName, language) => {
    try {
      setLoading(true);
      const res = await axios.post(
        'http://localhost:5000/api/projects',
        {
          name: `${presetName}_${Math.floor(100 + Math.random() * 900)}`,
          description: `Boilerplate setup for ${language.toUpperCase()}`,
          language,
        },
        getHeaders()
      );
      if (res.data.success) {
        dispatch(setActiveProject(res.data.project));
        navigate(`/workspace/${res.data.project._id}`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to launch quick starter');
    } finally {
      setLoading(false);
    }
  };

  const handleGitCloneClick = () => {
    setNewProject({
      name: 'cloned_repository',
      description: 'Cloned from external repository origin source.',
      language: 'javascript',
      gitRepoUrl: 'https://github.com/'
    });
    setIsModalOpen(true);
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

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  // Mock Activity Feed data based on project counts
  const mockActivities = [
    {
      icon: Code,
      text: 'Saved modified script structures in active file',
      time: 'Just now',
      color: 'text-violet-400 bg-violet-400/10'
    },
    {
      icon: Plus,
      text: projects.length > 0 ? `Initialized project workspace "${projects[0]?.name}"` : 'Setup initial profile options',
      time: '10 minutes ago',
      color: 'text-emerald-400 bg-emerald-400/10'
    },
    {
      icon: GitBranch,
      text: 'Synchronized local commits history to origin main',
      time: '1 hour ago',
      color: 'text-blue-400 bg-blue-400/10'
    },
    {
      icon: Blocks,
      text: 'Marketplace package linter extensions updated',
      time: '3 hours ago',
      color: 'text-pink-400 bg-pink-400/10'
    }
  ];

  return (
    <div className="flex h-screen w-screen bg-[#0D1117] text-gray-200 font-sans overflow-hidden select-none">
      
      {/* 1. COLLAPSIBLE SIDEBAR */}
      <aside
        className={`flex flex-col justify-between border-r border-gray-800/80 bg-[#161B22]/80 backdrop-blur-xl transition-all duration-300 z-30 relative
          ${sidebarCollapsed ? 'w-16' : 'w-64'}`}
      >
        {/* Toggle Collapse Button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 top-16 w-6 h-6 rounded-full bg-purple-600 hover:bg-purple-500 border border-gray-800 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 z-40"
        >
          {sidebarCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>

        {/* Sidebar Header */}
        <div className="flex flex-col gap-6">
          <div
            onClick={() => navigate('/')}
            className={`flex items-center gap-3 p-4 border-b border-gray-800/60 cursor-pointer hover:bg-white/5 transition-all
              ${sidebarCollapsed ? 'justify-center' : 'px-5'}`}
          >
            <Logo className="w-8 h-8 glow-purple" glow={true} />
            {!sidebarCollapsed && (
              <span className="font-bold text-sm tracking-wide bg-gradient-to-r from-white via-gray-100 to-purple-400 bg-clip-text text-transparent">
                <span className="text-purple-500">RR</span> CodeVerse
              </span>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1 px-2.5">
            {[
              { id: 'workspaces', label: 'Workspaces', icon: LayoutDashboard },
              { id: 'extensions', label: 'Extensions', icon: Blocks },
            ].map((link) => {
              const Icon = link.icon;
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => setActiveTab(link.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200
                    ${isActive 
                      ? 'bg-purple-600/15 text-purple-300 border-l-2 border-purple-500 shadow-inner' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }
                    ${sidebarCollapsed ? 'justify-center' : ''}`}
                  title={link.label}
                >
                  <Icon size={16} className={isActive ? 'text-purple-400' : ''} />
                  {!sidebarCollapsed && <span>{link.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="flex flex-col gap-1 p-2.5 border-t border-gray-800/60">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors
              ${sidebarCollapsed ? 'justify-center' : ''}`}
            title="Log Out"
          >
            <LogOut size={16} />
            {!sidebarCollapsed && <span>Log Out</span>}
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-gradient-to-tr from-[#0D1117] via-[#0D1117] to-[#12111d] px-6 py-8 md:p-10 relative">
        {openWorkspaceLoading && (
          <div className="fixed inset-0 bg-[#0D1117]/80 backdrop-blur-md flex flex-col gap-3 items-center justify-center z-50">
            <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-semibold text-white">{openWorkspaceLoadingText}</span>
          </div>
        )}

        <div className="max-w-6xl mx-auto w-full flex flex-col gap-8">
          
          {/* PROFESSIONAL DASHBOARD HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800/80 pb-6 animate-fade-in">
            <div className="flex items-center gap-3">
              <Logo className="w-10 h-10 glow-purple" glow={true} />
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5 font-sans">
                  <span className="text-purple-500">RR</span> CodeVerse
                </h1>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Dashboard Panel</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 flex-wrap">
              {/* Quick Actions in Header */}
              <button
                onClick={() => setIsOpenWorkspaceModalOpen(true)}
                className="bg-purple-600/15 hover:bg-purple-600/25 text-purple-300 border border-purple-500/20 font-semibold text-xs px-3.5 py-2 rounded-xl transition-all active:scale-95 flex items-center gap-1.5"
              >
                <FolderOpen size={13} />
                <span>Open Workspace</span>
              </button>
              
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs px-3.5 py-2 rounded-xl transition-all active:scale-95 shadow-md flex items-center gap-1.5"
              >
                <Plus size={13} />
                <span>New Project</span>
              </button>

              {/* User profile section */}
              <div className="flex items-center gap-2 bg-[#161B22]/50 border border-white/5 px-3 py-1.5 rounded-xl ml-2">
                {user?.avatar ? (
                  <img
                    src={`http://localhost:5000/uploads/avatars/${user.avatar}`}
                    alt="Avatar"
                    className="w-6 h-6 rounded-full object-cover border border-purple-500/20"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[#8B5CF6] text-white font-bold text-xs flex items-center justify-center uppercase">
                    {user?.username.charAt(0) || 'D'}
                  </div>
                )}
                <span className="text-xs text-gray-300 font-semibold">{user?.username || 'Developer'}</span>
              </div>
            </div>
          </div>

          {/* WELCOME BANNER HEADER SECTION */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#161B22]/40 backdrop-blur-xl border border-white/5 p-6 rounded-3xl shadow-xl relative overflow-hidden animate-fade-in">
            <div className="absolute right-0 top-0 w-40 h-40 rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-[#8B5CF6] to-[#A855F7] blur opacity-45 animate-pulse" />
                {user?.avatar ? (
                  <img
                    src={`http://localhost:5000/uploads/avatars/${user.avatar}`}
                    alt="Avatar"
                    className="relative w-14 h-14 rounded-full border-2 border-[#161B22] object-cover"
                  />
                ) : (
                  <div className="relative w-14 h-14 rounded-full bg-[#8B5CF6] text-white font-bold text-lg flex items-center justify-center uppercase">
                    {user?.username.charAt(0) || 'D'}
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-1.5">
                  Welcome back, <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{user?.username || 'Developer'}</span>
                  <Sparkles size={16} className="text-purple-400 animate-pulse" />
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">Let's build something exceptional today.</p>
              </div>
            </div>

            <div className="text-left md:text-right font-mono flex flex-col justify-center border-l border-gray-800/80 pl-4 md:pl-0 md:border-l-0 md:border-r-0">
              <span className="text-xs text-gray-400 font-semibold">{formattedDate}</span>
              <span className="text-lg font-bold text-[#A855F7] mt-0.5 tracking-wider">{formattedTime}</span>
            </div>
          </div>

          {activeTab === 'workspaces' && (
            <>
              {/* STATISTICS SECTION */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 animate-fade-in">
                {[
                  { label: 'Workspaces', val: projects.length, desc: 'Active projects', icon: Folder },
                  { label: 'Files Count', val: projects.length * 8 + 3, desc: 'Files managed', icon: FileCode },
                  { label: 'Storage Size', val: `${(projects.length * 1.3 + 0.4).toFixed(1)} MB`, desc: 'Space occupied', icon: HardDrive },
                  { label: 'Extensions', val: 4, desc: 'Plugins active', icon: Blocks },
                  { label: 'Coding Logs', val: '36 hrs', desc: 'Developer hours', icon: Activity },
                ].map((s, idx) => {
                  const Icon = s.icon;
                  return (
                    <div key={idx} className="bg-[#161B22]/50 border border-white/5 p-4 rounded-2xl flex items-center gap-3 shadow-md hover:border-purple-500/25 transition-all">
                      <div className="p-2.5 rounded-xl bg-purple-600/10 text-purple-400">
                        <Icon size={18} />
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">{s.label}</div>
                        <div className="text-base font-bold text-white mt-0.5">{s.val}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* QUICK ACTIONS SECTION */}
              <div className="flex flex-col gap-4 animate-fade-in">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Quick Launcher</h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  {[
                    { label: 'Open Workspace', action: () => setIsOpenWorkspaceModalOpen(true), icon: FolderOpen, color: 'from-[#8B5CF6]/20 to-[#A855F7]/5 border-[#8B5CF6]/30 text-purple-300' },
                    { label: 'Create Project', action: () => setIsModalOpen(true), icon: Plus, color: 'from-[#8B5CF6]/20 to-[#A855F7]/5 border-[#8B5CF6]/30 text-purple-300' },
                    { label: 'Git Repo Clone', action: handleGitCloneClick, icon: GitBranch, color: 'from-blue-500/20 to-blue-600/5 border-blue-500/30 text-blue-300' },
                    { label: 'HTML5 Boilerplate', action: () => handleQuickPreset('HTML5Site', 'html'), icon: Code, color: 'from-orange-500/20 to-orange-600/5 border-orange-500/30 text-orange-300' },
                    { label: 'Python Script', action: () => handleQuickPreset('PythonEnv', 'python'), icon: Code, color: 'from-green-500/20 to-green-600/5 border-green-500/30 text-green-300' },
                  ].map((act, idx) => {
                    const Icon = act.icon;
                    return (
                      <button
                        key={idx}
                        onClick={act.action}
                        className={`p-4 border rounded-2xl bg-gradient-to-tr ${act.color} transition-all duration-300 text-left flex flex-col gap-3 shadow-md hover:scale-[1.02] active:scale-95 group`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#0D1117] flex items-center justify-center border border-gray-800/80 group-hover:scale-105 transition-transform">
                          <Icon size={16} />
                        </div>
                        <div className="font-semibold text-xs text-white">{act.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* CORE COLUMN LAYOUT: WORKSPACES & ACTIVITIES */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* LEFT CORE: WORKSPACES LIST */}
                <div className="lg:col-span-8 flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-gray-800/60 pb-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Workspaces</h3>
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono font-bold uppercase">{projects.length} running</span>
                  </div>

                  {loading ? (
                    <div className="text-center py-20 text-xs text-gray-500 flex flex-col items-center gap-2 animate-pulse">
                      <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                      <span>Syncing workspaces board...</span>
                    </div>
                  ) : error ? (
                    <div className="text-center py-20 text-xs text-red-400">{error}</div>
                  ) : projects.length === 0 ? (
                    // GLOWING EMPTY STATE
                    <div className="border border-dashed border-gray-800 rounded-3xl p-12 text-center flex flex-col items-center gap-4 bg-[#161B22]/10 backdrop-blur">
                      <div className="w-16 h-16 rounded-2xl bg-purple-600/10 flex items-center justify-center border border-purple-500/25">
                        <FolderDown size={30} className="text-purple-400" />
                      </div>
                      <div className="text-sm font-bold text-white">Start Building Something Amazing</div>
                      <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
                        Create a blank project, select a template preset, or clone from Git to launch your premium cloud coding sandbox.
                      </p>
                      <div className="flex gap-3 mt-2">
                        <button
                          onClick={() => setIsModalOpen(true)}
                          className="bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 active:scale-95"
                        >
                          <Plus size={14} />
                          <span>Create New Project</span>
                        </button>
                        <button
                          onClick={() => setIsOpenWorkspaceModalOpen(true)}
                          className="bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700/50 font-semibold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 active:scale-95"
                        >
                          <FolderOpen size={14} />
                          <span>Open Workspace</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    // HIGH FIDELITY PROJECT GRID
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {projects.map((project) => (
                        <div
                          key={project._id}
                          onClick={() => selectProject(project)}
                          className="glass-panel-interactive rounded-2xl p-5 cursor-pointer flex flex-col justify-between h-[160px]"
                        >
                          <div>
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2 truncate pr-2">
                                <Folder size={18} className="text-purple-400 flex-shrink-0" />
                                <span className="font-bold text-xs text-white truncate">{project.name}</span>
                              </div>
                              <span className="text-[9px] uppercase px-2 py-0.5 rounded font-mono font-bold bg-[#0D1117] text-purple-400 border border-purple-500/20">
                                {project.language}
                              </span>
                            </div>

                            <p className="text-xs text-gray-400 mt-2.5 line-clamp-2 leading-relaxed">
                              {project.description || 'No description provided.'}
                            </p>
                          </div>

                          <div className="flex items-center justify-between border-t border-gray-800/40 pt-3 text-[10px] text-gray-500">
                            <span className="flex items-center gap-1.5 font-mono">
                              <Clock size={11} />
                              <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                            </span>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => handleDeleteProject(project._id, e)}
                                title="Delete Project"
                                className="p-1.5 text-gray-600 hover:text-red-400 transition-colors bg-[#0D1117] rounded-lg border border-gray-800 hover:border-red-500/30"
                              >
                                <Trash2 size={12} />
                              </button>
                              <div className="p-1.5 text-purple-400 bg-purple-600/10 rounded-lg border border-purple-500/20 hover:bg-purple-600/20 transition-colors">
                                <ArrowUpRight size={12} />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* RIGHT CORE: RECENT ACTIVITY TIMELINE */}
                <div className="lg:col-span-4 flex flex-col gap-4 bg-[#161B22]/30 border border-white/5 p-5 rounded-2xl">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-800 pb-2.5">
                    Recent Activity
                  </h3>
                  
                  <div className="flex flex-col gap-4">
                    {mockActivities.map((act, idx) => {
                      const Icon = act.icon;
                      return (
                        <div key={idx} className="flex gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${act.color}`}>
                            <Icon size={14} />
                          </div>
                          <div>
                            <div className="text-xs font-medium text-white leading-snug">{act.text}</div>
                            <div className="text-[10px] text-gray-500 font-mono mt-0.5">{act.time}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </>
          )}

          {activeTab === 'extensions' && (
            <div className="bg-[#161B22]/40 backdrop-blur border border-white/5 p-6 rounded-3xl animate-fade-in">
              <h3 className="text-sm font-bold text-white mb-2">Extension Registry</h3>
              <p className="text-xs text-gray-400 leading-relaxed mb-6">
                Enable lint markers and formatter configurations for your active developer workflows.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'ESLint', desc: 'JavaScript and TypeScript runtime error detection markers.', status: 'Installed' },
                  { name: 'Prettier', desc: 'Code formatting configurations sync.', status: 'Installed' },
                  { name: 'Auto Rename Tag', desc: 'HTML closing tags renamer syntax sync.', status: 'Installed' },
                  { name: 'Docker Compilers', desc: 'Isolates program runs in GCC/G++ containers.', status: 'Active' },
                ].map((ext, idx) => (
                  <div key={idx} className="p-4 bg-[#161B22]/80 border border-white/5 rounded-2xl flex justify-between items-center">
                    <div>
                      <div className="text-xs font-bold text-white">{ext.name}</div>
                      <div className="text-[10px] text-gray-400 mt-1">{ext.desc}</div>
                    </div>
                    <span className="text-[9px] uppercase font-bold text-purple-400 px-2 py-0.5 rounded bg-purple-600/10 border border-purple-500/20">
                      {ext.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* 3. NEW PROJECT CREATION DIALOG MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-sm">
          <div className="w-full max-w-[460px] bg-[#161B22] border border-white/5 rounded-2xl shadow-2xl p-6 flex flex-col gap-5 text-gray-200">
            <div>
              <h3 className="text-sm font-bold text-white">Create New Workspace</h3>
              <p className="text-xs text-gray-400 mt-0.5">Configure environment settings for your project container</p>
            </div>

            <form onSubmit={handleCreateProject} className="flex flex-col gap-4">
              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="my_awesome_project"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full text-xs bg-[#0D1117] border border-white/5 focus:border-purple-500/80 px-3 py-2.5 rounded-xl focus:outline-none text-white font-mono"
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Description</label>
                <textarea
                  placeholder="Briefly describe what this workspace will build..."
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="w-full h-20 text-xs bg-[#0D1117] border border-white/5 focus:border-purple-500/80 px-3 py-2 rounded-xl focus:outline-none text-white"
                />
              </div>

              {/* Languages */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Language Sandbox</label>
                <select
                  value={newProject.language}
                  onChange={(e) => setNewProject({ ...newProject, language: e.target.value })}
                  className="w-full text-xs bg-[#0D1117] border border-white/5 focus:border-purple-500/80 px-3 py-2.5 rounded-xl focus:outline-none text-white cursor-pointer"
                >
                  <option value="html">HTML5 Web Boilerplate (Static Server)</option>
                  <option value="javascript">JavaScript (Node.js Sandbox)</option>
                  <option value="typescript">TypeScript (tsc sandbox)</option>
                  <option value="python">Python 3 (Sandbox Execution)</option>
                  <option value="cpp">C++ (g++ compile & run)</option>
                  <option value="c">C (gcc compile & run)</option>
                  <option value="java">Java Development Kit (JDK)</option>
                  <option value="php">PHP Scripting Engine</option>
                  <option value="markdown">Markdown Documentation</option>
                </select>
              </div>

              {/* Git URL Clone */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <span>Git Repository URL</span>
                  <span className="text-[9px] text-purple-400 lowercase font-normal">(optional clone)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://github.com/user/repo.git"
                  value={newProject.gitRepoUrl}
                  onChange={(e) => setNewProject({ ...newProject, gitRepoUrl: e.target.value })}
                  className="w-full text-xs bg-[#0D1117] border border-white/5 focus:border-purple-500/80 px-3 py-2.5 rounded-xl focus:outline-none text-white font-mono"
                />
              </div>

              {/* Modal buttons */}
              <div className="flex justify-end gap-2.5 mt-2 border-t border-gray-800/50 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-800 hover:bg-gray-800 text-gray-400 rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 text-white font-semibold rounded-xl text-xs transition-all active:scale-95 disabled:opacity-50"
                >
                  {createLoading ? 'Spawning Sandbox...' : 'Create Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. OPEN WORKSPACE DIALOG MODAL */}
      {isOpenWorkspaceModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-sm">
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

    </div>
  );
};

export default Dashboard;
