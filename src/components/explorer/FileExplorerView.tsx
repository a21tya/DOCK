import React, { useState, useEffect } from 'react';
import { FileTree } from './FileTree';
import { CodeViewer } from './CodeViewer';
import { FileTreeNode, FileContent } from '../../types/fileTree';
import { dockApi } from '../../services/api';
import { Search, FolderTree, RefreshCw } from 'lucide-react';

interface FileExplorerViewProps {
  projectPath: string;
  initialSelectedFile?: string;
}

export const FileExplorerView: React.FC<FileExplorerViewProps> = ({
  projectPath,
  initialSelectedFile,
}) => {
  const [tree, setTree] = useState<FileTreeNode | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileContent | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingTree, setIsLoadingTree] = useState(false);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTree = async () => {
    try {
      setIsLoadingTree(true);
      setError(null);
      const res = await dockApi.getFileTree(projectPath);
      setTree(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load file tree');
    } finally {
      setIsLoadingTree(false);
    }
  };

  useEffect(() => {
    fetchTree();
  }, [projectPath]);

  useEffect(() => {
    if (initialSelectedFile) {
      handleSelectByPath(initialSelectedFile);
    }
  }, [initialSelectedFile, projectPath]);

  const handleSelectByPath = async (relPath: string) => {
    try {
      setIsLoadingFile(true);
      const content = await dockApi.getFileContent(projectPath, relPath);
      setSelectedFile(content);
    } catch (err: any) {
      console.error('Failed to read file:', err);
    } finally {
      setIsLoadingFile(false);
    }
  };

  const handleSelectFile = async (node: FileTreeNode) => {
    if (node.type === 'file') {
      handleSelectByPath(node.relativePath);
    }
  };

  return (
    <div className="flex-1 flex h-full overflow-hidden">
      {/* File Tree Left Pane */}
      <div className="w-72 border-r border-white/10 bg-dock-surface/50 flex flex-col h-full shrink-0">
        {/* Pane header with search */}
        <div className="p-3 border-b border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
              <FolderTree className="w-3.5 h-3.5 text-blue-400" />
              Files
            </span>
            <button
              onClick={fetchTree}
              disabled={isLoadingTree}
              className="p-1 rounded hover:bg-white/10 text-slate-500 hover:text-slate-300 transition-colors"
              title="Refresh files"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingTree ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-dock-card border border-white/10 rounded-md pl-8 pr-3 py-1 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
        </div>

        {/* Tree Container */}
        <div className="flex-1 overflow-y-auto p-2">
          {isLoadingTree ? (
            <div className="py-8 text-center text-xs text-slate-500 font-mono flex items-center justify-center gap-2">
              <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span>Scanning project tree...</span>
            </div>
          ) : error ? (
            <div className="p-3 text-xs text-rose-400 font-mono">{error}</div>
          ) : tree ? (
            <FileTree
              node={tree}
              onSelectFile={handleSelectFile}
              selectedFilePath={selectedFile?.relativePath}
            />
          ) : (
            <div className="py-8 text-center text-xs text-slate-600 font-mono">
              No files found
            </div>
          )}
        </div>
      </div>

      {/* Code Viewer Right Pane */}
      <CodeViewer file={selectedFile} isLoading={isLoadingFile} />
    </div>
  );
};
