import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Terminal, Copy, Check, Play } from 'lucide-react';

interface ScriptsCardProps {
  scripts: Record<string, string>;
}

export const ScriptsCard: React.FC<ScriptsCardProps> = ({ scripts }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const scriptEntries = Object.entries(scripts);

  const handleCopy = (key: string, cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <Card
      title="Available Scripts"
      subtitle={`${scriptEntries.length} commands`}
      badge={<Terminal className="w-3.5 h-3.5 text-blue-400" />}
    >
      {scriptEntries.length === 0 ? (
        <p className="text-xs text-slate-500 italic py-2">No runnable scripts found in project manifests.</p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {scriptEntries.map(([name, cmd]) => (
            <div
              key={name}
              className="p-2 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/15 flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Play className="w-3 h-3 text-slate-500 group-hover:text-blue-400 shrink-0 transition-colors" />
                <span className="text-xs font-mono font-medium text-slate-200">
                  {name}
                </span>
                <span className="text-[11px] font-mono text-slate-500 truncate max-w-[200px]">
                  {cmd}
                </span>
              </div>

              <button
                onClick={() => handleCopy(name, cmd)}
                title="Copy command to clipboard"
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                {copiedKey === name ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
