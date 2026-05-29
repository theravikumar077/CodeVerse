const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');

// Get root workspaces directory from environment or fallback
const WORKSPACE_ROOT = path.resolve(process.env.WORKSPACE_DIR || './workspaces');

// Ensure root directory exists
fs.ensureDirSync(WORKSPACE_ROOT);

/**
 * Get the absolute path for a project's workspace
 */
const getProjectPath = (projectId) => {
  return path.join(WORKSPACE_ROOT, projectId.toString());
};

/**
 * Ensure workspace directory is created
 */
const initWorkspace = async (projectId) => {
  const projectPath = getProjectPath(projectId);
  await fs.ensureDir(projectPath);
  return projectPath;
};

/**
 * Scan directory recursively and return JSON tree structure sorted (directories first, then files)
 */
const scanDirectory = async (dirPath, relativeTo = dirPath) => {
  const items = await fs.readdir(dirPath);
  const result = [];

  for (const item of items) {
    // Skip hidden files like .git or .DS_Store
    if (item === '.git' || item === '.DS_Store' || item === 'node_modules') {
      continue;
    }

    const fullPath = path.join(dirPath, item);
    const relativePath = path.relative(relativeTo, fullPath).replace(/\\/g, '/');
    const stats = await fs.stat(fullPath);

    if (stats.isDirectory()) {
      const children = await scanDirectory(fullPath, relativeTo);
      result.push({
        name: item,
        path: relativePath,
        type: 'directory',
        children,
      });
    } else {
      result.push({
        name: item,
        path: relativePath,
        type: 'file',
        size: stats.size,
      });
    }
  }

  // Sort: directories first, then files, both alphabetically
  return result.sort((a, b) => {
    if (a.type === b.type) {
      return a.name.localeCompare(b.name);
    }
    return a.type === 'directory' ? -1 : 1;
  });
};

/**
 * Get project file tree
 */
const getFileTree = async (projectId) => {
  const projectPath = getProjectPath(projectId);
  if (!(await fs.pathExists(projectPath))) {
    await initWorkspace(projectId);
  }
  return await scanDirectory(projectPath);
};

/**
 * Read file contents
 */
const readFileContent = async (projectId, relativePath) => {
  const filePath = path.join(getProjectPath(projectId), relativePath);
  // Security check: ensure path is within the workspace
  if (!filePath.startsWith(getProjectPath(projectId))) {
    throw new Error('Access denied: path is outside workspace');
  }
  return await fs.readFile(filePath, 'utf8');
};

/**
 * Write file contents (creates file if not exists)
 */
const writeFileContent = async (projectId, relativePath, content = '') => {
  const filePath = path.join(getProjectPath(projectId), relativePath);
  if (!filePath.startsWith(getProjectPath(projectId))) {
    throw new Error('Access denied: path is outside workspace');
  }
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, 'utf8');
};

/**
 * Create folder
 */
const createFolder = async (projectId, relativePath) => {
  const folderPath = path.join(getProjectPath(projectId), relativePath);
  if (!folderPath.startsWith(getProjectPath(projectId))) {
    throw new Error('Access denied: path is outside workspace');
  }
  await fs.ensureDir(folderPath);
};

/**
 * Delete file or folder recursively
 */
const deletePath = async (projectId, relativePath) => {
  const targetPath = path.join(getProjectPath(projectId), relativePath);
  if (!targetPath.startsWith(getProjectPath(projectId))) {
    throw new Error('Access denied: path is outside workspace');
  }
  await fs.remove(targetPath);
};

/**
 * Rename/move file or folder
 */
const renamePath = async (projectId, oldRelativePath, newRelativePath) => {
  const oldPath = path.join(getProjectPath(projectId), oldRelativePath);
  const newPath = path.join(getProjectPath(projectId), newRelativePath);

  if (!oldPath.startsWith(getProjectPath(projectId)) || !newPath.startsWith(getProjectPath(projectId))) {
    throw new Error('Access denied: path is outside workspace');
  }

  await fs.move(oldPath, newPath, { overwrite: true });
};

/**
 * Create a ZIP archive of the project workspace
 */
const zipProjectWorkspace = (projectId, outputStream) => {
  const projectPath = getProjectPath(projectId);
  const archive = archiver('zip', { zlib: { level: 9 } });

  archive.on('error', (err) => {
    throw err;
  });

  archive.pipe(outputStream);
  archive.directory(projectPath, false); // false means don't include parent directory name in ZIP
  archive.finalize();
};

module.exports = {
  getProjectPath,
  initWorkspace,
  getFileTree,
  readFileContent,
  writeFileContent,
  createFolder,
  deletePath,
  renamePath,
  zipProjectWorkspace,
};
