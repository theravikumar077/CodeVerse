const express = require('express');
const { getUserSettings, updateUserSettings } = require('../controllers/settingsController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .get(protect, getUserSettings)
  .post(protect, updateUserSettings);

module.exports = router;
//
