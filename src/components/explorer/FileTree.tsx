import React, { useState } from 'react';
import {
  Folder,
  FolderOpen,
  FileText,
  FileCode,
  FileJson,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { FileTreeNode } from '../../types/fileTree';
import { cn } from '../../lib/utils';

interface FileTreeProps {
  node: FileTreeNode;
  onSelectFile: (file: FileTreeNode) => void;
  selectedFilePath?: string;
  depth?: number;
}

export const FileTree: React.FC<FileTreeProps> = ({
  node,
  onSelectFile,
  selectedFilePath,
  depth = 0,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(depth === 0);

  const isDirectory = node.type === 'directory';
  const isSelected = selectedFilePath === node.relativePath;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDirectory) {
      setIsOpen(!isOpen);
    } else {
      onSelectFile(node);
    }
  };

  const getFileIcon = (ext?: string, name?: string) => {
    if (name === 'Dockerfile' || name?.startsWith('docker-compose')) {
      return <FileCode className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
    }
    switch (ext) {
      case 'ts':
      case 'tsx':
        return <FileCode className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
      case 'js':
      case 'jsx':
        return <FileCode className="w-3.5 h-3.5 text-yellow-400 shrink-0" />;
      case 'json':
        return <FileJson className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      case 'md':
      case 'markdown':
        return <FileText className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
      case 'css':
        return <FileCode className="w-3.5 h-3.5 text-pink-400 shrink-0" />;
      case 'rs':
        return <FileCode className="w-3.5 h-3.5 text-orange-400 shrink-0" />;
      case 'py':
        return <FileCode className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'go':
        return <FileCode className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
    }
  };

  return (
    <div className="select-none text-xs font-mono">
      <div
        onClick={handleToggle}
        style={{ paddingLeft: `${depth * 14 + 10}px` }}
        className={cn(
          'flex items-center gap-1.5 py-1 pr-2 rounded hover:bg-white/5 cursor-pointer transition-colors group',
          isSelected ? 'bg-blue-600/20 text-blue-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
        )}
      >
        {isDirectory ? (
          <span className="w-3.5 h-3.5 flex items-center justify-center text-slate-500">
            {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </span>
        ) : (
          <span className="w-3.5 h-3.5" />
        )}

        {isDirectory ? (
          isOpen ? (
            <FolderOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          ) : (
            <Folder className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />
          )
        ) : (
          getFileIcon(node.extension, node.name)
        )}

        <span className="truncate">{node.name}</span>
      </div>

      {isDirectory && isOpen && node.children && (
        <div>
          {node.children.map(child => (
            <FileTree
              key={child.id || child.path}
              node={child}
              onSelectFile={onSelectFile}
              selectedFilePath={selectedFilePath}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};
