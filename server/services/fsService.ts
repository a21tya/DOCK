import fs from 'fs/promises';
import path from 'path';

export interface FileTreeNode {
  id: string;
  name: string;
  path: string;
  relativePath: string;
  type: 'file' | 'directory';
  size?: number;
  extension?: string;
  children?: FileTreeNode[];
}

export interface FileStatsSummary {
  fileCount: number;
  directoryCount: number;
  totalSizeBytes: number;
  languages: Array<{
    name: string;
    count: number;
    percentage: number;
    color: string;
  }>;
}

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  'venv',
  '.venv',
  '__pycache__',
  '.turbo',
  '.cache',
  'target',
  '.idea',
  '.vscode',
  'coverage',
]);

const IGNORED_FILES = new Set(['.DS_Store', 'Thumbs.db']);

const EXTENSION_LANGUAGE_MAP: Record<string, { name: string; color: string }> = {
  ts: { name: 'TypeScript', color: '#3178c6' },
  tsx: { name: 'TypeScript (React)', color: '#3178c6' },
  js: { name: 'JavaScript', color: '#f7df1e' },
  jsx: { name: 'JavaScript (React)', color: '#f7df1e' },
  py: { name: 'Python', color: '#3572A5' },
  rs: { name: 'Rust', color: '#dea584' },
  go: { name: 'Go', color: '#00add8' },
  java: { name: 'Java', color: '#b07219' },
  html: { name: 'HTML', color: '#e34c26' },
  css: { name: 'CSS', color: '#563d7c' },
  json: { name: 'JSON', color: '#292929' },
  md: { name: 'Markdown', color: '#083fa1' },
  yaml: { name: 'YAML', color: '#cb171e' },
  yml: { name: 'YAML', color: '#cb171e' },
  toml: { name: 'TOML', color: '#9c4221' },
  sh: { name: 'Shell', color: '#89e051' },
  sql: { name: 'SQL', color: '#e38c00' },
};

export async function buildFileTree(
  dirPath: string,
  rootPath: string = dirPath,
  maxDepth = 6,
  currentDepth = 0
): Promise<FileTreeNode> {
  const name = path.basename(dirPath);
  const relativePath = path.relative(rootPath, dirPath) || '.';

  const node: FileTreeNode = {
    id: relativePath,
    name,
    path: dirPath,
    relativePath,
    type: 'directory',
    children: [],
  };

  if (currentDepth >= maxDepth) {
    return node;
  }

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    // Sort: directories first, then alphabetically
    const sortedEntries = entries.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

    for (const entry of sortedEntries) {
      if (IGNORED_FILES.has(entry.name)) continue;

      const fullPath = path.join(dirPath, entry.name);
      const childRelative = path.relative(rootPath, fullPath);

      if (entry.isDirectory()) {
        if (IGNORED_DIRS.has(entry.name)) continue;

        const childNode = await buildFileTree(fullPath, rootPath, maxDepth, currentDepth + 1);
        node.children?.push(childNode);
      } else if (entry.isFile()) {
        let size = 0;
        try {
          const stat = await fs.stat(fullPath);
          size = stat.size;
        } catch {
          // ignore
        }

        const ext = path.extname(entry.name).replace('.', '').toLowerCase();
        node.children?.push({
          id: childRelative,
          name: entry.name,
          path: fullPath,
          relativePath: childRelative,
          type: 'file',
          size,
          extension: ext,
        });
      }
    }
  } catch {
    // Permission error or unreadable directory
  }

  return node;
}

export async function calculateRepoStats(rootPath: string): Promise<FileStatsSummary> {
  let fileCount = 0;
  let directoryCount = 0;
  let totalSizeBytes = 0;
  const langCounts: Record<string, { count: number; name: string; color: string }> = {};

  async function walk(dir: string, depth = 0) {
    if (depth > 8) return;
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (IGNORED_FILES.has(entry.name)) continue;

        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          if (IGNORED_DIRS.has(entry.name)) continue;
          directoryCount++;
          await walk(fullPath, depth + 1);
        } else if (entry.isFile()) {
          fileCount++;
          try {
            const stat = await fs.stat(fullPath);
            totalSizeBytes += stat.size;
          } catch {
            // ignore
          }

          const ext = path.extname(entry.name).replace('.', '').toLowerCase();
          if (ext && EXTENSION_LANGUAGE_MAP[ext]) {
            const lang = EXTENSION_LANGUAGE_MAP[ext];
            if (!langCounts[lang.name]) {
              langCounts[lang.name] = { count: 0, name: lang.name, color: lang.color };
            }
            langCounts[lang.name].count++;
          }
        }
      }
    } catch {
      // ignore
    }
  }

  await walk(rootPath);

  // Compute percentages
  const totalAnalyzedFiles = Object.values(langCounts).reduce((acc, l) => acc + l.count, 0) || 1;
  const languages = Object.values(langCounts)
    .map(l => ({
      name: l.name,
      count: l.count,
      percentage: Math.round((l.count / totalAnalyzedFiles) * 100),
      color: l.color,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return {
    fileCount,
    directoryCount,
    totalSizeBytes,
    languages,
  };
}

export async function readFileSafely(projectRoot: string, relativeFilePath: string) {
  const resolvedTarget = path.resolve(projectRoot, relativeFilePath);
  const resolvedRoot = path.resolve(projectRoot);

  // Security check: ensure path does not escape project root
  if (!resolvedTarget.startsWith(resolvedRoot)) {
    throw new Error('Access denied: Cannot read files outside repository directory');
  }

  const stat = await fs.stat(resolvedTarget);
  if (!stat.isFile()) {
    throw new Error('Target is not a file');
  }

  // Cap max file read size to 1MB to avoid locking memory
  if (stat.size > 1024 * 1024) {
    return {
      path: resolvedTarget,
      relativePath: relativeFilePath,
      name: path.basename(resolvedTarget),
      content: '// File is larger than 1MB. Preview disabled for performance.',
      extension: path.extname(resolvedTarget).replace('.', '').toLowerCase(),
      size: stat.size,
      isBinary: false,
      lineCount: 1,
    };
  }

  // Detect binary
  const buffer = await fs.readFile(resolvedTarget);
  const isBinary = buffer.includes(0);

  if (isBinary) {
    return {
      path: resolvedTarget,
      relativePath: relativeFilePath,
      name: path.basename(resolvedTarget),
      content: '// Binary file detected. Preview not available.',
      extension: path.extname(resolvedTarget).replace('.', '').toLowerCase(),
      size: stat.size,
      isBinary: true,
      lineCount: 0,
    };
  }

  const content = buffer.toString('utf-8');
  const lineCount = content.split('\n').length;

  return {
    path: resolvedTarget,
    relativePath: relativeFilePath,
    name: path.basename(resolvedTarget),
    content,
    extension: path.extname(resolvedTarget).replace('.', '').toLowerCase(),
    size: stat.size,
    isBinary: false,
    lineCount,
  };
}
