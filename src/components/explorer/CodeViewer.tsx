import React, { useState } from 'react';
import { FileContent } from '../../types/fileTree';
import { formatBytes } from '../../lib/utils';
import { Copy, Check, FileCode, Binary } from 'lucide-react';

interface CodeViewerProps {
  file: FileContent | null;
  isLoading?: boolean;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ file, isLoading }) => {
  const [copied, setCopied] = useState(false);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-dock-bg/50">
        <div className="flex flex-col items-center gap-2 text-slate-500">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono">Loading file...</span>
        </div>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-dock-bg/50">
        <FileCode className="w-8 h-8 text-slate-600 mb-2" />
        <span className="text-xs font-mono text-slate-500">Select a file from the explorer to preview</span>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(file.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = file.content.split('\n');

  return (
    <div className="flex-1 flex flex-col h-full bg-dock-bg overflow-hidden">
      {/* File Header Bar */}
      <div className="h-10 px-4 border-b border-white/10 bg-dock-surface flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <FileCode className="w-4 h-4 text-blue-400 shrink-0" />
          <span className="text-xs font-mono text-slate-200 truncate">
            {file.relativePath}
          </span>
          <span className="text-[11px] font-mono text-slate-500">
            ({file.lineCount} lines • {formatBytes(file.size)})
          </span>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-xs font-mono text-slate-300 transition-colors border border-white/5 cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body */}
      {file.isBinary ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-500 font-mono text-xs">
          <Binary className="w-8 h-8 text-slate-600 mb-2" />
          <span>Binary file cannot be displayed in text editor</span>
        </div>
      ) : (
        <div className="flex-1 overflow-auto font-mono text-xs leading-5">
          <div className="min-w-full inline-block py-2">
            {lines.map((line, index) => (
              <div key={index} className="flex hover:bg-white/[0.03]">
                {/* Line number gutter */}
                <span className="w-12 shrink-0 text-right pr-4 text-slate-600 select-none font-mono text-[11px]">
                  {index + 1}
                </span>
                {/* Line text */}
                <pre className="text-slate-300 pr-6 whitespace-pre font-mono">
                  {line || ' '}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
