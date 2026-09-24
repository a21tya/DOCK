import { useState, useEffect } from 'react';
import { AppShell } from './components/layout/AppShell';
import { NavTab } from './components/layout/Sidebar';
import { WelcomeHero } from './components/home/WelcomeHero';
import { OverviewDashboard } from './components/overview/OverviewDashboard';
import { FileExplorerView } from './components/explorer/FileExplorerView';
import { DependenciesView } from './components/views/DependenciesView';
import { GitView } from './components/views/GitView';
import { PlaceholderView } from './components/views/PlaceholderView';
import { OpenProjectModal } from './components/ui/OpenProjectModal';
import { ProjectMetadata } from './types/repository';
import { dockApi } from './services/api';
import { AlertCircle, X } from 'lucide-react';

export function App() {
  const [currentProject, setCurrentProject] = useState<ProjectMetadata | null>(null);
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentProjects, setRecentProjects] = useState<string[]>([]);
  const [selectedFileForExplorer, setSelectedFileForExplorer] = useState<string | undefined>();

  // Fetch recent projects and auto-load if available
  useEffect(() => {
    dockApi.getRecentProjects().then(list => {
      setRecentProjects(list);
      // Auto-load current workspace on initial launch for seamless experience
      if (list.length > 0 && !currentProject) {
        handleOpenProject(list[0]);
      }
    });
  }, []);

  // Global keyboard shortcuts (Cmd+O)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        setIsModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenProject = async (path: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const metadata = await dockApi.openProject(path);
      setCurrentProject(metadata);
      setIsModalOpen(false);
      setActiveTab('overview');

      // Refresh recent projects
      const updated = await dockApi.getRecentProjects();
      setRecentProjects(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to open project');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!currentProject) return;
    try {
      setIsRefreshing(true);
      const metadata = await dockApi.openProject(currentProject.rootPath);
      setCurrentProject(metadata);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh repository');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleNavigateToFiles = (filePath?: string) => {
    setSelectedFileForExplorer(filePath);
    setActiveTab('files');
  };

  return (
    <AppShell
      activeTab={activeTab}
      onTabChange={setActiveTab}
      project={currentProject}
      onOpenProjectClick={() => setIsModalOpen(true)}
      onRefresh={handleRefresh}
      isRefreshing={isRefreshing}
    >
      {/* Error alert toast */}
      {error && (
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono shadow-xl backdrop-blur-md animate-in slide-in-from-top-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-2 hover:text-white p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Loading Screen */}
      {isLoading && (
        <div className="absolute inset-0 z-40 bg-dock-bg/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shadow-dock-glow" />
          <span className="text-xs font-mono text-slate-300">Analyzing repository...</span>
        </div>
      )}

      {/* Active Tab View */}
      {!currentProject ? (
        <WelcomeHero
          onOpenClick={() => setIsModalOpen(true)}
          onOpenSample={handleOpenProject}
          recentProjects={recentProjects}
        />
      ) : (
        <>
          {activeTab === 'overview' && (
            <OverviewDashboard
              project={currentProject}
              onNavigateToFiles={handleNavigateToFiles}
            />
          )}

          {activeTab === 'files' && (
            <FileExplorerView
              projectPath={currentProject.rootPath}
              initialSelectedFile={selectedFileForExplorer}
            />
          )}

          {activeTab === 'dependencies' && (
            <DependenciesView dependencies={currentProject.dependencies} />
          )}

          {activeTab === 'git' && <GitView git={currentProject.git} />}

          {(activeTab === 'terminal' || activeTab === 'settings') && (
            <PlaceholderView type={activeTab} />
          )}
        </>
      )}

      {/* Open Project Modal */}
      <OpenProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectProject={handleOpenProject}
        recentProjects={recentProjects}
        isLoading={isLoading}
      />
    </AppShell>
  );
}

export default App;
