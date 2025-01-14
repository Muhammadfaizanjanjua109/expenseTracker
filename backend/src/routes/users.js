// src/routes/user.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

// All routes are protected with auth middleware
router.use(auth);

// Profile routes
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);

// Password route
router.put('/password', userController.updatePassword);

// Preferences routes
router.get('/preferences', userController.getPreferences);
router.put('/preferences', userController.updatePreferences);

// Notification settings route
router.put('/notifications', userController.updateNotificationSettings);

module.exports = router;