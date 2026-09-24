import React from 'react';
import { ProjectMetadata } from '../../types/repository';
import { TechStackCard } from './TechStackCard';
import { GitStatusCard } from './GitStatusCard';
import { ScriptsCard } from './ScriptsCard';
import { DependenciesCard } from './DependenciesCard';
import { RepoStatsCard } from './RepoStatsCard';
import { ImportantFilesCard } from './ImportantFilesCard';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { FolderGit2, BookOpen } from 'lucide-react';

interface OverviewDashboardProps {
  project: ProjectMetadata;
  onNavigateToFiles: (path?: string) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  project,
  onNavigateToFiles,
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6">
      {/* Project Banner & Header */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-white">
                {project.name}
              </h1>
              {project.version && (
                <Badge variant="outline" size="sm" className="font-mono text-slate-400">
                  v{project.version}
                </Badge>
              )}
              {project.license && (
                <Badge variant="outline" size="sm" className="font-mono text-slate-500">
                  {project.license}
                </Badge>
              )}
            </div>
            {project.description && (
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                {project.description}
              </p>
            )}
          </div>

          {/* Quick tech badges */}
          <div className="flex flex-wrap items-center gap-1.5">
            {project.technologies.slice(0, 5).map(tech => (
              <Badge
                key={tech.id}
                variant="default"
                size="sm"
                className="bg-white/[0.04] text-slate-300 border-white/10"
              >
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: tech.color }}
                />
                <span>{tech.name}</span>
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
          <FolderGit2 className="w-3.5 h-3.5" />
          <span className="truncate">{project.rootPath}</span>
        </div>
      </div>

      {/* Grid of Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Tech Stack */}
        <TechStackCard technologies={project.technologies} />

        {/* Git Status */}
        <GitStatusCard git={project.git} />

        {/* Available Scripts */}
        <ScriptsCard scripts={project.scripts} />

        {/* Dependencies */}
        <DependenciesCard dependencies={project.dependencies} />

        {/* Repository Statistics */}
        <RepoStatsCard stats={project.stats} />

        {/* Important Files & Manifests */}
        <ImportantFilesCard
          files={project.importantFiles}
          onSelectFile={path => onNavigateToFiles(path)}
        />
      </div>

      {/* Readme Excerpt preview if available */}
      {project.readmeExcerpt && (
        <Card
          title="README Preview"
          badge={<BookOpen className="w-3.5 h-3.5 text-blue-400" />}
          className="mt-6"
        >
          <div className="p-4 rounded-lg bg-black/40 border border-white/5 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
            {project.readmeExcerpt}
          </div>
        </Card>
      )}
    </div>
  );
};
