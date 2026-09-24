import React from 'react';
import { Terminal, Settings, Sparkles } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface PlaceholderViewProps {
  type: 'terminal' | 'settings';
}

export const PlaceholderView: React.FC<PlaceholderViewProps> = ({ type }) => {
  if (type === 'terminal') {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <Card className="max-w-md w-full text-center p-8 space-y-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
            <Terminal className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center justify-center gap-2 mb-1">
              <h3 className="text-base font-semibold text-white">Integrated Terminal</h3>
              <Badge variant="info" size="sm">Phase 2</Badge>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Native PTY shell integration with preset project task runners is scheduled for Phase 2.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-black/40 border border-white/5 font-mono text-[11px] text-slate-500 text-left">
            $ npm run dev<br />
            $ docker compose up<br />
            $ cargo check
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 overflow-y-auto max-w-2xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-slate-400" />
          <span>DOCK Settings</span>
        </h1>
        <p className="text-xs text-slate-400">Environment and workspace preferences</p>
      </div>

      <div className="space-y-4">
        <Card title="Workspace Preferences">
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1">
              <div>
                <span className="text-slate-200 font-medium block">Ignored Folders</span>
                <span className="text-slate-500 text-[11px]">Directories hidden from file tree scans</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">node_modules, .git, dist, build, venv</span>
            </div>

            <div className="flex items-center justify-between py-1 border-t border-white/5">
              <div>
                <span className="text-slate-200 font-medium block">File Max Preview Size</span>
                <span className="text-slate-500 text-[11px]">Maximum file size loaded in code viewer</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">1.0 MB</span>
            </div>

            <div className="flex items-center justify-between py-1 border-t border-white/5">
              <div>
                <span className="text-slate-200 font-medium block">Safety Sandbox</span>
                <span className="text-slate-500 text-[11px]">Filesystem execution mode</span>
              </div>
              <Badge variant="success" size="sm">Strict Read-Only</Badge>
            </div>
          </div>
        </Card>

        <Card title="Architecture Info">
          <div className="text-xs text-slate-400 space-y-2">
            <p>
              DOCK is designed with a decoupled architecture. The UI runs on React + TypeScript + Tailwind CSS and interacts with a backend adapter service (`IDockBackend`).
            </p>
            <div className="flex items-center gap-2 text-blue-400 text-xs font-mono pt-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Native Tauri / Rust IPC adapter drop-in compatible</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
