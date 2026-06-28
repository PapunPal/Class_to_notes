const User = require('../models/user.model');

// @desc    Get current user profile
// @route   GET /users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error('Get profile error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update user profile
// @route   PATCH /users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update name
    if (req.body.name) user.name = req.body.name;
    
    // Update email (check uniqueness if changed)
    if (req.body.email && req.body.email !== user.email) {
      const emailExists = await User.findOne({ email: req.body.email });
      if (emailExists) {
        return res.status(400).json({ success: false, message: 'Email is already in use' });
      }
      user.email = req.body.email;
    }

    // Update avatar
    if (req.body.avatar) user.avatar = req.body.avatar;

    // Update password (triggers mongoose pre-save hook for hashing)
    if (req.body.password) {
      if (req.body.password.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
      }
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      success: true,
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        avatar: updatedUser.avatar
      }
    });
  } catch (error) {
    console.error('Update profile error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get dashboard analytics (Admin only)
// @route   GET /users/analytics
// @access  Private (Admin)
const getAdminAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalTeachers = await User.countDocuments({ role: 'teacher' });
    const totalStudents = await User.countDocuments({ role: 'student' });
    
    const Lecture = require('../models/lecture.model');
    const Notes = require('../models/notes.model');
    const Chat = require('../models/chat.model');
    
    const totalLectures = await Lecture.countDocuments();
    const totalNotes = await Notes.countDocuments();
    const totalChatQueries = await Chat.countDocuments();

    res.json({
      success: true,
      analytics: {
        totalUsers,
        totalTeachers,
        totalStudents,
        totalLectures,
        totalNotesGenerated: totalNotes,
        totalChatQueries
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all users (Admin only)
// @route   GET /users
// @access  Private (Admin)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, users });
  } catch (error) {
    console.error('Get all users error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Block/Delete User (Admin only)
// @route   DELETE /users/:id
// @access  Private (Admin)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot delete admin accounts' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  getAdminAnalytics,
  getAllUsers,
  deleteUser
};
