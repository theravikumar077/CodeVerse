const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
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
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Configure temporary upload storage
const tempUploadDir = path.join(__dirname, '../../uploads/temp');
if (!fs.existsSync(tempUploadDir)) {
  fs.mkdirSync(tempUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempUploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `upload_${Date.now()}_${file.originalname}`);
  },
});

const upload = multer({ storage });

// Project CRUD
router.route('/')
  .post(protect, createProject)
  .get(protect, getProjects);

router.route('/:id')
  .get(protect, getProjectById)
  .delete(protect, deleteProject);

// Workspace actions
router.get('/:id/file', protect, getFileContent);
router.post('/:id/file', protect, updateOrCreateFile);
router.post('/:id/folder', protect, createNewFolder);
router.put('/:id/rename', protect, renameFileOrFolder);
router.delete('/:id/delete', protect, deleteFileOrFolder);
router.get('/:id/zip', protect, downloadProjectZip);
router.post('/:id/upload', protect, upload.array('files'), uploadFilesToWorkspace);
router.post('/:id/run', protect, runProjectCode);

module.exports = router;
