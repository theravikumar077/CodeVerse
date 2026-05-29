import React, { useState, useEffect } from 'react';
import { Search, Star, Download, ShieldCheck, Box } from 'lucide-react';

const ExtensionsPanel = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [installedStates, setInstalledStates] = useState({}); // extId -> bool
  const [enabledStates, setEnabledStates] = useState({}); // extId -> bool

  // Default Extensions library matching prompt specs
  const defaultExtensions = [
    {
      id: 'live-server',
      name: 'Live Server',
      publisher: 'Ritwick Dey',
      version: '5.7.9',
      description: 'Launch a local development Live Server with absolute hot-reload capability for static pages.',
      downloads: '45.1M',
      rating: '4.8',
    },
    {
      id: 'prettier',
      name: 'Prettier - Code formatter',
      publisher: 'Prettier',
      version: '10.2.0',
      description: 'An opinionated code formatter. Enforces a consistent style by parsing your code.',
      downloads: '52.4M',
      rating: '4.7',
    },
    {
      id: 'eslint',
      name: 'ESLint',
      publisher: 'Microsoft',
      version: '2.4.4',
      description: 'Integrates ESLint into VS Code. Checks JavaScript syntax and styles checks.',
      downloads: '38.2M',
      rating: '4.6',
    },
    {
      id: 'gitlens',
      name: 'GitLens — Git supercharged',
      publisher: 'GitKraken',
      version: '15.0.2',
      description: 'Supercharge Git within VS Code — visualize code authorship at a glance via Git blame annotations.',
      downloads: '29.7M',
      rating: '4.9',
    },
    {
      id: 'material-icons',
      name: 'Material Icon Theme',
      publisher: 'Philipp Kief',
      version: '5.3.0',
      description: 'Custom material icons layout theme that matches standard development structures.',
      downloads: '21.5M',
      rating: '4.9',
    },
    {
      id: 'auto-rename-tag',
      name: 'Auto Rename Tag',
      publisher: 'Jun Han',
      version: '1.4.3',
      description: 'Automatically rename paired HTML/XML tags, identical to Visual Studio Code tag changes.',
      downloads: '16.9M',
      rating: '4.5',
    },
  ];

  // Load install/enabled configs from LocalStorage on mount
  useEffect(() => {
    const savedInstalled = localStorage.getItem('extensions-installed');
    const savedEnabled = localStorage.getItem('extensions-enabled');
    
    // Default config: Material Icon theme is pre-installed/enabled
    const defaultInstall = { 'material-icons': true, 'prettier': true };
    const defaultEnabled = { 'material-icons': true, 'prettier': true };

    setInstalledStates(savedInstalled ? JSON.parse(savedInstalled) : defaultInstall);
    setEnabledStates(savedEnabled ? JSON.parse(savedEnabled) : defaultEnabled);
  }, []);

  const saveToLocalStorage = (installed, enabled) => {
    localStorage.setItem('extensions-installed', JSON.stringify(installed));
    localStorage.setItem('extensions-enabled', JSON.stringify(enabled));
  };

  const handleInstall = (id) => {
    const updatedInstalled = { ...installedStates, [id]: true };
    const updatedEnabled = { ...enabledStates, [id]: true };
    setInstalledStates(updatedInstalled);
    setEnabledStates(updatedEnabled);
    saveToLocalStorage(updatedInstalled, updatedEnabled);
  };

  const handleUninstall = (id) => {
    const updatedInstalled = { ...installedStates };
    delete updatedInstalled[id];
    const updatedEnabled = { ...enabledStates };
    delete updatedEnabled[id];
    
    setInstalledStates(updatedInstalled);
    setEnabledStates(updatedEnabled);
    saveToLocalStorage(updatedInstalled, updatedEnabled);
  };

  const toggleEnable = (id) => {
    const updatedEnabled = { ...enabledStates, [id]: !enabledStates[id] };
    setEnabledStates(updatedEnabled);
    localStorage.setItem('extensions-enabled', JSON.stringify(updatedEnabled));
  };

  const filteredExtensions = defaultExtensions.filter(
    (ext) =>
      ext.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ext.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full font-vscode text-xs text-vscode-text select-none">
      {/* Search Input Bar */}
      <div className="p-3 border-b border-vscode-border bg-[#1b1b1c] flex flex-col gap-2 flex-shrink-0">
        <div className="relative flex items-center">
          <Search className="absolute left-2.5 text-gray-500" size={13} />
          <input
            type="text"
            placeholder="Search Extensions in Marketplace..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-vscode-editor border border-vscode-border px-8 py-1.5 rounded focus:outline-none focus:border-vscode-accent text-white"
          />
        </div>
      </div>

      {/* Extensions Listing grid */}
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2 bg-vscode-sidebar">
        {filteredExtensions.length === 0 ? (
          <div className="p-4 text-center text-vscode-textMuted">
            No extensions found in the registry.
          </div>
        ) : (
          filteredExtensions.map((ext) => {
            const isInstalled = !!installedStates[ext.id];
            const isEnabled = !!enabledStates[ext.id];

            return (
              <div
                key={ext.id}
                className="border border-[#2d2d2d] bg-[#1e1e1f]/60 hover:bg-[#1e1e1f]/90 p-3 rounded-xl flex items-start gap-2.5 transition-all shadow-sm group relative"
              >
                {/* Plugin icon box */}
                <div className="w-10 h-10 rounded-lg bg-gray-800 border border-gray-700/60 flex items-center justify-center text-vscode-accent flex-shrink-0">
                  <Box size={20} />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 pr-1 flex flex-col gap-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white truncate text-[11.5px]">
                      {ext.name}
                    </span>
                  </div>
                  <div className="text-[10px] text-vscode-textMuted font-medium truncate flex items-center gap-1.5 select-none">
                    <span>by {ext.publisher}</span>
                    <span className="flex items-center gap-0.5 text-yellow-500">
                      <Star size={9} fill="currentColor" />
                      <span>{ext.rating}</span>
                    </span>
                    <span className="flex items-center gap-0.5 text-gray-500">
                      <Download size={9} />
                      <span>{ext.downloads}</span>
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 line-clamp-2 mt-1 leading-normal select-none">
                    {ext.description}
                  </p>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-1.5 mt-2">
                    {!isInstalled ? (
                      <button
                        onClick={() => handleInstall(ext.id)}
                        className="bg-vscode-accent hover:bg-vscode-accentHover text-white px-2.5 py-0.5 rounded text-[10px] font-semibold transition-colors"
                      >
                        Install
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleUninstall(ext.id)}
                          className="bg-gray-800 hover:bg-gray-700 hover:text-red-400 text-vscode-textMuted px-2.5 py-0.5 rounded text-[10px] font-semibold border border-vscode-border transition-colors"
                        >
                          Uninstall
                        </button>
                        <button
                          onClick={() => toggleEnable(ext.id)}
                          className={`px-2.5 py-0.5 rounded text-[10px] font-semibold border border-vscode-border transition-colors
                            ${isEnabled ? 'bg-gray-800 hover:bg-gray-700 text-vscode-textMuted' : 'bg-green-900/30 text-green-400 border-green-800/40 hover:bg-green-900/50'}`}
                        >
                          {isEnabled ? 'Disable' : 'Enable'}
                        </button>
                      </>
                    )}
                    {isInstalled && isEnabled && (
                      <span className="ml-auto text-[9px] text-green-500 flex items-center gap-0.5 font-bold uppercase select-none tracking-wider">
                        <ShieldCheck size={11} />
                        <span>Active</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ExtensionsPanel;
