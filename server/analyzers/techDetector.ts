import fs from 'fs/promises';
import path from 'path';

export interface DetectedTech {
  id: string;
  name: string;
  category: 'framework' | 'language' | 'tool' | 'runtime' | 'container' | 'database';
  icon: string;
  version?: string;
  fileSource: string;
  color: string;
}

export async function detectTechnologies(rootPath: string): Promise<DetectedTech[]> {
  const detected: DetectedTech[] = [];
  const existingFiles = new Set<string>();

  try {
    const entries = await fs.readdir(rootPath, { withFileTypes: true });
    for (const entry of entries) {
      existingFiles.add(entry.name);
    }
  } catch {
    return detected;
  }

  // 1. Rust
  if (existingFiles.has('Cargo.toml')) {
    detected.push({
      id: 'rust',
      name: 'Rust',
      category: 'language',
      icon: 'Ferris',
      fileSource: 'Cargo.toml',
      color: '#dea584',
    });
  }

  // 2. Go
  if (existingFiles.has('go.mod')) {
    detected.push({
      id: 'go',
      name: 'Go',
      category: 'language',
      icon: 'Golang',
      fileSource: 'go.mod',
      color: '#00add8',
    });
  }

  // 3. Python
  if (existingFiles.has('requirements.txt') || existingFiles.has('pyproject.toml') || existingFiles.has('setup.py') || existingFiles.has('Pipfile')) {
    const source = existingFiles.has('pyproject.toml')
      ? 'pyproject.toml'
      : existingFiles.has('requirements.txt')
      ? 'requirements.txt'
      : 'Pipfile';
    detected.push({
      id: 'python',
      name: 'Python',
      category: 'language',
      icon: 'Python',
      fileSource: source,
      color: '#3572A5',
    });
  }

  // 4. Java / Maven / Gradle
  if (existingFiles.has('pom.xml')) {
    detected.push({
      id: 'maven',
      name: 'Maven / Java',
      category: 'tool',
      icon: 'Coffee',
      fileSource: 'pom.xml',
      color: '#b07219',
    });
  }
  if (existingFiles.has('build.gradle') || existingFiles.has('build.gradle.kts')) {
    detected.push({
      id: 'gradle',
      name: 'Gradle',
      category: 'tool',
      icon: 'Coffee',
      fileSource: 'build.gradle',
      color: '#02303a',
    });
  }

  // 5. Docker
  if (existingFiles.has('Dockerfile') || existingFiles.has('docker-compose.yml') || existingFiles.has('docker-compose.yaml') || existingFiles.has('compose.yaml')) {
    detected.push({
      id: 'docker',
      name: 'Docker',
      category: 'container',
      icon: 'Container',
      fileSource: existingFiles.has('Dockerfile') ? 'Dockerfile' : 'docker-compose.yml',
      color: '#2496ed',
    });
  }

  // 6. Node.js & Web Ecosystem
  if (existingFiles.has('package.json')) {
    detected.push({
      id: 'nodejs',
      name: 'Node.js',
      category: 'runtime',
      icon: 'Node',
      fileSource: 'package.json',
      color: '#68a063',
    });

    if (existingFiles.has('tsconfig.json')) {
      detected.push({
        id: 'typescript',
        name: 'TypeScript',
        category: 'language',
        icon: 'TypeScript',
        fileSource: 'tsconfig.json',
        color: '#3178c6',
      });
    } else {
      detected.push({
        id: 'javascript',
        name: 'JavaScript',
        category: 'language',
        icon: 'JavaScript',
        fileSource: 'package.json',
        color: '#f7df1e',
      });
    }

    try {
      const pkgContent = await fs.readFile(path.join(rootPath, 'package.json'), 'utf-8');
      const pkg = JSON.parse(pkgContent);
      const allDeps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
      };

      if (allDeps['react']) {
        detected.push({
          id: 'react',
          name: 'React',
          category: 'framework',
          icon: 'Atom',
          version: allDeps['react'],
          fileSource: 'package.json',
          color: '#61dafb',
        });
      }

      if (allDeps['next']) {
        detected.push({
          id: 'nextjs',
          name: 'Next.js',
          category: 'framework',
          icon: 'Next',
          version: allDeps['next'],
          fileSource: 'package.json',
          color: '#ffffff',
        });
      }

      if (allDeps['vite']) {
        detected.push({
          id: 'vite',
          name: 'Vite',
          category: 'tool',
          icon: 'Zap',
          version: allDeps['vite'],
          fileSource: 'package.json',
          color: '#646cff',
        });
      }

      if (allDeps['tailwindcss']) {
        detected.push({
          id: 'tailwindcss',
          name: 'Tailwind CSS',
          category: 'tool',
          icon: 'Wind',
          version: allDeps['tailwindcss'],
          fileSource: 'package.json',
          color: '#38bdf8',
        });
      }

      if (allDeps['vue']) {
        detected.push({
          id: 'vue',
          name: 'Vue.js',
          category: 'framework',
          icon: 'Vue',
          version: allDeps['vue'],
          fileSource: 'package.json',
          color: '#42b883',
        });
      }

      if (allDeps['express']) {
        detected.push({
          id: 'express',
          name: 'Express',
          category: 'framework',
          icon: 'Server',
          version: allDeps['express'],
          fileSource: 'package.json',
          color: '#ffffff',
        });
      }
    } catch {
      // ignore json parse errors
    }
  }

  // 7. Git Repository
  if (existingFiles.has('.git')) {
    detected.push({
      id: 'git',
      name: 'Git',
      category: 'tool',
      icon: 'GitBranch',
      fileSource: '.git',
      color: '#f05032',
    });
  }

  return detected;
}
