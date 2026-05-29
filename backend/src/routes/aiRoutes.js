const express = require('express');
const { processAIChat } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/chat', protect, processAIChat);

module.exports = router;
//
