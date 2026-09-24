import React, { useState } from 'react';
import { DependencyItem } from '../../types/repository';
import { Badge } from '../ui/Badge';
import { Boxes, Search, PackageCheck } from 'lucide-react';

interface DependenciesViewProps {
  dependencies: DependencyItem[];
}

export const DependenciesView: React.FC<DependenciesViewProps> = ({ dependencies }) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'prod' | 'dev'>('all');

  const filtered = dependencies.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || d.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Boxes className="w-5 h-5 text-blue-400" />
            <span>Project Dependencies</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Total {dependencies.length} packages discovered in project manifests
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search dependencies..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-dock-card border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-mono w-56"
            />
          </div>

          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/5 text-xs font-mono">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded ${
                filterType === 'all' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('prod')}
              className={`px-2.5 py-1 rounded ${
                filterType === 'prod' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Prod
            </button>
            <button
              onClick={() => setFilterType('dev')}
              className={`px-2.5 py-1 rounded ${
                filterType === 'dev' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Dev
            </button>
          </div>
        </div>
      </div>

      {/* Dependencies Grid */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center text-slate-500 font-mono text-xs">
          No dependencies found matching your criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((dep, idx) => (
            <div
              key={`${dep.name}-${idx}`}
              className="p-3 rounded-xl bg-dock-card border border-white/5 hover:border-white/15 transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <PackageCheck className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-mono font-semibold text-slate-200 truncate">
                    {dep.name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {dep.ecosystem} • {dep.type === 'prod' ? 'production' : 'development'}
                  </div>
                </div>
              </div>
              <Badge variant="outline" size="sm" className="font-mono text-[10px] shrink-0">
                {dep.version}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
