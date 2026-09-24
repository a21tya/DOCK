import React from 'react';
import { Sidebar, NavTab } from './Sidebar';
import { TopHeader } from './TopHeader';
import { ProjectMetadata } from '../../types/repository';

interface AppShellProps {
  children: React.ReactNode;
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  project: ProjectMetadata | null;
  onOpenProjectClick: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  activeTab,
  onTabChange,
  project,
  onOpenProjectClick,
  onRefresh,
  isRefreshing,
}) => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-dock-bg text-slate-100 font-sans">
      {/* Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={onTabChange}
        projectName={project?.name}
        hasProject={!!project}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <TopHeader
          project={project}
          onOpenProjectClick={onOpenProjectClick}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
        />

        {/* Dynamic View Area */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {children}
        </main>
      </div>
    </div>
  );
};
