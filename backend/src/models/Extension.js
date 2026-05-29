const mongoose = require('mongoose');

const extensionSchema = new mongoose.Schema(
  {
    extensionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    publisher: {
      type: String,
      required: true,
      default: 'RR CodeVerse',
    },
    version: {
      type: String,
      required: true,
      default: '1.0.0',
    },
    description: {
      type: String,
      default: '',
    },
    icon: {
      type: String,
      default: 'puzzle', // Icon name to load from frontend icons (e.g. Lucide)
    },
    category: {
      type: String,
      enum: ['Linter', 'Formatter', 'Git', 'Utility', 'Theme'],
      default: 'Utility',
    },
    downloads: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Extension = mongoose.model('Extension', extensionSchema);
module.exports = Extension;
