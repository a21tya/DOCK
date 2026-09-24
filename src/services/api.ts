import { ProjectMetadata } from '../types/repository';
import { FileTreeNode, FileContent } from '../types/fileTree';

export interface IDockBackend {
  openProject(path: string): Promise<ProjectMetadata>;
  getFileTree(path: string): Promise<FileTreeNode>;
  getFileContent(projectPath: string, relativeFilePath: string): Promise<FileContent>;
  getRecentProjects(): Promise<string[]>;
  pickDirectory(): Promise<string | null>;
}

class DockApiClient implements IDockBackend {
  private baseUrl = '/api';

  async openProject(path: string): Promise<ProjectMetadata> {
    const res = await fetch(`${this.baseUrl}/project/open`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to open project' }));
      throw new Error(err.message || `Error opening project (HTTP ${res.status})`);
    }

    return res.json();
  }

  async getFileTree(path: string): Promise<FileTreeNode> {
    const res = await fetch(`${this.baseUrl}/files/tree?path=${encodeURIComponent(path)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to fetch file tree' }));
      throw new Error(err.message || 'Failed to fetch file tree');
    }
    return res.json();
  }

  async getFileContent(projectPath: string, relativeFilePath: string): Promise<FileContent> {
    const res = await fetch(
      `${this.baseUrl}/files/content?projectPath=${encodeURIComponent(projectPath)}&file=${encodeURIComponent(relativeFilePath)}`
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to read file content' }));
      throw new Error(err.message || 'Failed to read file content');
    }
    return res.json();
  }

  async getRecentProjects(): Promise<string[]> {
    try {
      const res = await fetch(`${this.baseUrl}/project/recent`);
      if (!res.ok) return [];
      return res.json();
    } catch {
      return [];
    }
  }

  async pickDirectory(): Promise<string | null> {
    try {
      const res = await fetch(`${this.baseUrl}/project/pick-dialog`, { method: 'POST' });
      if (!res.ok) return null;
      const data = await res.json();
      return data.path || null;
    } catch {
      return null;
    }
  }
}

export const dockApi = new DockApiClient();
