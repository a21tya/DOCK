import React from 'react';
import {
  LayoutDashboard,
  FolderTree,
  Boxes,
  GitBranch,
  Terminal,
  Settings,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/Badge';

export type NavTab = 'overview' | 'files' | 'dependencies' | 'git' | 'terminal' | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  projectName?: string;
  hasProject: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  hasProject,
}) => {
  const navItems = [
    {
      id: 'overview' as NavTab,
      label: 'Overview',
      icon: LayoutDashboard,
      disabled: !hasProject,
    },
    {
      id: 'files' as NavTab,
      label: 'Files',
      icon: FolderTree,
      disabled: !hasProject,
    },
    {
      id: 'dependencies' as NavTab,
      label: 'Dependencies',
      icon: Boxes,
      disabled: !hasProject,
    },
    {
      id: 'git' as NavTab,
      label: 'Git',
      icon: GitBranch,
      disabled: !hasProject,
    },
    {
      id: 'terminal' as NavTab,
      label: 'Terminal',
      icon: Terminal,
      badge: 'Phase 2',
      disabled: false,
    },
    {
      id: 'settings' as NavTab,
      label: 'Settings',
      icon: Settings,
      disabled: false,
    },
  ];

  return (
    <aside className="w-60 border-r border-white/10 bg-dock-surface flex flex-col h-full select-none z-20">
      {/* Brand Header */}
      <div className="h-14 px-5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-dock-glow">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-sm tracking-wider text-white">DOCK</span>
            <span className="text-[10px] font-mono text-blue-400 font-semibold uppercase">v0.1</span>
          </div>
        </div>
        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" title="Engine connected" />
      </div>

      {/* Navigation Links */}
      <nav className="p-3 space-y-1 flex-1">
        <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
          Workspace
        </div>

        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              disabled={item.disabled}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group cursor-pointer',
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent',
                item.disabled && 'opacity-40 pointer-events-none'
              )}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={cn(
                    'w-4 h-4 transition-colors',
                    isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'
                  )}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <Badge variant="outline" size="sm" className="text-[9px] py-0 px-1 border-white/10 text-slate-500">
                  {item.badge}
                </Badge>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-3 border-t border-white/10 bg-white/[0.01]">
        <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 flex items-center gap-2 text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="text-[11px] leading-tight">
            <span className="text-slate-300 font-medium block">Read-Only Engine</span>
            <span className="text-slate-500 text-[10px]">Zero file mutations</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
