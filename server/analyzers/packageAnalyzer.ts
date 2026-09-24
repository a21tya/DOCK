import fs from 'fs/promises';
import path from 'path';

export interface ParsedPackageInfo {
  name?: string;
  description?: string;
  version?: string;
  author?: string;
  license?: string;
  scripts: Record<string, string>;
  dependencies: Array<{
    name: string;
    version: string;
    type: 'prod' | 'dev' | 'peer';
    ecosystem: 'npm' | 'cargo' | 'pip' | 'gomod' | 'maven';
  }>;
  importantFiles: Array<{
    name: string;
    path: string;
    description: string;
    category: 'config' | 'entry' | 'doc' | 'build';
  }>;
  hasReadme: boolean;
  readmeExcerpt?: string;
}

export async function analyzeProjectMetadata(rootPath: string): Promise<ParsedPackageInfo> {
  const result: ParsedPackageInfo = {
    scripts: {},
    dependencies: [],
    importantFiles: [],
    hasReadme: false,
  };

  let filesInRoot: string[] = [];
  try {
    filesInRoot = await fs.readdir(rootPath);
  } catch {
    return result;
  }

  const fileSet = new Set(filesInRoot);

  // 1. Check for README
  const readmeCandidate = filesInRoot.find(f => /^readme(\.md|\.txt|\.markdown)?$/i.test(f));
  if (readmeCandidate) {
    result.hasReadme = true;
    try {
      const readmePath = path.join(rootPath, readmeCandidate);
      const content = await fs.readFile(readmePath, 'utf-8');
      result.readmeExcerpt = content.slice(0, 1000);
      result.importantFiles.push({
        name: readmeCandidate,
        path: readmeCandidate,
        description: 'Project documentation and overview',
        category: 'doc',
      });
    } catch {
      // ignore
    }
  }

  // 2. Node.js (package.json)
  if (fileSet.has('package.json')) {
    result.importantFiles.push({
      name: 'package.json',
      path: 'package.json',
      description: 'Node.js manifest and script definitions',
      category: 'config',
    });

    try {
      const pkgRaw = await fs.readFile(path.join(rootPath, 'package.json'), 'utf-8');
      const pkg = JSON.parse(pkgRaw);

      if (pkg.name) result.name = pkg.name;
      if (pkg.description) result.description = pkg.description;
      if (pkg.version) result.version = pkg.version;
      if (pkg.author) result.author = typeof pkg.author === 'string' ? pkg.author : pkg.author.name;
      if (pkg.license) result.license = pkg.license;
      if (pkg.scripts) result.scripts = pkg.scripts;

      if (pkg.dependencies) {
        for (const [dep, ver] of Object.entries(pkg.dependencies)) {
          result.dependencies.push({
            name: dep,
            version: String(ver),
            type: 'prod',
            ecosystem: 'npm',
          });
        }
      }

      if (pkg.devDependencies) {
        for (const [dep, ver] of Object.entries(pkg.devDependencies)) {
          result.dependencies.push({
            name: dep,
            version: String(ver),
            type: 'dev',
            ecosystem: 'npm',
          });
        }
      }
    } catch {
      // ignore
    }
  }

  // 3. Rust (Cargo.toml)
  if (fileSet.has('Cargo.toml')) {
    result.importantFiles.push({
      name: 'Cargo.toml',
      path: 'Cargo.toml',
      description: 'Rust package manifest and dependencies',
      category: 'build',
    });

    try {
      const cargoRaw = await fs.readFile(path.join(rootPath, 'Cargo.toml'), 'utf-8');
      const nameMatch = cargoRaw.match(/name\s*=\s*["']([^"']+)["']/);
      const versionMatch = cargoRaw.match(/version\s*=\s*["']([^"']+)["']/);
      const descMatch = cargoRaw.match(/description\s*=\s*["']([^"']+)["']/);

      if (!result.name && nameMatch) result.name = nameMatch[1];
      if (!result.version && versionMatch) result.version = versionMatch[1];
      if (!result.description && descMatch) result.description = descMatch[1];

      // Standard cargo scripts
      result.scripts['cargo build'] = 'cargo build';
      result.scripts['cargo test'] = 'cargo test';
      result.scripts['cargo run'] = 'cargo run';

      // Parse [dependencies] section roughly
      const depSection = cargoRaw.split(/\[.*dependencies\]/)[1]?.split(/\[/)[0];
      if (depSection) {
        const lines = depSection.split('\n');
        for (const line of lines) {
          const m = line.match(/^([a-zA-Z0-9_-]+)\s*=\s*(.*)$/);
          if (m) {
            result.dependencies.push({
              name: m[1].trim(),
              version: m[2].replace(/["']/g, '').trim(),
              type: 'prod',
              ecosystem: 'cargo',
            });
          }
        }
      }
    } catch {
      // ignore
    }
  }

  // 4. Python (requirements.txt / pyproject.toml)
  if (fileSet.has('requirements.txt')) {
    result.importantFiles.push({
      name: 'requirements.txt',
      path: 'requirements.txt',
      description: 'Python pip dependency requirements',
      category: 'build',
    });

    try {
      const reqRaw = await fs.readFile(path.join(rootPath, 'requirements.txt'), 'utf-8');
      const lines = reqRaw.split('\n');
      for (const line of lines) {
        const clean = line.trim();
        if (clean && !clean.startsWith('#')) {
          const parts = clean.split(/[=<>~]/);
          const depName = parts[0].trim();
          const depVer = clean.substring(depName.length).trim() || '*';
          result.dependencies.push({
            name: depName,
            version: depVer,
            type: 'prod',
            ecosystem: 'pip',
          });
        }
      }
    } catch {
      // ignore
    }
  }

  // 5. Go (go.mod)
  if (fileSet.has('go.mod')) {
    result.importantFiles.push({
      name: 'go.mod',
      path: 'go.mod',
      description: 'Go module definition and dependencies',
      category: 'build',
    });

    try {
      const goRaw = await fs.readFile(path.join(rootPath, 'go.mod'), 'utf-8');
      const modMatch = goRaw.match(/module\s+([^\s\n]+)/);
      if (!result.name && modMatch) result.name = modMatch[1];

      result.scripts['go build'] = 'go build ./...';
      result.scripts['go test'] = 'go test ./...';
      result.scripts['go run'] = 'go run .';
    } catch {
      // ignore
    }
  }

  // 6. Dockerfile
  if (fileSet.has('Dockerfile')) {
    result.importantFiles.push({
      name: 'Dockerfile',
      path: 'Dockerfile',
      description: 'Container build definition',
      category: 'build',
    });
  }
  if (fileSet.has('docker-compose.yml') || fileSet.has('docker-compose.yaml')) {
    const dcName = fileSet.has('docker-compose.yml') ? 'docker-compose.yml' : 'docker-compose.yaml';
    result.importantFiles.push({
      name: dcName,
      path: dcName,
      description: 'Multi-container orchestration spec',
      category: 'build',
    });
    result.scripts['docker compose up'] = 'docker compose up -d';
  }

  // Additional config files
  const configs = ['tsconfig.json', 'vite.config.ts', 'tailwind.config.ts', 'next.config.js', '.env.example'];
  for (const c of configs) {
    if (fileSet.has(c)) {
      result.importantFiles.push({
        name: c,
        path: c,
        description: 'Project configuration file',
        category: 'config',
      });
    }
  }

  // Fallback name if none found: folder name
  if (!result.name) {
    result.name = path.basename(rootPath);
  }

  return result;
}
