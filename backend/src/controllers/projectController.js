const Project = require('../models/Project');
const fileService = require('../services/fileService');
const lspService = require('../services/lspService');
const dockerService = require('../services/dockerService');
const path = require('path');
const fs = require('fs-extra');

// Helper to write default boilerplate files based on language selection
const generateBoilerplate = async (projectId, language) => {
  try {
    switch (language) {
      case 'html':
        await fileService.writeFileContent(projectId, 'index.html', `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RR CodeVerse App</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <h1>Welcome to RR CodeVerse!</h1>
        <p>Start editing this project to see live updates.</p>
        <button id="clickBtn">Click Me</button>
    </div>
    <script src="app.js"></script>
</body>
</html>`);
        await fileService.writeFileContent(projectId, 'style.css', `body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background-color: #0e1117;
    color: #c9d1d9;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    margin: 0;
}
.container {
    text-align: center;
    background: #161b22;
    padding: 30px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    border: 1px solid #30363d;
}
button {
    background-color: #238636;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 16px;
    transition: background 0.2s;
}
button:hover {
    background-color: #2ea043;
}`);
        await fileService.writeFileContent(projectId, 'app.js', `// Live Preview interactive script
console.log("RR CodeVerse scripts loaded successfully!");

document.getElementById('clickBtn').addEventListener('click', () => {
    alert("Hello from RR CodeVerse Live Server!");
});`);
        break;
      
      case 'python':
        await fileService.writeFileContent(projectId, 'main.py', `# RR CodeVerse Python Sandbox
def greet(name):
    print(f"Hello, {name} from isolated container!")

if __name__ == "__main__":
    greet("Developer")
`);
        break;

      case 'javascript':
        await fileService.writeFileContent(projectId, 'app.js', `// RR CodeVerse JavaScript Node Runner
const greet = (name) => {
  console.log(\`Hello, \${name} from RR CodeVerse Node.js environment!\`);
};

greet("Developer");
`);
        break;

      case 'typescript':
        await fileService.writeFileContent(projectId, 'app.ts', `// RR CodeVerse TypeScript Runner
const greet = (name: string): void => {
  console.log(\`Hello, \${name} in TypeScript!\`);
};

greet("Developer");
`);
        break;

      case 'cpp':
        await fileService.writeFileContent(projectId, 'main.cpp', `// RR CodeVerse C++ Sandbox
#include <iostream>

int main() {
    std::cout << "Hello World from RR CodeVerse C++ Sandbox!" << std::endl;
    return 0;
}
`);
        break;

      case 'c':
        await fileService.writeFileContent(projectId, 'main.c', `/* RR CodeVerse C Sandbox */
#include <stdio.h>

int main() {
    printf("Hello World from RR CodeVerse C Sandbox!\\n");
    return 0;
}
`);
        break;

      case 'java':
        await fileService.writeFileContent(projectId, 'Main.java', `// RR CodeVerse Java Sandbox
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello World from RR CodeVerse Java Sandbox!");
    }
}
`);
        break;

      case 'php':
        await fileService.writeFileContent(projectId, 'index.php', `<?php
// RR CodeVerse PHP Sandbox
echo "Hello World from RR CodeVerse PHP Sandbox!\\n";
?>
`);
        break;

      case 'markdown':
        await fileService.writeFileContent(projectId, 'README.md', `# RR CodeVerse Workspace

Welcome to your new **RR CodeVerse Workspace**.

## Features
- Complete File Explorer
- Monaco Code Editor
- Integrated Sandbox Execution
- Realtime Live Preview for HTML/CSS/JS
- Version Control (Git)
- Collaborative Live Share
`);
        break;

      default:
        await fileService.writeFileContent(projectId, 'main.txt', `Welcome to RR CodeVerse IDE!`);
        break;
    }
  } catch (error) {
    console.error('Failed to create default boilerplate files:', error);
  }
};

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res) => {
  try {
    const { name, description, language, isPublic, gitRepoUrl } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Please provide a project name' });
    }

    // Temporary placeholder path on disk, we update it after creation
    const tempDiskPath = 'pending';

    const project = await Project.create({
      name,
      description,
      language: language || 'javascript',
      isPublic: !!isPublic,
      owner: req.user._id,
      pathOnDisk: tempDiskPath,
      gitRepoUrl: gitRepoUrl || '',
    });

    // Resolve real workspace path and update DB record
    const realDiskPath = await fileService.initWorkspace(project._id);
    project.pathOnDisk = realDiskPath;
    await project.save();

    // If cloning is NOT requested, generate template code
    if (!gitRepoUrl) {
      await generateBoilerplate(project._id, project.language);
    }

    res.status(201).json({
      success: true,
      project,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error creating project' });
  }
};

// @desc    Get user's projects (owned + collaborative)
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ owner: req.user._id }, { collaborators: req.user._id }],
    })
      .populate('owner', 'username email avatar')
      .populate('collaborators', 'username email avatar')
      .sort('-updatedAt');

    res.json({ success: true, projects });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error listing projects' });
  }
};

// @desc    Get single project and file tree
// @route   GET /api/projects/:id
// @access  Private (or Public if isPublic is true)
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'username email avatar')
      .populate('collaborators', 'username email avatar');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Auth verification
    const isOwner = project.owner._id.toString() === req.user._id.toString();
    const isCollab = project.collaborators.some((c) => c._id.toString() === req.user._id.toString());

    if (!project.isPublic && !isOwner && !isCollab) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const fileTree = await fileService.getFileTree(project._id);

    res.json({
      success: true,
      project,
      fileTree,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error loading project details' });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Only owner can delete
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied: only owners can delete projects' });
    }

    // Remove from disk
    await fileService.deletePath(project._id, '');

    // Remove DB record
    await project.deleteOne();

    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error deleting project' });
  }
};

// @desc    Read file content
// @route   GET /api/projects/:id/file
// @access  Private
const getFileContent = async (req, res) => {
  try {
    const { filePath } = req.query;
    if (!filePath) {
      return res.status(400).json({ success: false, message: 'Please provide filePath parameter' });
    }

    const content = await fileService.readFileContent(req.params.id, filePath);
    res.json({ success: true, content });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || 'Error reading file' });
  }
};

// @desc    Write file content (create or update)
// @route   POST /api/projects/:id/file
// @access  Private
const updateOrCreateFile = async (req, res) => {
  try {
    const { filePath, content } = req.body;
    if (!filePath) {
      return res.status(400).json({ success: false, message: 'Please provide filePath' });
    }

    await fileService.writeFileContent(req.params.id, filePath, content || '');
    
    // Perform syntax linting (LSP integration)
    const validationResult = await lspService.validateFileSyntax(req.params.id, filePath);

    res.json({
      success: true,
      message: 'File saved successfully',
      markers: validationResult.markers || [],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || 'Error saving file' });
  }
};

// @desc    Create new folder
// @route   POST /api/projects/:id/folder
// @access  Private
const createNewFolder = async (req, res) => {
  try {
    const { folderPath } = req.body;
    if (!folderPath) {
      return res.status(400).json({ success: false, message: 'Please provide folderPath' });
    }

    await fileService.createFolder(req.params.id, folderPath);
    res.status(201).json({ success: true, message: 'Folder created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || 'Error creating folder' });
  }
};

// @desc    Rename/move file or folder
// @route   PUT /api/projects/:id/rename
// @access  Private
const renameFileOrFolder = async (req, res) => {
  try {
    const { oldPath, newPath } = req.body;
    if (!oldPath || !newPath) {
      return res.status(400).json({ success: false, message: 'Please provide oldPath and newPath' });
    }

    await fileService.renamePath(req.params.id, oldPath, newPath);
    res.json({ success: true, message: 'Renamed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || 'Error renaming item' });
  }
};

// @desc    Delete file or folder
// @route   DELETE /api/projects/:id/delete
// @access  Private
const deleteFileOrFolder = async (req, res) => {
  try {
    const { targetPath } = req.body;
    if (!targetPath) {
      return res.status(400).json({ success: false, message: 'Please provide targetPath' });
    }

    await fileService.deletePath(req.params.id, targetPath);
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || 'Error deleting item' });
  }
};

// @desc    Zip and download project workspace
// @route   GET /api/projects/:id/zip
// @access  Private
const downloadProjectZip = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    res.attachment(`${project.name.replace(/\s+/g, '_')}_workspace.zip`);
    fileService.zipProjectWorkspace(project._id, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error creating zip file' });
  }
};

// @desc    Upload files or folders
// @route   POST /api/projects/:id/upload
// @access  Private
const uploadFilesToWorkspace = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const projectId = req.params.id;
    const projectPath = fileService.getProjectPath(projectId);

    for (const file of req.files) {
      // Relative path is passed inside req.body.paths or header relative-path for folder uploads.
      // If we use standard multer, we can read file.originalname, or custom headers.
      // E.g., folder uploads transmit webkitRelativePath. Multer originalname carries it if sent appropriately.
      // If not, we fall back to flat file save.
      const relativePath = file.originalname;
      const targetFilePath = path.join(projectPath, relativePath);

      await fs.ensureDir(path.dirname(targetFilePath));
      await fs.move(file.path, targetFilePath, { overwrite: true });
    }

    res.json({ success: true, message: 'Files uploaded successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to upload files' });
  }
};

const runProjectCode = async (req, res) => {
  try {
    const { language, activeFileName } = req.body;
    if (!language || !activeFileName) {
      return res.status(400).json({ success: false, message: 'Please provide language and activeFileName' });
    }

    const result = await dockerService.runCodeInDocker(req.params.id, language, activeFileName);
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || 'Execution error' });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  deleteProject,
  getFileContent,
  updateOrCreateFile,
  createNewFolder,
  renameFileOrFolder,
  deleteFileOrFolder,
  downloadProjectZip,
  uploadFilesToWorkspace,
  runProjectCode,
};
