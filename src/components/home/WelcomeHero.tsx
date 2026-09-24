import React from 'react';
import {
  FolderOpen,
  Cpu,
  Layers,
  Sparkles,
  ArrowRight,
  GitBranch,
} from 'lucide-react';
import { Button } from '../ui/Button';

interface WelcomeHeroProps {
  onOpenClick: () => void;
  onOpenSample: (path: string) => void;
  recentProjects: string[];
}

export const WelcomeHero: React.FC<WelcomeHeroProps> = ({
  onOpenClick,
  onOpenSample,
  recentProjects,
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-10 flex flex-col items-center justify-center relative">
      {/* Background glow decoration */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-xl w-full relative z-10 text-center space-y-8">
        {/* Logo and title */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Developer Command Center</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Welcome to <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">DOCK</span>
          </h1>

          <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            One unified local workspace to inspect, understand, and navigate your codebase without tool-switching.
          </p>
        </div>

        {/* Primary Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="primary"
            size="lg"
            onClick={onOpenClick}
            className="w-full sm:w-auto shadow-dock-glow text-sm font-semibold px-6 py-3 cursor-pointer"
          >
            <FolderOpen className="w-4 h-4 mr-2" />
            <span>Open Local Repository</span>
            <span className="ml-2 text-xs opacity-75 font-mono bg-blue-700/60 px-1.5 py-0.5 rounded">
              ⌘O
            </span>
          </Button>

          <Button
            variant="secondary"
            size="lg"
            onClick={() => onOpenSample('/Users/aditya/DOCK')}
            className="w-full sm:w-auto text-sm font-mono cursor-pointer"
          >
            <Sparkles className="w-4 h-4 mr-2 text-blue-400" />
            <span>Analyze DOCK Workspace</span>
          </Button>
        </div>

        {/* Feature pillars */}
        <div className="grid grid-cols-3 gap-3 pt-4 text-left">
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
            <Cpu className="w-4 h-4 text-blue-400" />
            <div className="text-xs font-semibold text-slate-200">Tech Detection</div>
            <p className="text-[11px] text-slate-500">Auto-identifies manifests, runtimes, and dependencies.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
            <GitBranch className="w-4 h-4 text-emerald-400" />
            <div className="text-xs font-semibold text-slate-200">Git Insights</div>
            <p className="text-[11px] text-slate-500">Branch status, commits, and working tree tracking.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
            <Layers className="w-4 h-4 text-purple-400" />
            <div className="text-xs font-semibold text-slate-200">File Explorer</div>
            <p className="text-[11px] text-slate-500">VS Code-grade file tree with syntax viewer.</p>
          </div>
        </div>

        {/* Recent Repositories */}
        {recentProjects.length > 0 && (
          <div className="pt-4 border-t border-white/10 text-left space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
              <span className="uppercase tracking-wider text-[10px]">Recent Workspaces</span>
              <span>Local</span>
            </div>
            <div className="space-y-1.5">
              {recentProjects.slice(0, 3).map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => onOpenSample(item)}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-white/15 transition-all text-xs font-mono text-slate-300 group cursor-pointer"
                >
                  <span className="truncate max-w-[420px]">{item}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
