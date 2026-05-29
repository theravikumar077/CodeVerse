import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import {
  gitStart,
  gitFailure,
  gitStatusSuccess,
  gitHistorySuccess,
} from '../../store/slices/gitSlice';
import {
  GitBranch,
  Plus,
  Minus,
  Check,
  RotateCw,
  Clock,
  ChevronDown,
  ChevronRight,
  FolderSync,
} from 'lucide-react';

const GitPanel = () => {
  const dispatch = useDispatch();
  const projectId = useSelector((state) => state.editor.activeProject?._id);
  const token = useSelector((state) => state.auth.token);
  
  // Redux Git States
  const { changedFiles, currentBranch, branches, history, loading, error } = useSelector((state) => state.git);

  // Component local states
  const [isRepo, setIsRepo] = useState(true);
  const [commitMsg, setCommitMsg] = useState('');
  const [activeBranch, setActiveBranch] = useState(currentBranch);
  const [showHistory, setShowHistory] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const getHeaders = () => ({
    headers: { Authorization: `Bearer ${token}` },
  });

  const fetchStatus = async () => {
    if (!projectId) return;
    try {
      dispatch(gitStart());
      const res = await axios.get(`http://localhost:5000/api/git/${projectId}/status`, getHeaders());
      if (res.data.success) {
        setIsRepo(res.data.isRepository);
        dispatch(gitStatusSuccess({
          changedFiles: res.data.changedFiles,
          currentBranch: res.data.currentBranch,
          branches: res.data.branches,
        }));
        setActiveBranch(res.data.currentBranch);

        // Fetch logs as well if it's a repository
        if (res.data.isRepository) {
          const logsRes = await axios.get(`http://localhost:5000/api/git/${projectId}/log`, getHeaders());
          if (logsRes.data.success) {
            dispatch(gitHistorySuccess(logsRes.data.log));
          }
        }
      }
    } catch (err) {
      dispatch(gitFailure(err.response?.data?.message || 'Error loading git status'));
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [projectId]);

  const handleInitRepo = async () => {
    try {
      dispatch(gitStart());
      const res = await axios.post(`http://localhost:5000/api/git/${projectId}/init`, {}, getHeaders());
      if (res.data.success) {
        await fetchStatus();
      }
    } catch (err) {
      dispatch(gitFailure(err.response?.data?.message || 'Failed to init repository'));
    }
  };

  const handleStage = async (filePath) => {
    try {
      const res = await axios.post(`http://localhost:5000/api/git/${projectId}/add`, { filePath }, getHeaders());
      if (res.data.success) {
        await fetchStatus();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnstage = async (filePath) => {
    try {
      const res = await axios.post(`http://localhost:5000/api/git/${projectId}/unstage`, { filePath }, getHeaders());
      if (res.data.success) {
        await fetchStatus();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCommit = async (e) => {
    e.preventDefault();
    if (!commitMsg.trim()) return;

    try {
      dispatch(gitStart());
      const res = await axios.post(`http://localhost:5000/api/git/${projectId}/commit`, { message: commitMsg }, getHeaders());
      if (res.data.success) {
        setCommitMsg('');
        await fetchStatus();
      }
    } catch (err) {
      dispatch(gitFailure(err.response?.data?.message || 'Git commit failed'));
    }
  };

  const handleBranchSwitch = async (branchName) => {
    try {
      dispatch(gitStart());
      const res = await axios.post(`http://localhost:5000/api/git/${projectId}/checkout`, { branchName }, getHeaders());
      if (res.data.success) {
        setIsCheckoutOpen(false);
        await fetchStatus();
      }
    } catch (err) {
      dispatch(gitFailure(err.response?.data?.message || 'Branch switch failed'));
    }
  };

  // Group changed files
  const stagedChanges = changedFiles.filter((f) => f.staged);
  const unstagedChanges = changedFiles.filter((f) => !f.staged);

  if (!isRepo) {
    return (
      <div className="p-4 flex flex-col gap-3 font-vscode text-xs text-vscode-text">
        <div className="font-semibold text-vscode-textMuted uppercase tracking-wider text-[11px] mb-1">
          Git Version Control
        </div>
        <p className="text-vscode-textMuted leading-relaxed">
          This workspace is not currently initialized as a local Git repository.
        </p>
        <button
          onClick={handleInitRepo}
          className="w-full bg-vscode-accent hover:bg-vscode-accentHover text-white font-semibold py-2 rounded-xl text-xs shadow-md mt-2 flex items-center justify-center gap-1"
        >
          <FolderSync size={14} />
          <span>Initialize Repository</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full font-vscode text-xs text-vscode-text select-none">
      {/* Git Toolbar */}
      <div className="h-8 px-3 border-b border-vscode-border bg-[#1e1e1f] flex items-center justify-between flex-shrink-0">
        {/* Branch selector */}
        <div className="relative">
          <button
            onClick={() => setIsCheckoutOpen(!isCheckoutOpen)}
            className="flex items-center gap-1.5 hover:bg-[#2d2d2d] px-2 py-0.5 rounded text-vscode-textMuted hover:text-white"
          >
            <GitBranch size={13} />
            <span className="font-semibold text-vscode-text truncate max-w-[100px]">
              {currentBranch}
            </span>
            <ChevronDown size={10} />
          </button>

          {isCheckoutOpen && (
            <div className="absolute top-6 left-0 bg-[#252526] border border-vscode-border rounded shadow-2xl py-1 z-30 min-w-[140px]">
              {branches.map((b) => (
                <button
                  key={b}
                  onClick={() => handleBranchSwitch(b)}
                  className={`w-full text-left px-3 py-1.5 hover:bg-vscode-accent hover:text-white transition-colors text-xs truncate
                    ${b === currentBranch ? 'text-vscode-accent font-bold' : 'text-gray-300'}`}
                >
                  {b}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={fetchStatus}
          title="Refresh Git Status"
          className="p-1 hover:bg-[#2d2d2d] rounded text-vscode-textMuted hover:text-white transition-colors"
        >
          <RotateCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Main lists */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-4">
        {/* Commit Input form */}
        <form onSubmit={handleCommit} className="flex flex-col gap-2">
          <textarea
            placeholder="Commit message (Ctrl+Enter to commit)"
            value={commitMsg}
            onChange={(e) => setCommitMsg(e.target.value)}
            className="w-full h-16 bg-vscode-editor border border-vscode-border p-2 rounded focus:outline-none focus:border-vscode-accent text-xs text-white"
          />
          <button
            type="submit"
            disabled={loading || !commitMsg.trim()}
            className="w-full bg-vscode-accent hover:bg-vscode-accentHover disabled:opacity-50 text-white font-semibold py-1.5 rounded-lg flex items-center justify-center gap-1 shadow transition-colors"
          >
            <Check size={14} />
            <span>Commit changes</span>
          </button>
        </form>

        {/* Staged Changes List */}
        {stagedChanges.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <div className="font-bold text-[10px] text-vscode-textMuted uppercase tracking-wider flex items-center justify-between border-b border-gray-800 pb-1">
              <span>Staged Changes</span>
              <span className="bg-vscode-accent text-white rounded-full px-1.5 py-0.5 text-[8.5px] font-bold">
                {stagedChanges.length}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              {stagedChanges.map((file) => (
                <div
                  key={file.path}
                  className="group flex items-center justify-between py-1 px-1.5 rounded hover:bg-[#2d2d2d]"
                >
                  <span className="truncate pr-2 font-mono text-[11px] text-green-400">
                    {file.path}
                  </span>
                  <button
                    onClick={() => handleUnstage(file.path)}
                    title="Unstage change"
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-700 rounded text-vscode-textMuted hover:text-white"
                  >
                    <Minus size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Unstaged Changes List */}
        <div className="flex flex-col gap-1.5">
          <div className="font-bold text-[10px] text-vscode-textMuted uppercase tracking-wider flex items-center justify-between border-b border-gray-800 pb-1">
            <span>Changes</span>
            {unstagedChanges.length > 0 && (
              <span className="bg-yellow-600 text-white rounded-full px-1.5 py-0.5 text-[8.5px] font-bold">
                {unstagedChanges.length}
              </span>
            )}
          </div>
          {unstagedChanges.length === 0 ? (
            <span className="text-[11px] text-vscode-textMuted italic pl-1">
              No unstaged changes detected.
            </span>
          ) : (
            <div className="flex flex-col gap-1">
              {unstagedChanges.map((file) => (
                <div
                  key={file.path}
                  className="group flex items-center justify-between py-1 px-1.5 rounded hover:bg-[#2d2d2d]"
                >
                  <span className={`truncate pr-2 font-mono text-[11px]
                    ${file.status === 'untracked' ? 'text-teal-400' : 'text-yellow-400'}`}>
                    {file.path}
                  </span>
                  <button
                    onClick={() => handleStage(file.path)}
                    title="Stage change"
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-700 rounded text-vscode-textMuted hover:text-white"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Logs Commit History accordion */}
        {isRepo && (
          <div className="border-t border-gray-800/60 pt-3">
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-1 font-bold text-[10px] text-vscode-textMuted uppercase tracking-wider w-full hover:text-white transition-colors"
            >
              {showHistory ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              <span>Commit Logs History ({history.length})</span>
            </button>

            {showHistory && (
              <div className="mt-2 flex flex-col gap-2.5 max-h-[160px] overflow-y-auto pr-1">
                {history.length === 0 ? (
                  <span className="text-[11px] text-vscode-textMuted italic">No commits yet.</span>
                ) : (
                  history.map((log) => (
                    <div key={log.hash} className="border border-gray-800/40 p-2 rounded bg-vscode-editor font-mono text-[10px] leading-loose">
                      <div className="flex justify-between font-bold text-vscode-accent text-[9.5px]">
                        <span>{log.author_name}</span>
                        <span>{log.hash.slice(0, 7)}</span>
                      </div>
                      <p className="text-gray-300 mt-1 line-clamp-1">{log.message}</p>
                      <div className="text-[8px] text-vscode-textMuted text-right mt-0.5 flex items-center gap-0.5 justify-end">
                        <Clock size={9} />
                        <span>{new Date(log.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GitPanel;
//
