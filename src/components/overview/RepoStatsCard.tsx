import React from 'react';
import { Card } from '../ui/Card';
import { RepoStats } from '../../types/repository';
import { formatBytes } from '../../lib/utils';
import { BarChart3, Files, Folder, HardDrive } from 'lucide-react';

interface RepoStatsCardProps {
  stats: RepoStats;
}

export const RepoStatsCard: React.FC<RepoStatsCardProps> = ({ stats }) => {
  return (
    <Card
      title="Repository Statistics"
      badge={<BarChart3 className="w-3.5 h-3.5 text-blue-400" />}
    >
      <div className="space-y-4">
        {/* Metric tiles */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-mono">
              <Files className="w-3.5 h-3.5 text-blue-400" />
              <span>Files</span>
            </div>
            <div className="text-lg font-bold text-slate-100 font-mono">
              {stats.fileCount.toLocaleString()}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-mono">
              <Folder className="w-3.5 h-3.5 text-amber-400" />
              <span>Directories</span>
            </div>
            <div className="text-lg font-bold text-slate-100 font-mono">
              {stats.directoryCount.toLocaleString()}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-mono">
              <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
              <span>Total Size</span>
            </div>
            <div className="text-lg font-bold text-slate-100 font-mono">
              {formatBytes(stats.totalSizeBytes)}
            </div>
          </div>
        </div>

        {/* Language Breakdown Bar */}
        {stats.languages.length > 0 && (
          <div className="space-y-2 pt-1">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
              Language Composition
            </div>

            {/* Segmented bar */}
            <div className="h-2 rounded-full overflow-hidden flex bg-white/5 gap-0.5">
              {stats.languages.map(lang => (
                <div
                  key={lang.name}
                  style={{
                    width: `${Math.max(lang.percentage, 3)}%`,
                    backgroundColor: lang.color,
                  }}
                  title={`${lang.name}: ${lang.percentage}%`}
                />
              ))}
            </div>

            {/* Language legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-[11px] font-mono">
              {stats.languages.map(lang => (
                <div key={lang.name} className="flex items-center gap-1.5 text-slate-400">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: lang.color }}
                  />
                  <span className="text-slate-200">{lang.name}</span>
                  <span className="text-slate-500">{lang.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
