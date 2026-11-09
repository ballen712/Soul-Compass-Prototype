#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const PREFIX = '[SOUL COMPASS EXPO LAUNCH DIAGNOSTICS]';

function output(label, value) {
  console.log(`${PREFIX} ${label}: ${value}`);
}

function run(command, args, cwd) {
  try {
    const result = spawnSync(command, args, {
      cwd,
      encoding: 'utf8',
      timeout: 5000,
      windowsHide: true,
    });

    if (result.error || result.status !== 0) return null;
    const value = String(result.stdout || '').trim();
    return value || null;
  } catch {
    return null;
  }
}

function findWorkspaceFile(cwd) {
  const currentDirectory = path.resolve(cwd);
  const currentDirectoryHasFile = fs.existsSync(
    path.join(currentDirectory, 'pnpm-workspace.yaml'),
  );
  let parentDirectoryHasFile = false;
  let discoveredFile = currentDirectoryHasFile
    ? path.join(currentDirectory, 'pnpm-workspace.yaml')
    : null;
  let directory = path.dirname(currentDirectory);

  while (true) {
    const candidate = path.join(directory, 'pnpm-workspace.yaml');
    if (fs.existsSync(candidate)) {
      parentDirectoryHasFile = true;
      if (!discoveredFile) discoveredFile = candidate;
    }

    const parent = path.dirname(directory);
    if (parent === directory) break;
    directory = parent;
  }

  return {
    currentDirectoryHasFile,
    parentDirectoryHasFile,
    filePath: discoveredFile,
  };
}

function extractSection(lines, sectionName) {
  const headerIndex = lines.findIndex((line) =>
    new RegExp(`^${sectionName}:\\s*(?:#.*)?$`).test(line),
  );
  if (headerIndex < 0) return null;

  let endIndex = headerIndex + 1;
  while (endIndex < lines.length) {
    const line = lines[endIndex];
    if (line.trim() === '' || /^\s/.test(line) || /^\s*#/.test(line)) {
      endIndex += 1;
      continue;
    }
    break;
  }

  return {
    startIndex: headerIndex,
    lines: lines.slice(headerIndex, endIndex),
  };
}

function printEsbuildConfiguration(filePath) {
  if (!filePath) {
    output('esbuild approvals', 'unavailable; no pnpm-workspace.yaml was discovered');
    return;
  }

  let contents;
  try {
    contents = fs.readFileSync(filePath, 'utf8');
  } catch {
    output('workspace config', `${filePath} (could not be read)`);
    output('esbuild approvals', 'unavailable; raw configuration was not read');
    return;
  }

  output('workspace config', filePath);
  const lines = contents.split(/\r?\n/);
  let safelyReported = true;

  for (const sectionName of ['allowBuilds', 'onlyBuiltDependencies']) {
    const section = extractSection(lines, sectionName);
    if (!section) {
      output(`${sectionName} esbuild entry`, 'not found or not safely parsed');
      safelyReported = false;
      continue;
    }

    const match = section.lines.findIndex((line, index) => {
      if (index === 0) return false;
      if (sectionName === 'allowBuilds') {
        return /^\s+['"]?esbuild['"]?\s*:/.test(line);
      }
      return /^\s+-\s*['"]?esbuild['"]?\s*(?:#.*)?$/.test(line);
    });

    if (match < 0) {
      output(`${sectionName} esbuild entry`, 'not found in the section');
      safelyReported = false;
      continue;
    }

    const lineNumber = section.startIndex + match + 1;
    output(
      `${sectionName} esbuild entry`,
      `${filePath}:${lineNumber}: ${section.lines[match].trim()}`,
    );
  }

  if (!safelyReported) {
    output('raw relevant config lines', 'fallback; printed without interpreting values');
    lines.forEach((line, index) => {
      if (/allowBuilds|onlyBuiltDependencies|esbuild/.test(line)) {
        console.log(`${PREFIX} ${filePath}:${index + 1}: ${line}`);
      }
    });
  }
}

function main() {
  console.log(`${PREFIX} =====`);

  const cwd = process.cwd();
  output('working directory', cwd);
  output(
    'original install invocation directory (INIT_CWD)',
    process.env.INIT_CWD || 'unavailable',
  );
  output(
    'package-manager user agent (npm_config_user_agent)',
    process.env.npm_config_user_agent || 'unavailable',
  );
  output('pnpm version', run('pnpm', ['--version'], cwd) || 'unavailable');
  output('Node version', run('node', ['--version'], cwd) || 'unavailable');
  output('Git HEAD', run('git', ['rev-parse', 'HEAD'], cwd) || 'unavailable');
  output(
    'Git branch',
    run('git', ['branch', '--show-current'], cwd) || 'unavailable (no branch metadata)',
  );

  const workspace = findWorkspaceFile(cwd);
  output('current directory contains pnpm-workspace.yaml', workspace.currentDirectoryHasFile ? 'yes' : 'no');
  output('a parent directory contains pnpm-workspace.yaml', workspace.parentDirectoryHasFile ? 'yes' : 'no');
  output('discovered workspace file', workspace.filePath || 'none');
  printEsbuildConfiguration(workspace.filePath);

  console.log(`${PREFIX} =====`);
}

try {
  main();
} catch (error) {
  output('diagnostics status', `non-fatal error: ${error && error.message ? error.message : 'unknown'}`);
}
