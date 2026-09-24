import React, { useState } from 'react';
import { FolderOpen, ArrowRight, X, Sparkles } from 'lucide-react';
import { Button } from './Button';
import { dockApi } from '../../services/api';

interface OpenProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProject: (path: string) => void;
  recentProjects?: string[];
  isLoading?: boolean;
}

export const OpenProjectModal: React.FC<OpenProjectModalProps> = ({
  isOpen,
  onClose,
  onSelectProject,
  recentProjects = [],
  isLoading = false,
}) => {
  const [inputPath, setInputPath] = useState('');
  const [isPickingNative, setIsPickingNative] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPath.trim()) {
      onSelectProject(inputPath.trim());
    }
  };

  const handleNativePick = async () => {
    try {
      setIsPickingNative(true);
      const chosen = await dockApi.pickDirectory();
      if (chosen) {
        onSelectProject(chosen);
      }
    } catch {
      // dialog cancelled or error
    } finally {
      setIsPickingNative(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-2xl border border-white/10 bg-dock-surface shadow-2xl p-6 relative overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Open Repository</h2>
              <p className="text-xs text-slate-400">Select or enter the path to a local project directory</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Native Folder Picker Button */}
        <div className="mb-5">
          <Button
            type="button"
            variant="secondary"
            className="w-full py-3 border-dashed border-white/20 hover:border-blue-500/50 hover:bg-blue-500/5 text-slate-200 group"
            onClick={handleNativePick}
            isLoading={isPickingNative}
          >
            <FolderOpen className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
            <span>Choose Folder with Native Dialog...</span>
          </Button>
        </div>

        <div className="relative flex items-center justify-center my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <span className="relative px-3 bg-dock-surface text-[11px] uppercase tracking-wider text-slate-500 font-mono">
            or enter path
          </span>
        </div>

        {/* Path Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 font-mono">
              Absolute Local Path
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputPath}
                onChange={e => setInputPath(e.target.value)}
                placeholder="/Users/aditya/DOCK or /Users/.../my-repo"
                className="flex-1 bg-dock-card border border-white/10 rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-mono"
                autoFocus
              />
              <Button type="submit" variant="primary" disabled={!inputPath.trim()} isLoading={isLoading}>
                <span>Open</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </form>

        {/* Quick Demo Option */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={() => onSelectProject(window.location.pathname.startsWith('/Users') ? window.location.pathname : '/Users/aditya/DOCK')}
            className="w-full flex items-center justify-between p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/20 hover:bg-blue-500/10 text-left transition-colors group"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <div>
                <div className="text-xs font-medium text-slate-200 group-hover:text-blue-300">
                  Analyze Current Workspace (DOCK itself)
                </div>
                <div className="text-[11px] text-slate-500 font-mono">/Users/aditya/DOCK</div>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>

        {/* Recent Projects */}
        {recentProjects.length > 0 && (
          <div className="mt-4">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-2 block">
              Recent Repositories
            </span>
            <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
              {recentProjects.slice(0, 4).map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSelectProject(p)}
                  className="w-full text-left px-3 py-1.5 rounded-md hover:bg-white/5 text-xs text-slate-400 hover:text-slate-200 font-mono truncate transition-colors flex items-center justify-between"
                >
                  <span className="truncate">{p}</span>
                  <span className="text-[10px] text-slate-600">Open</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
