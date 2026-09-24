import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { TechItem } from '../../types/repository';
import { Layers } from 'lucide-react';

interface TechStackCardProps {
  technologies: TechItem[];
}

export const TechStackCard: React.FC<TechStackCardProps> = ({ technologies }) => {
  return (
    <Card
      title="Tech Stack & Ecosystem"
      subtitle={`${technologies.length} detected`}
      badge={<Layers className="w-3.5 h-3.5 text-blue-400" />}
    >
      {technologies.length === 0 ? (
        <p className="text-xs text-slate-500 italic py-2">No known manifests or runtimes detected.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          {technologies.map(tech => (
            <div
              key={tech.id}
              className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/15 transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: tech.color || '#3b82f6' }}
                />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-200 truncate flex items-center gap-1.5">
                    <span>{tech.name}</span>
                    {tech.version && (
                      <span className="text-[10px] font-mono text-slate-400 font-normal">
                        {tech.version}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono truncate">
                    via {tech.fileSource}
                  </div>
                </div>
              </div>
              <Badge variant="outline" size="sm" className="text-[10px] uppercase font-mono text-slate-500">
                {tech.category}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
