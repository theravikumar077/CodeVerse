const simpleGit = require('simple-git');
const { getProjectPath } = require('../services/fileService');
const Project = require('../models/Project');
const fs = require('fs-extra');

// Helper to initialize simple-git on project path
const getGitInstance = (projectId) => {
  const projectPath = getProjectPath(projectId);
  if (!fs.existsSync(projectPath)) {
    throw new Error('Workspace directory does not exist');
  }
  return simpleGit(projectPath);
};

// @desc    Git Status of project
// @route   GET /api/git/:id/status
// @access  Private
const gitStatus = async (req, res) => {
  try {
    const projectId = req.params.id;
    const git = getGitInstance(projectId);

    // Check if directory is a git repository
    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
      return res.json({
        success: true,
        isRepository: false,
        currentBranch: 'none',
        changedFiles: [],
        branches: [],
      });
    }

    const status = await git.status();
    const branches = await git.branchLocal();

    // Map changed files (modified, untracked, deleted, etc.)
    const changedFiles = status.files.map((file) => {
      // Map simple-git status codes to human readable statuses
      let fileStatus = 'modified';
      if (file.index === '?' || file.working_dir === '?') fileStatus = 'untracked';
      else if (file.index === 'A') fileStatus = 'added';
      else if (file.index === 'D' || file.working_dir === 'D') fileStatus = 'deleted';

      return {
        path: file.path,
        status: fileStatus,
        staged: file.index !== ' ' && file.index !== '?',
      };
    });

    res.json({
      success: true,
      isRepository: true,
      currentBranch: status.current,
      changedFiles,
      branches: branches.all,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error checking Git status' });
  }
};

// @desc    Initialize Git Repository in workspace
// @route   POST /api/git/:id/init
// @access  Private
const gitInit = async (req, res) => {
  try {
    const projectId = req.params.id;
    const git = getGitInstance(projectId);

    const isRepo = await git.checkIsRepo();
    if (isRepo) {
      return res.status(400).json({ success: false, message: 'Repository is already initialized' });
    }

    await git.init();
    
    // Create an initial commit to get branch set up
    await fs.writeFile(`${getProjectPath(projectId)}/.gitignore`, 'node_modules/\nuploads/\n.env\n');
    await git.add('.gitignore');
    await git.commit('Initial repository setup');

    res.json({ success: true, message: 'Git repository initialized successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to initialize Git' });
  }
};

// @desc    Git Add / Stage changes
// @route   POST /api/git/:id/add
// @access  Private
const gitAdd = async (req, res) => {
  try {
    const { filePath } = req.body; // Can be a single file path or "." for all
    const git = getGitInstance(req.params.id);

    await git.add(filePath || '.');
    res.json({ success: true, message: 'Changes staged successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Git add failed' });
  }
};

// @desc    Git Unstage / Restore staged changes
// @route   POST /api/git/:id/unstage
// @access  Private
const gitUnstage = async (req, res) => {
  try {
    const { filePath } = req.body;
    const git = getGitInstance(req.params.id);

    await git.reset(['HEAD', filePath || '.']);
    res.json({ success: true, message: 'Changes unstaged successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Git unstage failed' });
  }
};

// @desc    Git Commit changes
// @route   POST /api/git/:id/commit
// @access  Private
const gitCommit = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: 'Please provide a commit message' });
    }

    const git = getGitInstance(req.params.id);
    const summary = await git.commit(message);

    res.json({
      success: true,
      message: 'Changes committed successfully',
      summary,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Git commit failed' });
  }
};

// @desc    Git Checkout / Switch branches or create branch
// @route   POST /api/git/:id/checkout
// @access  Private
const gitCheckout = async (req, res) => {
  try {
    const { branchName, createNew } = req.body;
    if (!branchName) {
      return res.status(400).json({ success: false, message: 'Please provide a branch name' });
    }

    const git = getGitInstance(req.params.id);

    if (createNew) {
      await git.checkoutLocalBranch(branchName);
    } else {
      await git.checkout(branchName);
    }

    res.json({ success: true, message: `Switched to branch ${branchName}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: `Git checkout failed: ${error.message}` });
  }
};

// @desc    Git History Log
// @route   GET /api/git/:id/log
// @access  Private
const gitLog = async (req, res) => {
  try {
    const git = getGitInstance(req.params.id);
    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
      return res.json({ success: true, log: [] });
    }

    const log = await git.log({ maxCount: 20 });
    res.json({
      success: true,
      log: log.all,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to retrieve Git logs' });
  }
};

// @desc    Git Clone Repository
// @route   POST /api/git/clone
// @access  Private
const gitClone = async (req, res) => {
  try {
    const { gitRepoUrl, name, description } = req.body;
    if (!gitRepoUrl || !name) {
      return res.status(400).json({ success: false, message: 'Please provide Git URL and project name' });
    }

    // Create MongoDB project record
    const tempDiskPath = 'pending';
    const project = await Project.create({
      name,
      description: description || 'Cloned Git Repository',
      language: 'other',
      owner: req.user._id,
      pathOnDisk: tempDiskPath,
      gitRepoUrl,
    });

    const projectPath = getProjectPath(project._id);
    await fs.ensureDir(projectPath);

    // Update database record path
    project.pathOnDisk = projectPath;
    await project.save();

    console.log(`Cloning ${gitRepoUrl} to ${projectPath}...`);

    // Execute clone
    const git = simpleGit(projectPath);
    await git.clone(gitRepoUrl, '.', ['--depth', '1']);

    res.status(201).json({
      success: true,
      message: 'Repository cloned successfully',
      project,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: `Git clone failed: ${error.message}` });
  }
};

module.exports = {
  gitStatus,
  gitInit,
  gitAdd,
  gitUnstage,
  gitCommit,
  gitCheckout,
  gitLog,
  gitClone,
};
