import React, { useRef, useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, RotateCw, Globe, ExternalLink } from 'lucide-react';

const BrowserPreview = ({ projectId }) => {
  const iframeRef = useRef(null);
  const previewUrl = `http://localhost:5000/preview/${projectId}/index.html`;
  
  // Track mock address bar value
  const [currentUrl, setCurrentUrl] = useState(previewUrl);

  const handleRefresh = () => {
    if (iframeRef.current) {
      // Reload iframe content
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const handleGoBack = () => {
    try {
      iframeRef.current?.contentWindow?.history.back();
    } catch (e) {
      console.warn('Iframe history navigation blocked by cross-origin security rules.');
    }
  };

  const handleGoForward = () => {
    try {
      iframeRef.current?.contentWindow?.history.forward();
    } catch (e) {
      console.warn('Iframe history navigation blocked by cross-origin security rules.');
    }
  };

  const handleOpenExternal = () => {
    window.open(previewUrl, '_blank');
  };

  return (
    <div className="w-full h-full flex flex-col bg-white border-l border-vscode-border">
      {/* Mock Browser Toolbar */}
      <div className="h-9 w-full bg-[#2d2d2d] border-b border-vscode-border px-3 flex items-center justify-between text-gray-400 select-none">
        
        {/* Navigation Arrows */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={handleGoBack}
            title="Go Back"
            className="p-1 hover:bg-[#3c3c3c] hover:text-white rounded transition-colors"
          >
            <ArrowLeft size={14} />
          </button>
          <button
            onClick={handleGoForward}
            title="Go Forward"
            className="p-1 hover:bg-[#3c3c3c] hover:text-white rounded transition-colors"
          >
            <ArrowRight size={14} />
          </button>
          <button
            onClick={handleRefresh}
            title="Reload Page"
            className="p-1 hover:bg-[#3c3c3c] hover:text-white rounded transition-colors"
          >
            <RotateCw size={14} />
          </button>
        </div>

        {/* Address Bar */}
        <div className="flex-1 max-w-[500px] h-6 bg-[#1e1e1e] border border-vscode-border rounded-md px-2.5 mx-3 flex items-center text-[11px] text-gray-300 font-mono select-all truncate">
          <Globe size={11} className="text-vscode-accent mr-1.5 flex-shrink-0" />
          <span className="truncate">{currentUrl}</span>
        </div>

        {/* Action Panel */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={handleOpenExternal}
            title="Open in external browser window"
            className="p-1 hover:bg-[#3c3c3c] hover:text-white rounded transition-colors flex items-center gap-1 text-[11px]"
          >
            <ExternalLink size={13} />
            <span className="hidden sm:inline">Open External</span>
          </button>
        </div>
      </div>

      {/* Embedded browser window */}
      <div className="flex-1 bg-white relative">
        <iframe
          ref={iframeRef}
          src={previewUrl}
          title="RR CodeVerse Live Preview"
          className="w-full h-full border-none"
          sandbox="allow-scripts allow-same-origin allow-modals"
        />
      </div>
    </div>
  );
};

export default BrowserPreview;
