import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { GitInfo } from '../../types/git';
import { GitBranch, GitCommit, GitFork, AlertCircle, CheckCircle2, Link2 } from 'lucide-react';

interface GitStatusCardProps {
  git: GitInfo | null;
}

export const GitStatusCard: React.FC<GitStatusCardProps> = ({ git }) => {
  if (!git || !git.isRepo) {
    return (
      <Card title="Git Version Control" subtitle="Not a git repository">
        <div className="py-6 text-center text-xs text-slate-500 font-mono">
          No .git directory found in project root.
        </div>
      </Card>
    );
  }

  return (
    <Card
      title="Git Status"
      subtitle={git.branch}
      badge={<GitBranch className="w-3.5 h-3.5 text-blue-400" />}
      action={
        git.dirtyFilesCount > 0 ? (
          <Badge variant="warning" size="sm">
            <AlertCircle className="w-3 h-3" />
            <span>{git.dirtyFilesCount} modified</span>
          </Badge>
        ) : (
          <Badge variant="success" size="sm">
            <CheckCircle2 className="w-3 h-3" />
            <span>Clean</span>
          </Badge>
        )
      }
    >
      <div className="space-y-3.5">
        {/* Latest Commit */}
        {git.latestCommit ? (
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <GitCommit className="w-3.5 h-3.5 text-slate-400" />
                Latest Commit
              </span>
              <span className="text-[11px] font-mono text-blue-400 font-medium">
                {git.latestCommit.shortHash}
              </span>
            </div>
            <p className="text-xs text-slate-200 font-medium truncate">
              {git.latestCommit.message}
            </p>
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>{git.latestCommit.author}</span>
              <span>{git.latestCommit.date}</span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-500 italic">No commits yet in this repository.</div>
        )}

        {/* Remote and Branches */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Link2 className="w-3 h-3" /> Remote Origin
            </span>
            <div className="text-slate-300 truncate text-[11px]">
              {git.remoteUrl ? git.remoteUrl.replace(/^https?:\/\//, '') : 'No remote configured'}
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <GitFork className="w-3 h-3" /> Local Branches
            </span>
            <div className="text-slate-300 truncate text-[11px]">
              {git.branches.length} ({git.branch})
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
