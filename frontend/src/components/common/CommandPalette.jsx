import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Search } from 'lucide-react';

const CommandPalette = ({
  isOpen,
  onClose,
  commands = [],
  files = [],
  onFileOpen,
  initialMode = 'command', // 'command' (starts with '>') or 'file'
}) => {
  const [query, setQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery(initialMode === 'command' ? '>' : '');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, initialMode]);

  // Handle filtering
  useEffect(() => {
    if (!isOpen) return;

    if (query.startsWith('>')) {
      // Command Mode
      const searchTerms = query.slice(1).toLowerCase().trim();
      const filtered = commands.filter((cmd) =>
        `${cmd.category}: ${cmd.label}`.toLowerCase().includes(searchTerms)
      );
      setFilteredItems(filtered.map((item) => ({ ...item, type: 'command' })));
    } else {
      // File Quick Open Mode
      const searchTerms = query.toLowerCase().trim();
      const filtered = files.filter((file) =>
        file.toLowerCase().includes(searchTerms)
      );
      setFilteredItems(filtered.map((file) => ({ id: file, label: file, type: 'file' })));
    }
    setSelectedIndex(0);
  }, [query, isOpen, commands, files]);

  // Scroll active item into view
  useEffect(() => {
    const activeEl = listRef.current?.children[selectedIndex];
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Key navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        handleSelectItem(filteredItems[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleSelectItem = (item) => {
    if (item.type === 'command') {
      item.action();
    } else if (item.type === 'file') {
      onFileOpen(item.id);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-[5vh] z-50 select-none">
      {/* Background click to close */}
      <div className="absolute inset-0" onClick={onClose}></div>

      {/* Palette Container */}
      <div className="w-[500px] max-h-[330px] bg-[#252526] border border-[#3c3c3c] rounded shadow-2xl flex flex-col z-10 overflow-hidden">
        {/* Search input bar */}
        <div className="flex items-center px-3 border-b border-[#3c3c3c] bg-[#2d2d2d]">
          <Search size={14} className="text-gray-400 mr-2" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={query.startsWith('>') ? "Type a command to run..." : "Search files by name..."}
            className="w-full h-9 bg-transparent border-none text-xs text-vscode-text focus:outline-none placeholder-gray-500 font-vscode"
          />
        </div>

        {/* Results List */}
        <div ref={listRef} className="flex-1 overflow-y-auto max-h-[290px] py-1 bg-vscode-sidebar">
          {filteredItems.length === 0 ? (
            <div className="px-4 py-2 text-xs text-vscode-textMuted text-center">
              No results found
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isActive = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectItem(item)}
                  className={`px-4 py-2 text-xs flex items-center justify-between cursor-pointer font-vscode transition-colors
                    ${isActive ? 'bg-vscode-accent text-white' : 'text-vscode-text hover:bg-vscode-tabInactive'}`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    {item.type === 'command' && item.category && (
                      <span className={`${isActive ? 'text-white/80' : 'text-vscode-textMuted'} font-medium`}>
                        {item.category}:
                      </span>
                    )}
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.shortcut && (
                    <span className={`text-[10px] uppercase font-semibold border rounded px-1.5 py-0.5 ml-3 opacity-80
                      ${isActive ? 'border-white text-white' : 'border-vscode-border text-vscode-textMuted'}`}>
                      {item.shortcut}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
