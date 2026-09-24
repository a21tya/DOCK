import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export interface GitCommitInfo {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  date: string;
}

export interface GitStatusResult {
  isRepo: boolean;
  branch: string;
  remoteUrl?: string;
  remoteName?: string;
  dirtyFilesCount: number;
  latestCommit?: GitCommitInfo;
  branches: string[];
}

export async function analyzeGit(rootPath: string): Promise<GitStatusResult | null> {
  try {
    // Check if git repo
    const { stdout: isGitStr } = await execFileAsync('git', ['rev-parse', '--is-inside-work-tree'], {
      cwd: rootPath,
    });
    if (isGitStr.trim() !== 'true') {
      return null;
    }

    // Current branch
    let branch = 'main';
    try {
      const { stdout: branchStr } = await execFileAsync('git', ['branch', '--show-current'], { cwd: rootPath });
      branch = branchStr.trim() || 'HEAD (detached)';
    } catch {
      branch = 'unknown';
    }

    // Latest commit
    let latestCommit: GitCommitInfo | undefined;
    try {
      const { stdout: commitStr } = await execFileAsync('git', ['log', '-1', '--format=%H|%h|%s|%an|%cr'], {
        cwd: rootPath,
      });
      const parts = commitStr.trim().split('|');
      if (parts.length >= 5) {
        latestCommit = {
          hash: parts[0],
          shortHash: parts[1],
          message: parts[2],
          author: parts[3],
          date: parts[4],
        };
      }
    } catch {
      // empty repo, no commits yet
    }

    // Dirty files count
    let dirtyFilesCount = 0;
    try {
      const { stdout: statusStr } = await execFileAsync('git', ['status', '--porcelain'], { cwd: rootPath });
      const lines = statusStr.trim().split('\n').filter(Boolean);
      dirtyFilesCount = lines.length;
    } catch {
      dirtyFilesCount = 0;
    }

    // Remote URL
    let remoteUrl: string | undefined;
    let remoteName: string | undefined;
    try {
      const { stdout: remoteStr } = await execFileAsync('git', ['remote', '-v'], { cwd: rootPath });
      const match = remoteStr.match(/(\w+)\s+(.+)\s+\(fetch\)/);
      if (match) {
        remoteName = match[1];
        remoteUrl = match[2];
      }
    } catch {
      // no remote
    }

    // Local branches
    let branches: string[] = [];
    try {
      const { stdout: branchListStr } = await execFileAsync('git', ['branch', '--format=%(refname:short)'], {
        cwd: rootPath,
      });
      branches = branchListStr.trim().split('\n').filter(Boolean);
    } catch {
      branches = [branch];
    }

    return {
      isRepo: true,
      branch,
      remoteUrl,
      remoteName,
      dirtyFilesCount,
      latestCommit,
      branches,
    };
  } catch {
    return null;
  }
}
