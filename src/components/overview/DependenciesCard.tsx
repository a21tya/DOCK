import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { DependencyItem } from '../../types/repository';
import { Boxes, PackageCheck } from 'lucide-react';

interface DependenciesCardProps {
  dependencies: DependencyItem[];
}

export const DependenciesCard: React.FC<DependenciesCardProps> = ({ dependencies }) => {
  const [filter, setFilter] = useState<'all' | 'prod' | 'dev'>('all');

  const filtered = dependencies.filter(d => {
    if (filter === 'all') return true;
    return d.type === filter;
  });

  const prodCount = dependencies.filter(d => d.type === 'prod').length;
  const devCount = dependencies.filter(d => d.type === 'dev').length;

  return (
    <Card
      title="Dependencies"
      subtitle={`${dependencies.length} packages`}
      badge={<Boxes className="w-3.5 h-3.5 text-blue-400" />}
      action={
        <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-white/5 text-[11px] font-mono">
          <button
            onClick={() => setFilter('all')}
            className={`px-2 py-0.5 rounded ${
              filter === 'all' ? 'bg-blue-600/30 text-blue-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({dependencies.length})
          </button>
          <button
            onClick={() => setFilter('prod')}
            className={`px-2 py-0.5 rounded ${
              filter === 'prod' ? 'bg-blue-600/30 text-blue-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Prod ({prodCount})
          </button>
          <button
            onClick={() => setFilter('dev')}
            className={`px-2 py-0.5 rounded ${
              filter === 'dev' ? 'bg-blue-600/30 text-blue-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Dev ({devCount})
          </button>
        </div>
      }
    >
      {dependencies.length === 0 ? (
        <p className="text-xs text-slate-500 italic py-2">No dependencies discovered.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
          {filtered.slice(0, 30).map((dep, idx) => (
            <div
              key={`${dep.name}-${idx}`}
              className="p-2 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/15 flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-2 min-w-0">
                <PackageCheck className="w-3 h-3 text-slate-500 shrink-0" />
                <span className="text-xs font-mono text-slate-200 truncate">
                  {dep.name}
                </span>
              </div>
              <Badge variant="outline" size="sm" className="text-[10px] font-mono text-slate-400 shrink-0">
                {dep.version}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
