const express = require('express');
const {
  gitStatus,
  gitInit,
  gitAdd,
  gitUnstage,
  gitCommit,
  gitCheckout,
  gitLog,
  gitClone,
} = require('../controllers/gitController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/clone', protect, gitClone);
router.get('/:id/status', protect, gitStatus);
router.post('/:id/init', protect, gitInit);
router.post('/:id/add', protect, gitAdd);
router.post('/:id/unstage', protect, gitUnstage);
router.post('/:id/commit', protect, gitCommit);
router.post('/:id/checkout', protect, gitCheckout);
router.get('/:id/log', protect, gitLog);

module.exports = router;
