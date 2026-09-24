export interface GitCommit {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  date: string;
}

export interface GitInfo {
  isRepo: boolean;
  branch: string;
  remoteUrl?: string;
  remoteName?: string;
  ahead?: number;
  behind?: number;
  dirtyFilesCount: number;
  latestCommit?: GitCommit;
  branches: string[];
}
