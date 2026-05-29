import { createSlice } from '@reduxjs/toolkit';

const initialSettings = {
  theme: localStorage.getItem('editor-theme') || 'dark-plus',
  fontSize: Number(localStorage.getItem('editor-font-size')) || 14,
  fontFamily: 'Outfit, Inter, Fira Code, Consolas, Courier New, monospace',
  tabSize: 4,
  wordWrap: 'on',
  autoSave: 'afterDelay',
  minimap: true,
};

const initialState = {
  activeProject: null,
  fileTree: [],
  openTabs: [],      // array of paths: e.g. ["src/index.js", "README.md"]
  activeFile: null,  // path of active file
  fileContents: {},  // path -> current text
  originalContents: {}, // path -> saved text (to check dirty state)
  dirtyFiles: {},    // path -> boolean
  fileMarkers: {},   // path -> compiler validation markers
  collabCursors: {}, // socketId -> { username, filePath, cursor: { lineNumber, column } }
  sidebarView: 'explorer', // explorer, search, git, run, extensions, none
  settings: initialSettings,
  searchQuery: '',
  searchResults: [],
  isRunning: false,   // is sandbox executing code
  runResult: null,    // { output, exitCode, runtime, sandboxMode }
  saveStatus: 'saved', // 'saved' | 'saving' | 'failed'
};

const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    setActiveProject: (state, action) => {
      if (!action.payload) {
        state.activeProject = null;
        return;
      }
      const isSameProject = state.activeProject && state.activeProject._id === action.payload._id;
      state.activeProject = action.payload;
      
      if (!isSameProject) {
        // Reset workspace tabs only when switching projects
        state.openTabs = [];
        state.activeFile = null;
        state.fileContents = {};
        state.originalContents = {};
        state.dirtyFiles = {};
      }
    },
    setFileTree: (state, action) => {
      state.fileTree = action.payload;
    },
    openTab: (state, action) => {
      const path = action.payload;
      if (!state.openTabs.includes(path)) {
        state.openTabs.push(path);
      }
      state.activeFile = path;
    },
    closeTab: (state, action) => {
      const path = action.payload;
      const index = state.openTabs.indexOf(path);
      state.openTabs = state.openTabs.filter(tab => tab !== path);
      
      // Remove cached contents if not dirty to prevent leak
      if (!state.dirtyFiles[path]) {
        delete state.fileContents[path];
        delete state.originalContents[path];
      }

      if (state.activeFile === path) {
        if (state.openTabs.length > 0) {
          // Set active to the adjacent tab
          const nextIndex = Math.max(0, index - 1);
          state.activeFile = state.openTabs[nextIndex];
        } else {
          state.activeFile = null;
        }
      }
    },
    setFileContent: (state, action) => {
      const { path, content, isOriginal = false } = action.payload;
      state.fileContents[path] = content;
      if (isOriginal) {
        state.originalContents[path] = content;
        state.dirtyFiles[path] = false;
      } else {
        state.dirtyFiles[path] = state.originalContents[path] !== content;
      }
    },
    updateFileContent: (state, action) => {
      const { path, content } = action.payload;
      state.fileContents[path] = content;
      state.dirtyFiles[path] = state.originalContents[path] !== content;
    },
    markFileSaved: (state, action) => {
      const path = action.payload;
      state.originalContents[path] = state.fileContents[path];
      state.dirtyFiles[path] = false;
    },
    toggleSidebar: (state, action) => {
      const view = action.payload;
      if (state.sidebarView === view) {
        state.sidebarView = 'none';
      } else {
        state.sidebarView = view;
      }
    },
    updateEditorSettings: (state, action) => {
      state.settings = { ...state.settings, ...action.payload };
      if (action.payload.theme) {
        localStorage.setItem('editor-theme', action.payload.theme);
      }
      if (action.payload.fontSize) {
        localStorage.setItem('editor-font-size', action.payload.fontSize);
      }
    },
    setGlobalSearch: (state, action) => {
      state.searchQuery = action.payload.query;
      state.searchResults = action.payload.results || [];
    },
    setFileMarkers: (state, action) => {
      const { path, markers } = action.payload;
      state.fileMarkers[path] = markers;
    },
    setRunningState: (state, action) => {
      state.isRunning = action.payload;
    },
    setRunResult: (state, action) => {
      state.runResult = action.payload;
    },
    updateCollabCursor: (state, action) => {
      const { socketId, username, filePath, cursor } = action.payload;
      state.collabCursors[socketId] = { username, filePath, cursor };
    },
    removeCollabCursor: (state, action) => {
      delete state.collabCursors[action.payload];
    },
    clearCollabCursors: (state) => {
      state.collabCursors = {};
    },
    setSaveStatus: (state, action) => {
      state.saveStatus = action.payload;
    }
  },
});

export const {
  setActiveProject,
  setFileTree,
  openTab,
  closeTab,
  setFileContent,
  updateFileContent,
  markFileSaved,
  toggleSidebar,
  updateEditorSettings,
  setGlobalSearch,
  setFileMarkers,
  setRunningState,
  setRunResult,
  updateCollabCursor,
  removeCollabCursor,
  clearCollabCursors,
  setSaveStatus,
} = editorSlice.actions;

export default editorSlice.reducer;
