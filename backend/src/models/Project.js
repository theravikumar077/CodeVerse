const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a project name'],
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    language: {
      type: String,
      enum: ['html', 'javascript', 'typescript', 'python', 'cpp', 'c', 'java', 'php', 'markdown', 'other'],
      default: 'javascript',
    },
    collaborators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isPublic: {
      type: Boolean,
      default: false,
    },
    gitRepoUrl: {
      type: String,
      default: '',
    },
    pathOnDisk: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Delete files from disk when project model is removed (optional or done in project controller)
const Project = mongoose.model('Project', projectSchema);
module.exports = Project;
