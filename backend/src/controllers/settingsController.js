const Setting = require('../models/Setting');

// @desc    Get user settings
// @route   GET /api/settings
// @access  Private
const getUserSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne({ user: req.user._id });
    
    // Auto-create if not present
    if (!settings) {
      settings = await Setting.create({ user: req.user._id });
    }

    res.json({ success: true, settings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error loading preferences' });
  }
};

// @desc    Update user settings
// @route   POST /api/settings
// @access  Private
const updateUserSettings = async (req, res) => {
  try {
    const { theme, fontSize, fontFamily, tabSize, wordWrap, autoSave, minimap, autoCloseBrackets, formatOnSave } = req.body;

    let settings = await Setting.findOne({ user: req.user._id });
    if (!settings) {
      settings = new Setting({ user: req.user._id });
    }

    // Assign preferences
    if (theme !== undefined) settings.theme = theme;
    if (fontSize !== undefined) settings.fontSize = fontSize;
    if (fontFamily !== undefined) settings.fontFamily = fontFamily;
    if (tabSize !== undefined) settings.tabSize = tabSize;
    if (wordWrap !== undefined) settings.wordWrap = wordWrap;
    if (autoSave !== undefined) settings.autoSave = autoSave;
    if (minimap !== undefined) settings.minimap = minimap;
    if (autoCloseBrackets !== undefined) settings.autoCloseBrackets = autoCloseBrackets;
    if (formatOnSave !== undefined) settings.formatOnSave = formatOnSave;

    await settings.save();

    res.json({ success: true, settings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error saving preferences' });
  }
};

module.exports = {
  getUserSettings,
  updateUserSettings,
};
