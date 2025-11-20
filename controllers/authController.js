const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

const authController = {
  // Register new user
  register: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array(),
        });
      }

      const { username, email, password, firstName, lastName, phone, role } = req.body;
      // Normalize inputs
      const normUsername = (username || '').trim();
      const normEmail = (email || '').trim().toLowerCase();
      const normFirstName = (firstName || '').trim();
      const normLastName = (lastName || '').trim();
      const normPhone = (phone || '').trim();

      // Check if user already exists
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [{ email: normEmail }, { username: normUsername }],
        },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email or username already exists',
        });
      }

      // Create new user
      const user = await User.create({
        username: normUsername,
        email: normEmail,
        password,
        firstName: normFirstName,
        lastName: normLastName,
        phone: normPhone || null,
        role: role || 'user',
      });

      // Start a session immediately (like login) so user can begin billing flow right away
      const sessionId = user.generateSessionId();
      await user.update({
        lastLogin: new Date(),
        sessionId: sessionId,
        sessionExpiry: user.sessionExpiry,
      });

      // Generate JWT token (include sessionId)
      const token = jwt.sign(
        { 
          userId: user.id, 
          role: user.role,
          username: user.username,
          sessionId: sessionId
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
          },
          token,
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  },

  // Login user
  login: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array(),
        });
      }

      const { username, password } = req.body;
      const identifier = (username || '').trim();

      // Find user by username or email
      const user = await User.findOne({
        where: {
          [Op.or]: [
            { username: identifier },
            { email: identifier.toLowerCase() }
          ],
        },
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated',
        });
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      // Generate session ID and update user
      const sessionId = user.generateSessionId();
      await user.update({
        lastLogin: new Date(),
        sessionId: sessionId,
        sessionExpiry: user.sessionExpiry,
      });

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.id, 
          role: user.role,
          username: user.username,
          sessionId: sessionId
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            sessionId: sessionId,
            sessionExpiry: user.sessionExpiry,
          },
          token,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  },

  // Logout user
  logout: async (req, res) => {
    try {
      const userId = req.user.userId;

      // Clear session data
      await User.update(
        {
          sessionId: null,
          sessionExpiry: null,
        },
        {
          where: { id: userId },
        }
      );

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  },

  // Get current user profile
  getProfile: async (req, res) => {
    try {
      const userId = req.user.userId;

      const user = await User.findByPk(userId, {
        attributes: { exclude: ['password'] },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            role: user.role,
            isActive: user.isActive,
            lastLogin: user.lastLogin,
            sessionExpiry: user.sessionExpiry,
          },
        },
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  },

  // Update user profile
  updateProfile: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array(),
        });
      }

      const userId = req.user.userId;
      const { firstName, lastName, phone, email } = req.body;
      const normEmail = email ? email.trim().toLowerCase() : undefined;
      const normFirstNameUpdate = firstName !== undefined ? firstName.trim() : undefined;
      const normLastNameUpdate = lastName !== undefined ? lastName.trim() : undefined;
      const normPhoneUpdate = phone !== undefined ? phone.trim() : undefined;

      // Check if email is already taken by another user
      if (normEmail) {
        const existingUser = await User.findOne({
          where: {
            email: normEmail,
            id: { [Op.ne]: userId },
          },
        });

        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'Email is already taken by another user',
          });
        }
      }

      // Update user
      await User.update(
        { 
          firstName: normFirstNameUpdate,
          lastName: normLastNameUpdate,
          phone: normPhoneUpdate,
          email: normEmail,
        },
        { where: { id: userId } }
      );

      const updatedUser = await User.findByPk(userId, {
        attributes: { exclude: ['password'] },
      });

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: updatedUser,
        },
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  },

  // Change password
  changePassword: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array(),
        });
      }

      const userId = req.user.userId;
      const { currentPassword, newPassword } = req.body;

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect',
        });
      }

      // Update password
      await user.update({ password: newPassword });

      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  },

  // Verify session (for session timeout check)
  verifySession: async (req, res) => {
    try {
      const userId = req.user.userId;
      const sessionId = req.user.sessionId;

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Check if session is valid
      if (user.sessionId !== sessionId || !user.isSessionValid()) {
        return res.status(401).json({
          success: false,
          message: 'Session expired',
          sessionExpired: true,
        });
      }

      res.json({
        success: true,
        message: 'Session is valid',
        data: {
          sessionExpiry: user.sessionExpiry,
          timeRemaining: user.sessionExpiry - new Date(),
        },
      });
    } catch (error) {
      console.error('Verify session error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  },
};

module.exports = authController;
