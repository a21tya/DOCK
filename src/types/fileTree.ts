export interface FileTreeNode {
  id: string;
  name: string;
  path: string;
  relativePath: string;
  type: 'file' | 'directory';
  size?: number;
  extension?: string;
  children?: FileTreeNode[];
  isExpanded?: boolean;
}

export interface FileContent {
  path: string;
  relativePath: string;
  name: string;
  content: string;
  extension: string;
  size: number;
  isBinary: boolean;
  lineCount: number;
}
