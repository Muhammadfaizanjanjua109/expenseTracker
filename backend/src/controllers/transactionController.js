const pool = require('../config/db');
const checkBudgetLimits = async (userId, categoryId, month = new Date()) => {
    try {
        // Get the current month's budget and spending for the category
        const result = await pool.query(
            `SELECT 
                b.amount as budget_amount,
                COALESCE(SUM(t.amount), 0) as spent_amount
            FROM budgets b
            LEFT JOIN transactions t ON 
                t.category_id = b.category_id 
                AND t.user_id = b.user_id
                AND DATE_TRUNC('month', t.date) = DATE_TRUNC('month', b.month::date)
                AND t.type = 'expense'
            WHERE b.user_id = $1 
            AND b.category_id = $2
            AND DATE_TRUNC('month', b.month::date) = DATE_TRUNC('month', $3::date)
            GROUP BY b.amount`,
            [userId, categoryId, month]
        );

        if (result.rows.length > 0) {
            const { budget_amount, spent_amount } = result.rows[0];
            const percentageUsed = (spent_amount / budget_amount) * 100;

            // Create notification if budget threshold is exceeded
            if (percentageUsed >= 80) {
                await pool.query(
                    `INSERT INTO notifications 
                    (user_id, title, message, type, related_entity_type, related_entity_id)
                    VALUES ($1, $2, $3, $4, $5, $6)`,
                    [
                        userId,
                        'Budget Alert',
                        percentageUsed >= 100 
                            ? 'You have exceeded your budget for this category!'
                            : 'You are nearing your budget limit for this category!',
                        'budget_alert',
                        'category',
                        categoryId
                    ]
                );
            }

            return {
                hasLimit: true,
                isExceeded: percentageUsed >= 100,
                percentageUsed,
                remaining: budget_amount - spent_amount
            };
        }

        return {
            hasLimit: false,
            isExceeded: false,
            percentageUsed: 0,
            remaining: 0
        };
    } catch (error) {
        console.error('Error checking budget limits:', error);
        throw error;
    }
};
const transactionController = {
    createTransaction: async (req, res) => {
        try {
            const { 
                category_id, 
                amount, 
                description, 
                date, 
                type // 'income' or 'expense'
            } = req.body;
            const userId = req.userId;

            // Validate required fields
            if (!category_id || !amount || !date || !type) {
                return res.status(400).json({ 
                    message: 'All fields are required: category_id, amount, date, type'
                });
            }

            const result = await pool.query(
                `INSERT INTO transactions 
                (user_id, category_id, amount, description, date, type) 
                VALUES ($1, $2, $3, $4, $5, $6) 
                RETURNING *`,
                [userId, category_id, amount, description, date, type]
            );

            // Check budget limits after transaction
            if (type === 'expense') {
                await checkBudgetLimits(userId, category_id);
            }

            res.json(result.rows[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    getTransactions: async (req, res) => {
        try {
            const userId = req.userId;
            const { 
                startDate, 
                endDate, 
                category_id, 
                type,
                minAmount,
                maxAmount,
                sortBy = 'date',
                sortOrder = 'DESC',
                search
            } = req.query;

            let query = `
                SELECT t.*, c.name as category_name 
                FROM transactions t
                LEFT JOIN categories c ON t.category_id = c.id
                WHERE t.user_id = $1
            `;
            const params = [userId];
            let paramCounter = 1;

            // Add filters
            if (startDate) {
                paramCounter++;
                query += ` AND t.date >= $${paramCounter}`;
                params.push(startDate);
            }

            if (endDate) {
                paramCounter++;
                query += ` AND t.date <= $${paramCounter}`;
                params.push(endDate);
            }

            if (category_id) {
                paramCounter++;
                query += ` AND t.category_id = $${paramCounter}`;
                params.push(category_id);
            }

            if (type) {
                paramCounter++;
                query += ` AND t.type = $${paramCounter}`;
                params.push(type);
            }

            if (minAmount) {
                paramCounter++;
                query += ` AND t.amount >= $${paramCounter}`;
                params.push(minAmount);
            }

            if (maxAmount) {
                paramCounter++;
                query += ` AND t.amount <= $${paramCounter}`;
                params.push(maxAmount);
            }

            if (search) {
                paramCounter++;
                query += ` AND (t.description ILIKE $${paramCounter} OR c.name ILIKE $${paramCounter})`;
                params.push(`%${search}%`);
            }

            // Add sorting
            query += ` ORDER BY t.${sortBy} ${sortOrder}`;

            const result = await pool.query(query, params);
            res.json(result.rows);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    updateTransaction: async (req, res) => {
        try {
            const { id } = req.params;
            const {
                category_id,
                amount,
                description,
                date,
                type
            } = req.body;
            const userId = req.userId;

            // Validate required fields
            if (!category_id || !amount || !date || !type) {
                return res.status(400).json({
                    message: 'All fields are required: category_id, amount, date, type'
                });
            }

            // First check if transaction exists and belongs to user
            const checkResult = await pool.query(
                'SELECT * FROM transactions WHERE id = $1 AND user_id = $2',
                [id, userId]
            );

            if (checkResult.rows.length === 0) {
                return res.status(404).json({
                    message: 'Transaction not found or you do not have permission to modify it'
                });
            }

            const result = await pool.query(
                `UPDATE transactions 
                SET category_id = $1, 
                    amount = $2, 
                    description = $3, 
                    date = $4, 
                    type = $5
                WHERE id = $6 AND user_id = $7
                RETURNING *`,
                [category_id, amount, description, date, type, id, userId]
            );

            // Check budget limits after update if it's an expense
            if (type === 'expense') {
                await checkBudgetLimits(userId, category_id);
            }

            res.json(result.rows[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    deleteTransaction: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.userId;

            // First check if transaction exists and belongs to user
            const checkResult = await pool.query(
                'SELECT * FROM transactions WHERE id = $1 AND user_id = $2',
                [id, userId]
            );

            if (checkResult.rows.length === 0) {
                return res.status(404).json({
                    message: 'Transaction not found or you do not have permission to delete it'
                });
            }

            await pool.query(
                'DELETE FROM transactions WHERE id = $1 AND user_id = $2',
                [id, userId]
            );

            res.json({ message: 'Transaction deleted successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    }
};

module.exports = transactionController;