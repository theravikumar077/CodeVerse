const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    theme: {
      type: String,
      default: 'dark-plus',
      enum: ['dark-plus', 'light-plus', 'monokai', 'dracula', 'github-dark'],
    },
    fontSize: {
      type: Number,
      default: 14,
    },
    fontFamily: {
      type: String,
      default: 'Outfit, Inter, Fira Code, Consolas, Courier New, monospace',
    },
    tabSize: {
      type: Number,
      default: 4,
    },
    wordWrap: {
      type: String,
      default: 'on',
      enum: ['on', 'off'],
    },
    autoSave: {
      type: String,
      default: 'off',
      enum: ['on', 'off', 'afterDelay'],
    },
    minimap: {
      type: Boolean,
      default: true,
    },
    autoCloseBrackets: {
      type: Boolean,
      default: true,
    },
    formatOnSave: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Setting = mongoose.model('Setting', settingSchema);
module.exports = Setting;
