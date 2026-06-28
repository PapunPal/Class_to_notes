const express = require('express');
const router = Router = express.Router();
const { protect, requireRole } = require('../middleware/auth.middleware');
const {
  getUserProfile,
  updateUserProfile,
  getAdminAnalytics,
  getAllUsers,
  deleteUser
} = require('../controllers/user.controller');

// Profile routes (Any logged-in user)
router.get('/profile', protect, getUserProfile);
router.patch('/profile', protect, updateUserProfile);

// Admin routes
router.get('/analytics', protect, requireRole(['admin']), getAdminAnalytics);
router.get('/', protect, requireRole(['admin']), getAllUsers);
router.delete('/:id', protect, requireRole(['admin']), deleteUser);

module.exports = router;
