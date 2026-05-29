import { useEffect } from 'react';

const useKeyboardShortcuts = ({
  onToggleSidebar,
  onToggleTerminal,
  onSaveFile,
  onOpenCommandPalette,
  onOpenFileSearch,
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isCtrl = e.ctrlKey || e.metaKey; // Command/Windows key fallback
      const isShift = e.shiftKey;
      
      // Ctrl + Shift + P -> Command Palette
      if (isCtrl && isShift && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        onOpenCommandPalette();
        return;
      }

      // Ctrl + P -> Quick Open / File Search
      if (isCtrl && !isShift && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        onOpenFileSearch();
        return;
      }

      // Ctrl + B -> Toggle Sidebar
      if (isCtrl && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        onToggleSidebar();
        return;
      }

      // Ctrl + ` -> Toggle Terminal Panel
      if (isCtrl && e.key === '`') {
        e.preventDefault();
        onToggleTerminal();
        return;
      }

      // Ctrl + S -> Save File
      if (isCtrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
        onSaveFile();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onToggleSidebar, onToggleTerminal, onSaveFile, onOpenCommandPalette, onOpenFileSearch]);
};

export default useKeyboardShortcuts;
