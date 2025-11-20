const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const validation = require('../middleware/validation');

// Public routes
router.post('/register', validation.register, authController.register);
router.post('/login', validation.login, authController.login);

// Protected routes
router.use(verifyToken); // All routes below require authentication

router.post('/logout', authController.logout);
router.get('/profile', authController.getProfile);
router.put('/profile', validation.updateProfile, authController.updateProfile);
router.put('/change-password', validation.changePassword, authController.changePassword);
router.get('/verify-session', authController.verifySession);

module.exports = router;
