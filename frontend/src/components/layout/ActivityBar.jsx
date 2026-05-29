import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Files, Search, GitBranch, Play, Blocks, User, Settings, LayoutDashboard } from 'lucide-react';
import { toggleSidebar } from '../../store/slices/editorSlice';
import Logo from '../common/Logo';

const ActivityBar = ({ onSettingsOpen, onProfileOpen, onGoToDashboard }) => {
  const dispatch = useDispatch();
  const currentView = useSelector((state) => state.editor.sidebarView);
  const user = useSelector((state) => state.auth.user);

  const items = [
    { id: 'explorer', icon: Files, label: 'Explorer' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'git', icon: GitBranch, label: 'Source Control' },
    { id: 'run', icon: Play, label: 'Run and Debug' },
    { id: 'extensions', icon: Blocks, label: 'Extensions' },
  ];

  return (
    <div className="w-12 h-full flex flex-col justify-between items-center bg-vscode-activity border-r border-vscode-border select-none text-vscode-textMuted py-2 z-10 font-vscode">
      {/* Upper Section */}
      <div className="flex flex-col gap-2 w-full items-center">
        {/* Product Brand Logo */}
        <div 
          onClick={onGoToDashboard} 
          title="Go to Dashboard" 
          className="w-8 h-8 my-1 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
        >
          <Logo className="w-full h-full glow-purple" glow={true} />
        </div>
        <div className="w-8 border-b border-vscode-border my-1 opacity-40" />

        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => dispatch(toggleSidebar(item.id))}
              title={item.label}
              className={`relative w-full h-12 flex items-center justify-center transition-all hover:text-white group
                ${isActive ? 'text-white border-l-2 border-vscode-accent' : 'text-gray-400'}`}
            >
              <Icon size={22} strokeWidth={isActive ? 2 : 1.5} />
              
              {/* Tooltip */}
              <div className="absolute left-14 bg-[#252526] text-xs text-vscode-text border border-vscode-border px-2 py-1 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                {item.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom Section */}
      <div className="flex flex-col gap-2 w-full">
        {/* User Account */}
        <button
          onClick={onProfileOpen}
          title={user ? `Profile (${user.username})` : 'Account'}
          className="relative w-full h-12 flex items-center justify-center text-gray-400 hover:text-white group"
        >
          {user && user.avatar ? (
            <img
              src={`http://localhost:5000/uploads/avatars/${user.avatar}`}
              alt="Avatar"
              className="w-6 h-6 rounded-full border border-vscode-border object-cover"
              onError={(e) => {
                // Fail-safe if image error
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div
            style={{ display: user && user.avatar ? 'none' : 'flex' }}
            className="w-6 h-6 rounded-full bg-vscode-accent text-white font-bold text-xs items-center justify-center uppercase"
          >
            {user ? user.username.charAt(0) : <User size={18} />}
          </div>
          
          <div className="absolute left-14 bg-[#252526] text-xs text-vscode-text border border-vscode-border px-2 py-1 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
            {user ? `Account (${user.username})` : 'Account'}
          </div>
        </button>

        {/* Dashboard */}
        <button
          onClick={onGoToDashboard}
          title="Go to Dashboard"
          className="relative w-full h-12 flex items-center justify-center text-gray-400 hover:text-white group"
        >
          <LayoutDashboard size={22} strokeWidth={1.5} />
          
          <div className="absolute left-14 bg-[#252526] text-xs text-vscode-text border border-vscode-border px-2 py-1 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
            Go to Dashboard
          </div>
        </button>

        {/* Settings */}
        <button
          onClick={onSettingsOpen}
          title="Settings"
          className="relative w-full h-12 flex items-center justify-center text-gray-400 hover:text-white group"
        >
          <Settings size={22} strokeWidth={1.5} />
          
          <div className="absolute left-14 bg-[#252526] text-xs text-vscode-text border border-vscode-border px-2 py-1 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
            Settings
          </div>
        </button>
      </div>
    </div>
  );
};

export default ActivityBar;
