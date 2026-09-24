import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { FileCode, FileText, Settings, Hammer } from 'lucide-react';

interface ImportantFilesCardProps {
  files: Array<{
    name: string;
    path: string;
    description: string;
    category: 'config' | 'entry' | 'doc' | 'build';
  }>;
  onSelectFile?: (path: string) => void;
}

export const ImportantFilesCard: React.FC<ImportantFilesCardProps> = ({ files, onSelectFile }) => {
  const getIcon = (cat: string) => {
    switch (cat) {
      case 'doc':
        return <FileText className="w-3.5 h-3.5 text-blue-400" />;
      case 'build':
        return <Hammer className="w-3.5 h-3.5 text-amber-400" />;
      case 'config':
      default:
        return <Settings className="w-3.5 h-3.5 text-purple-400" />;
    }
  };

  return (
    <Card
      title="Important Files & Manifests"
      subtitle={`${files.length} key files`}
      badge={<FileCode className="w-3.5 h-3.5 text-blue-400" />}
    >
      {files.length === 0 ? (
        <p className="text-xs text-slate-500 italic py-2">No key config or manifest files found.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {files.map(f => (
            <div
              key={f.path}
              onClick={() => onSelectFile?.(f.path)}
              className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/15 hover:bg-white/[0.04] transition-all flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center gap-2 min-w-0">
                {getIcon(f.category)}
                <div className="min-w-0">
                  <div className="text-xs font-mono font-medium text-slate-200 group-hover:text-blue-400 transition-colors truncate">
                    {f.name}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {f.description}
                  </div>
                </div>
              </div>
              <Badge variant="outline" size="sm" className="text-[9px] uppercase font-mono text-slate-500">
                {f.category}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
