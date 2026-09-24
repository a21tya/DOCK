import React, { useState } from 'react';
import {
  FolderOpen,
  RotateCw,
  GitBranch,
  Copy,
  Check,
  FolderGit2,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ProjectMetadata } from '../../types/repository';

interface TopHeaderProps {
  project: ProjectMetadata | null;
  onOpenProjectClick: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  project,
  onOpenProjectClick,
  onRefresh,
  isRefreshing = false,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyPath = () => {
    if (project?.rootPath) {
      navigator.clipboard.writeText(project.rootPath);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header className="h-14 border-b border-white/10 bg-dock-surface/80 backdrop-blur-md px-6 flex items-center justify-between z-10">
      {/* Project breadcrumb / info */}
      <div className="flex items-center gap-3 min-w-0">
        <FolderGit2 className="w-4 h-4 text-slate-400 shrink-0" />
        {project ? (
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="font-semibold text-sm text-slate-100 truncate">
              {project.name}
            </span>

            {project.version && (
              <Badge variant="outline" size="sm" className="font-mono text-[10px] text-slate-400">
                v{project.version}
              </Badge>
            )}

            <button
              onClick={handleCopyPath}
              title="Copy path"
              className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[11px] font-mono text-slate-400 hover:text-slate-200 transition-colors border border-white/5"
            >
              <span className="max-w-[280px] truncate">{project.rootPath}</span>
              {copied ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3 text-slate-500" />
              )}
            </button>
          </div>
        ) : (
          <span className="text-xs text-slate-500 font-mono">No repository active</span>
        )}
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-2.5">
        {project?.git && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-mono text-slate-300">
            <GitBranch className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-medium">{project.git.branch}</span>
            {project.git.dirtyFilesCount > 0 ? (
              <span className="w-2 h-2 rounded-full bg-amber-400" title={`${project.git.dirtyFilesCount} modified files`} />
            ) : (
              <span className="w-2 h-2 rounded-full bg-emerald-400" title="Working tree clean" />
            )}
          </div>
        )}

        {project && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            isLoading={isRefreshing}
            title="Refresh repository analysis"
            className="text-slate-400 hover:text-slate-200 p-2"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </Button>
        )}

        <Button
          variant="secondary"
          size="sm"
          onClick={onOpenProjectClick}
          className="gap-2 font-mono text-xs border-white/15"
        >
          <FolderOpen className="w-3.5 h-3.5 text-blue-400" />
          <span>Open Project</span>
          <span className="text-[10px] text-slate-500 bg-white/10 px-1 py-0.2 rounded font-sans">⌘O</span>
        </Button>
      </div>
    </header>
  );
};
