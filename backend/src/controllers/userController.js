// src/controllers/userController.js
const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const userController = {
    getProfile: async (req, res) => {
        try {
            const userId = req.userId;
            const result = await pool.query(
                'SELECT id, name, email, phone FROM users WHERE id = $1',
                [userId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }

            res.json(result.rows[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    updateProfile: async (req, res) => {
        try {
            const userId = req.userId;
            const { name, email, phone } = req.body;

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ message: 'Invalid email format' });
            }

            // Check if email is already taken by another user
            const emailCheck = await pool.query(
                'SELECT id FROM users WHERE email = $1 AND id != $2',
                [email, userId]
            );

            if (emailCheck.rows.length > 0) {
                return res.status(400).json({ message: 'Email is already in use' });
            }

            const result = await pool.query(
                `UPDATE users 
                SET name = $1, email = $2, phone = $3
                WHERE id = $4 
                RETURNING id, name, email, phone`,
                [name, email, phone, userId]
            );

            res.json(result.rows[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    updatePassword: async (req, res) => {
        try {
            const userId = req.userId;
            const { currentPassword, newPassword } = req.body;

            // Validate password length
            if (newPassword.length < 6) {
                return res.status(400).json({ 
                    message: 'Password must be at least 6 characters long' 
                });
            }

            // Get current user password
            const user = await pool.query(
                'SELECT password FROM users WHERE id = $1',
                [userId]
            );

            // Verify current password
            const isMatch = await bcrypt.compare(
                currentPassword, 
                user.rows[0].password
            );

            if (!isMatch) {
                return res.status(400).json({ message: 'Current password is incorrect' });
            }

            // Hash new password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            // Update password
            await pool.query(
                'UPDATE users SET password = $1 WHERE id = $2',
                [hashedPassword, userId]
            );

            res.json({ message: 'Password updated successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    getPreferences: async (req, res) => {
        try {
            const userId = req.userId;
            const result = await pool.query(
                'SELECT preferences FROM user_preferences WHERE user_id = $1',
                [userId]
            );

            if (result.rows.length === 0) {
                // Return default preferences if none exist
                return res.json({
                    theme: 'light',
                    currency: 'USD',
                    language: 'en',
                    timeZone: 'UTC'
                });
            }

            res.json(result.rows[0].preferences);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    updatePreferences: async (req, res) => {
        try {
            const userId = req.userId;
            const preferences = req.body;

            const result = await pool.query(
                `INSERT INTO user_preferences (user_id, preferences)
                VALUES ($1, $2)
                ON CONFLICT (user_id)
                DO UPDATE SET preferences = $2
                RETURNING preferences`,
                [userId, preferences]
            );

            res.json(result.rows[0].preferences);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    updateNotificationSettings: async (req, res) => {
        try {
            const userId = req.userId;
            const notificationSettings = req.body;

            const result = await pool.query(
                `INSERT INTO user_preferences (user_id, notification_settings)
                VALUES ($1, $2)
                ON CONFLICT (user_id)
                DO UPDATE SET notification_settings = $2
                RETURNING notification_settings`,
                [userId, notificationSettings]
            );

            res.json(result.rows[0].notification_settings);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    }
};

module.exports = userController;