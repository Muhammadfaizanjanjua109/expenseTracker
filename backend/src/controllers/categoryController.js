const pool = require('../config/db');

const categoryController = {
    createCategory: async (req, res) => {
        try {
            const { name } = req.body;
            const userId = req.userId;

            const result = await pool.query(
                'INSERT INTO categories (name, user_id) VALUES ($1, $2) RETURNING *',
                [name, userId]
            );

            res.json(result.rows[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    getCategories: async (req, res) => {
        try {
            const userId = req.userId;

            const result = await pool.query(
                'SELECT * FROM categories WHERE user_id = $1',
                [userId]
            );

            res.json(result.rows);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    updateCategory: async (req, res) => {
        try {
            const { id } = req.params;
            const { name } = req.body;
            const userId = req.userId;

            const result = await pool.query(
                'UPDATE categories SET name = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
                [name, id, userId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Category not found' });
            }

            res.json(result.rows[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    deleteCategory: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.userId;

            const result = await pool.query(
                'DELETE FROM categories WHERE id = $1 AND user_id = $2 RETURNING *',
                [id, userId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Category not found' });
            }

            res.json({ message: 'Category deleted successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    }
};

module.exports = categoryController;