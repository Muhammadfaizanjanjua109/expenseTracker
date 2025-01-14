const pool = require('../config/db');

const budgetController = {
    setBudget: async (req, res) => {
        try {
            const { category_id, amount, month } = req.body;
            const userId = req.userId;

            // Validation
            if (!category_id || !amount || !month) {
                return res.status(400).json({ 
                    status: 'error',
                    message: 'All fields are required: category_id, amount, month' 
                });
            }

            // Validate amount is positive
            if (amount <= 0) {
                return res.status(400).json({ 
                    status: 'error',
                    message: 'Budget amount must be greater than 0' 
                });
            }

            const result = await pool.query(
                `INSERT INTO budgets (user_id, category_id, amount, month)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (user_id, category_id, month)
                DO UPDATE SET amount = $3
                RETURNING *`,
                [userId, category_id, amount, month]
            );

            res.json({
                status: 'success',
                data: result.rows[0]
            });
        } catch (err) {
            console.error('Budget Error:', err);
            if (err.code === '42P01') {
                return res.status(500).json({
                    status: 'error',
                    message: 'Database setup incomplete. Please run the database migrations.',
                    details: 'The budgets table does not exist.'
                });
            }
            if (err.code === '23503') {
                return res.status(400).json({
                    status: 'error',
                    message: 'Invalid category selected.',
                    details: 'The selected category does not exist.'
                });
            }
            res.status(500).json({
                status: 'error',
                message: 'An error occurred while managing the budget.',
                details: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
    },

    getBudgets: async (req, res) => {
        try {
            const userId = req.userId;
            const { month } = req.query;

            let query = `
                SELECT b.*, c.name as category_name,
                    COALESCE(SUM(t.amount), 0) as spent_amount
                FROM budgets b
                LEFT JOIN categories c ON b.category_id = c.id
                LEFT JOIN transactions t ON t.category_id = b.category_id
                    AND t.user_id = b.user_id
                    AND DATE_TRUNC('month', t.date) = DATE_TRUNC('month', b.month::date)
                    AND t.type = 'expense'
                WHERE b.user_id = $1
            `;
            const params = [userId];

            if (month) {
                query += ` AND DATE_TRUNC('month', b.month::date) = DATE_TRUNC('month', $2::date)`;
                params.push(month);
            }

            query += ` GROUP BY b.id, c.name
                      ORDER BY b.month DESC, c.name`;

            const result = await pool.query(query, params);

            // Calculate percentage used for each budget
            const budgetsWithProgress = result.rows.map(budget => ({
                ...budget,
                percentage_used: ((budget.spent_amount / budget.amount) * 100).toFixed(2),
                remaining_amount: (budget.amount - budget.spent_amount).toFixed(2)
            }));

            res.json(budgetsWithProgress);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Server error' });
        }
    },

    updateBudget: async (req, res) => {
        try {
            const { id } = req.params;
            const { amount } = req.body;
            const userId = req.userId;

            if (!amount || amount <= 0) {
                return res.status(400).json({ 
                    message: 'Valid amount is required' 
                });
            }

            const result = await pool.query(
                `UPDATE budgets 
                SET amount = $1 
                WHERE id = $2 AND user_id = $3 
                RETURNING *`,
                [amount, id, userId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ 
                    message: 'Budget not found or unauthorized' 
                });
            }

            res.json(result.rows[0]);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Server error' });
        }
    },

    deleteBudget: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.userId;

            const result = await pool.query(
                'DELETE FROM budgets WHERE id = $1 AND user_id = $2 RETURNING *',
                [id, userId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ 
                    message: 'Budget not found or unauthorized' 
                });
            }

            res.json({ message: 'Budget deleted successfully' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Server error' });
        }
    },

    getBudgetProgress: async (req, res) => {
        try {
            const userId = req.userId;
            const { month } = req.query;

            if (!month) {
                return res.status(400).json({ 
                    message: 'Month parameter is required' 
                });
            }

            const query = `
                SELECT 
                    c.name as category_name,
                    b.amount as budget_amount,
                    COALESCE(SUM(t.amount), 0) as spent_amount,
                    b.month,
                    CASE 
                        WHEN COALESCE(SUM(t.amount), 0) >= b.amount THEN true 
                        ELSE false 
                    END as is_exceeded
                FROM budgets b
                JOIN categories c ON b.category_id = c.id
                LEFT JOIN transactions t ON t.category_id = b.category_id 
                    AND t.user_id = b.user_id
                    AND DATE_TRUNC('month', t.date) = DATE_TRUNC('month', b.month::date)
                    AND t.type = 'expense'
                WHERE b.user_id = $1 
                AND DATE_TRUNC('month', b.month::date) = DATE_TRUNC('month', $2::date)
                GROUP BY c.name, b.amount, b.month
                ORDER BY c.name
            `;

            const result = await pool.query(query, [userId, month]);

            const budgetProgress = result.rows.map(budget => ({
                ...budget,
                percentage_used: ((budget.spent_amount / budget.budget_amount) * 100).toFixed(2),
                remaining_amount: (budget.budget_amount - budget.spent_amount).toFixed(2)
            }));

            res.json(budgetProgress);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Server error' });
        }
    }
};

module.exports = budgetController;