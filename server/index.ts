import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { detectTechnologies } from './analyzers/techDetector.js';
import { analyzeProjectMetadata } from './analyzers/packageAnalyzer.js';
import { analyzeGit } from './analyzers/gitAnalyzer.js';
import { buildFileTree, calculateRepoStats, readFileSafely } from './services/fsService.js';

const execAsync = promisify(exec);
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// In-memory + file cached recent projects
const RECENT_FILE = path.join(process.cwd(), '.dock-recent.json');

async function getRecentList(): Promise<string[]> {
  try {
    const raw = await fs.readFile(RECENT_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [process.cwd()];
  }
}

async function addRecent(projPath: string) {
  try {
    const current = await getRecentList();
    const updated = [projPath, ...current.filter(p => p !== projPath)].slice(0, 10);
    await fs.writeFile(RECENT_FILE, JSON.stringify(updated, null, 2));
  } catch {
    // ignore
  }
}

// 1. Open and analyze project
app.post('/api/project/open', async (req, res) => {
  try {
    const { path: requestedPath } = req.body;
    if (!requestedPath || typeof requestedPath !== 'string') {
      return res.status(400).json({ message: 'Valid project path is required' });
    }

    const resolvedPath = path.resolve(requestedPath.trim());

    // Check directory existence
    try {
      const stat = await fs.stat(resolvedPath);
      if (!stat.isDirectory()) {
        return res.status(400).json({ message: `Path is not a directory: ${resolvedPath}` });
      }
    } catch {
      return res.status(404).json({ message: `Directory does not exist: ${resolvedPath}` });
    }

    // Run parallel analyzers
    const [techs, pkgInfo, stats, gitInfo] = await Promise.all([
      detectTechnologies(resolvedPath),
      analyzeProjectMetadata(resolvedPath),
      calculateRepoStats(resolvedPath),
      analyzeGit(resolvedPath),
    ]);

    await addRecent(resolvedPath);

    const projectMetadata = {
      name: pkgInfo.name || path.basename(resolvedPath),
      description: pkgInfo.description,
      version: pkgInfo.version,
      author: pkgInfo.author,
      license: pkgInfo.license,
      rootPath: resolvedPath,
      technologies: techs,
      scripts: pkgInfo.scripts,
      dependencies: pkgInfo.dependencies,
      stats,
      git: gitInfo,
      importantFiles: pkgInfo.importantFiles,
      hasReadme: pkgInfo.hasReadme,
      readmeExcerpt: pkgInfo.readmeExcerpt,
    };

    return res.json(projectMetadata);
  } catch (error: any) {
    console.error('Error opening project:', error);
    return res.status(500).json({ message: error.message || 'Internal server error while analyzing project' });
  }
});

// 2. Fetch File Tree
app.get('/api/files/tree', async (req, res) => {
  try {
    const projectPath = req.query.path as string;
    if (!projectPath) {
      return res.status(400).json({ message: 'Project path required' });
    }

    const tree = await buildFileTree(path.resolve(projectPath));
    return res.json(tree);
  } catch (error: any) {
    console.error('Error fetching file tree:', error);
    return res.status(500).json({ message: error.message || 'Error fetching file tree' });
  }
});

// 3. Read file content safely
app.get('/api/files/content', async (req, res) => {
  try {
    const projectPath = req.query.projectPath as string;
    const filePath = req.query.file as string;

    if (!projectPath || !filePath) {
      return res.status(400).json({ message: 'projectPath and file are required' });
    }

    const fileData = await readFileSafely(projectPath, filePath);
    return res.json(fileData);
  } catch (error: any) {
    return res.status(400).json({ message: error.message || 'Error reading file' });
  }
});

// 4. Recent projects
app.get('/api/project/recent', async (_req, res) => {
  const list = await getRecentList();
  return res.json(list);
});

// 5. Native macOS folder picker dialog
app.post('/api/project/pick-dialog', async (_req, res) => {
  try {
    // Use AppleScript on macOS for a genuine native folder picker dialog
    const script = 'osascript -e \'POSIX path of (choose folder with prompt "Select Project Directory for DOCK:")\'';
    const { stdout } = await execAsync(script);
    const chosen = stdout.trim();
    return res.json({ path: chosen });
  } catch (err: any) {
    // User cancelled dialog or non-macOS
    return res.json({ path: null });
  }
});

app.listen(PORT, () => {
  console.log(`[DOCK Engine] Local developer backend listening on http://localhost:${PORT}`);
});
