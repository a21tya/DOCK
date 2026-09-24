import React from 'react';
import { GitInfo } from '../../types/git';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { GitBranch, GitCommit, GitFork, Link2, CheckCircle2, AlertCircle } from 'lucide-react';

interface GitViewProps {
  git: GitInfo | null;
}

export const GitView: React.FC<GitViewProps> = ({ git }) => {
  if (!git || !git.isRepo) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="text-center space-y-2">
          <GitBranch className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-medium text-slate-200">Not a Git Repository</h3>
          <p className="text-xs text-slate-500 font-mono">This directory has not been initialized with Git.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-blue-400" />
            <span>Git Repository</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Branch and commit telemetry for the active project</p>
        </div>

        {git.dirtyFilesCount > 0 ? (
          <Badge variant="warning" size="md">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{git.dirtyFilesCount} modified files</span>
          </Badge>
        ) : (
          <Badge variant="success" size="md">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Working directory clean</span>
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card title="Current Branch & HEAD" badge={<GitBranch className="w-3.5 h-3.5 text-blue-400" />}>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
              <span className="text-xs text-slate-400 font-mono">Active Branch</span>
              <span className="text-sm font-semibold font-mono text-blue-400">{git.branch}</span>
            </div>

            {git.latestCommit && (
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase text-slate-500 flex items-center gap-1.5">
                    <GitCommit className="w-3.5 h-3.5 text-slate-400" /> Latest Commit
                  </span>
                  <span className="text-xs font-mono text-blue-400">{git.latestCommit.shortHash}</span>
                </div>
                <div className="text-sm font-medium text-slate-200">{git.latestCommit.message}</div>
                <div className="text-xs text-slate-500 font-mono flex items-center justify-between">
                  <span>Author: {git.latestCommit.author}</span>
                  <span>{git.latestCommit.date}</span>
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card title="Remotes & Branches" badge={<GitFork className="w-3.5 h-3.5 text-blue-400" />}>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 space-y-1">
              <span className="text-[11px] font-mono text-slate-500 uppercase flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-slate-400" /> Upstream Remote
              </span>
              <div className="text-xs font-mono text-slate-200 truncate">
                {git.remoteUrl || 'No remote repository linked'}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 space-y-2">
              <span className="text-[11px] font-mono text-slate-500 uppercase">
                Local Branches ({git.branches.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {git.branches.map(b => (
                  <Badge
                    key={b}
                    variant={b === git.branch ? 'info' : 'outline'}
                    size="sm"
                    className="font-mono"
                  >
                    {b}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
