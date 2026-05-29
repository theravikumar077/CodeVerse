import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Terminal as Xterm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import io from 'socket.io-client';
import { addTerminal, removeTerminal, setActiveTerminal } from '../../store/slices/terminalSlice';
import { openTab } from '../../store/slices/editorSlice';
import { Plus, Trash2, Terminal as TerminalIcon, ShieldAlert, AlertTriangle, Cpu, Play } from 'lucide-react';
import 'xterm/css/xterm.css';

const TerminalPanel = () => {
  const dispatch = useDispatch();
  const terminals = useSelector((state) => state.terminal.terminals) || [];
  const activeTerminalId = useSelector((state) => state.terminal.activeTerminalId);
  const projectId = useSelector((state) => state.editor.activeProject?._id);
  const settings = useSelector((state) => state.editor.settings);

  // Redux Sandbox Run States
  const isRunning = useSelector((state) => state.editor.isRunning);
  const runResult = useSelector((state) => state.editor.runResult);
  const fileMarkers = useSelector((state) => state.editor.fileMarkers) || {};

  // Top level Panel Navigation tab state: 'terminal' | 'output' | 'problems'
  const [activePanelTab, setActivePanelTab] = useState('terminal');

  // References
  const terminalRefs = useRef({});
  const xtermInstances = useRef({});
  const socketRefs = useRef({});
  const fitAddons = useRef({});

  // Auto switch to Output tab when code begins compiling/running
  useEffect(() => {
    if (isRunning) {
      setActivePanelTab('output');
    }
  }, [isRunning]);

  // Sync theme
  const getTerminalTheme = (theme) => {
    switch (theme) {
      case 'dracula':
        return { background: '#282a36', foreground: '#f8f8f2', cursor: '#f8f8f0' };
      case 'monokai':
        return { background: '#272822', foreground: '#f8f8f2', cursor: '#f8f8f0' };
      case 'github-dark':
        return { background: '#0d1117', foreground: '#c9d1d9', cursor: '#58a6ff' };
      case 'light-plus':
        return { background: '#ffffff', foreground: '#333333', cursor: '#007acc' };
      default:
        return { background: '#1e1e1e', foreground: '#cccccc', cursor: '#ffffff' };
    }
  };

  const createNewTerminal = () => {
    const termId = `term_${Date.now()}`;
    const name = `bash - ${terminals.length + 1}`;
    dispatch(addTerminal({ id: termId, name }));
  };

  const handleKillTerminal = (termId, e) => {
    e.stopPropagation();
    if (socketRefs.current[termId]) {
      socketRefs.current[termId].emit('kill-terminal', { terminalId: termId });
      socketRefs.current[termId].disconnect();
      delete socketRefs.current[termId];
    }
    if (xtermInstances.current[termId]) {
      xtermInstances.current[termId].dispose();
      delete xtermInstances.current[termId];
    }
    delete fitAddons.current[termId];
    dispatch(removeTerminal(termId));
  };

  useEffect(() => {
    if (terminals.length === 0 && projectId && activePanelTab === 'terminal') {
      createNewTerminal();
    }
  }, [terminals.length, projectId, activePanelTab]);

  // Sync themes
  useEffect(() => {
    const theme = getTerminalTheme(settings.theme);
    Object.keys(xtermInstances.current).forEach((id) => {
      xtermInstances.current[id].options.theme = theme;
    });
  }, [settings.theme]);

  // Handle mounting terminal PTY
  useEffect(() => {
    if (activePanelTab !== 'terminal' || !activeTerminalId || !projectId) return;

    if (!xtermInstances.current[activeTerminalId]) {
      const container = terminalRefs.current[activeTerminalId];
      if (!container) return;

      const theme = getTerminalTheme(settings.theme);

      const xterm = new Xterm({
        cursorBlink: true,
        theme,
        fontSize: 12,
        fontFamily: 'Fira Code, Consolas, monospace',
        rows: 24,
        cols: 80,
      });

      const fitAddon = new FitAddon();
      xterm.loadAddon(fitAddon);
      xterm.loadAddon(new WebLinksAddon());

      xterm.open(container);
      fitAddon.fit();

      const termSocket = io('http://localhost:5000/terminal');
      termSocket.on('connect', () => {
        termSocket.emit('create-terminal', { terminalId: activeTerminalId, projectId });
      });

      termSocket.on(`terminal-data-${activeTerminalId}`, (data) => {
        xterm.write(data);
      });

      xterm.onData((data) => {
        termSocket.emit('terminal-input', { terminalId: activeTerminalId, data });
      });

      xterm.onResize(({ cols, rows }) => {
        termSocket.emit('resize-terminal', { terminalId: activeTerminalId, cols, rows });
      });

      xtermInstances.current[activeTerminalId] = xterm;
      socketRefs.current[activeTerminalId] = termSocket;
      fitAddons.current[activeTerminalId] = fitAddon;

      setTimeout(() => {
        try {
          fitAddon.fit();
        } catch (_) {}
      }, 100);
    } else {
      setTimeout(() => {
        try {
          fitAddons.current[activeTerminalId]?.fit();
          xtermInstances.current[activeTerminalId]?.focus();
        } catch (_) {}
      }, 50);
    }
  }, [activeTerminalId, projectId, activePanelTab]);

  useEffect(() => {
    const handleResize = () => {
      if (activePanelTab === 'terminal' && activeTerminalId && fitAddons.current[activeTerminalId]) {
        try {
          fitAddons.current[activeTerminalId].fit();
        } catch (_) {}
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeTerminalId, activePanelTab]);

  // Aggregate problems from all files
  const getAggregatedProblems = () => {
    const problems = [];
    Object.keys(fileMarkers).forEach((filePath) => {
      const markers = fileMarkers[filePath] || [];
      markers.forEach((marker) => {
        problems.push({
          filePath,
          fileName: filePath.split('/').pop(),
          ...marker,
        });
      });
    });
    return problems;
  };

  const handleProblemClick = (problem) => {
    dispatch(openTab(problem.filePath));
    // Jump cursor logic is bound to editor model, we focus the file tab
  };

  const problemsList = getAggregatedProblems();

  return (
    <div className="w-full h-full flex flex-col bg-vscode-terminal text-vscode-text select-none font-vscode">
      {/* Top panel switcher navigation */}
      <div className="h-8 px-4 flex items-center justify-between border-b border-vscode-border bg-[#1b1b1c] flex-shrink-0">
        <div className="flex items-center gap-4 h-full">
          {/* Main switches */}
          {[
            { id: 'terminal', label: 'Terminal' },
            { id: 'output', label: 'Output' },
            {
              id: 'problems',
              label: `Problems`,
              badge: problemsList.length > 0 ? problemsList.length : null,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActivePanelTab(tab.id)}
              className={`text-xs font-semibold uppercase tracking-wider h-full flex items-center gap-1.5 transition-colors relative px-1
                ${activePanelTab === tab.id ? 'text-white border-b-2 border-vscode-accent' : 'text-vscode-textMuted hover:text-white'}`}
            >
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="bg-vscode-accent text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Dynamic actions based on active Panel Tab */}
        {activePanelTab === 'terminal' && (
          <div className="flex items-center gap-2">
            {/* Terminal tabs */}
            <div className="flex items-center gap-1 border-r border-vscode-border pr-2 max-w-[300px] overflow-x-auto scrollbar-none h-6">
              {terminals.map((term) => (
                <button
                  key={term.id}
                  onClick={() => dispatch(setActiveTerminal(term.id))}
                  className={`px-2 py-0.5 text-[11px] rounded transition-colors truncate max-w-[90px]
                    ${term.id === activeTerminalId ? 'bg-[#3c3c3c] text-white' : 'text-vscode-textMuted hover:bg-[#2d2d2d]'}`}
                >
                  {term.name.replace('bash - ', '')}
                </button>
              ))}
            </div>
            <button
              onClick={createNewTerminal}
              title="Add New Terminal"
              className="p-1 hover:bg-[#2d2d2d] rounded text-vscode-textMuted hover:text-white"
            >
              <Plus size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Render Panel Body */}
      <div className="flex-1 min-h-0 relative overflow-y-auto">
        {/* Tab 1: Terminals Container */}
        {activePanelTab === 'terminal' && (
          <div className="w-full h-full p-2" style={{ background: getTerminalTheme(settings.theme).background }}>
            {terminals.map((term) => (
              <div
                key={term.id}
                ref={(el) => (terminalRefs.current[term.id] = el)}
                className={`w-full h-full min-h-0 ${term.id === activeTerminalId ? 'block' : 'hidden'}`}
              />
            ))}
          </div>
        )}

        {/* Tab 2: Output Window (Compilation sandbox execution logs) */}
        {activePanelTab === 'output' && (
          <div className="w-full h-full bg-[#1e1e1e] p-3 text-xs font-mono text-gray-300 select-text overflow-y-auto leading-relaxed select-text">
            {runResult ? (
              <div className="flex flex-col gap-2">
                {/* Stats Header banner */}
                <div className="flex items-center gap-2 border-b border-gray-800 pb-2 mb-2 text-vscode-textMuted text-[11px]">
                  <Cpu size={12} className="text-vscode-accent" />
                  <span>Sandbox Environment: {runResult.sandboxMode || 'Sandbox'}</span>
                  {runResult.runtime !== null && (
                    <span className="ml-auto">Runtime: {runResult.runtime}ms</span>
                  )}
                  {runResult.exitCode !== null && (
                    <span className={`px-2 py-0.5 rounded font-bold ${runResult.exitCode === 0 ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>
                      Exit Code: {runResult.exitCode}
                    </span>
                  )}
                </div>

                {/* Logs Output */}
                <pre className="whitespace-pre-wrap">{runResult.output}</pre>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-vscode-textMuted gap-2">
                <Play size={20} className="opacity-45" />
                <span>No code execution logs yet. Press "Run" to test your program.</span>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Problems Outline List (Syntax diagnostics errors/warnings) */}
        {activePanelTab === 'problems' && (
          <div className="w-full h-full bg-[#1e1e1e] p-2 overflow-y-auto">
            {problemsList.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-vscode-textMuted text-xs">
                No problems have been detected in the workspace.
              </div>
            ) : (
              <div className="flex flex-col text-xs font-mono select-none">
                <div className="grid grid-cols-12 border-b border-gray-800 pb-2 mb-2 font-semibold text-vscode-textMuted text-[11px] px-2">
                  <div className="col-span-1">Severity</div>
                  <div className="col-span-3">File</div>
                  <div className="col-span-1">Line</div>
                  <div className="col-span-7">Description</div>
                </div>

                {problemsList.map((prob, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleProblemClick(prob)}
                    className="grid grid-cols-12 py-1.5 px-2 hover:bg-[#2d2d2d] cursor-pointer border-b border-gray-800/30 items-center transition-colors"
                  >
                    <div className="col-span-1 flex items-center">
                      {prob.severity === 'error' ? (
                        <ShieldAlert size={14} className="text-red-500" />
                      ) : (
                        <AlertTriangle size={14} className="text-yellow-500" />
                      )}
                    </div>
                    <div className="col-span-3 truncate text-vscode-accent font-semibold pr-2">
                      {prob.fileName}
                    </div>
                    <div className="col-span-1 text-vscode-textMuted">
                      {prob.line}
                    </div>
                    <div className="col-span-7 truncate text-gray-300 pr-2">
                      {prob.message}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TerminalPanel;
