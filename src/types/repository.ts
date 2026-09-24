import { GitInfo } from './git';
import { FileTreeNode } from './fileTree';

export interface TechItem {
  id: string;
  name: string;
  category: 'framework' | 'language' | 'tool' | 'runtime' | 'container' | 'database';
  icon: string;
  version?: string;
  fileSource: string;
  color: string;
}

export interface DependencyItem {
  name: string;
  version: string;
  type: 'prod' | 'dev' | 'peer';
  ecosystem: 'npm' | 'cargo' | 'pip' | 'gomod' | 'maven';
}

export interface LanguageStat {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export interface RepoStats {
  fileCount: number;
  directoryCount: number;
  totalSizeBytes: number;
  languages: LanguageStat[];
}

export interface ProjectMetadata {
  name: string;
  description?: string;
  version?: string;
  author?: string;
  license?: string;
  rootPath: string;
  technologies: TechItem[];
  scripts: Record<string, string>;
  dependencies: DependencyItem[];
  stats: RepoStats;
  git: GitInfo | null;
  importantFiles: Array<{
    name: string;
    path: string;
    description: string;
    category: 'config' | 'entry' | 'doc' | 'build';
  }>;
  hasReadme: boolean;
  readmeExcerpt?: string;
}

export interface ProjectState {
  currentProject: ProjectMetadata | null;
  fileTree: FileTreeNode | null;
  isLoading: boolean;
  error: string | null;
  recentProjects: string[];
}
