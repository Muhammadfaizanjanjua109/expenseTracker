const pool = require('../config/db');

const reportController = {
    // Get monthly summary
    getMonthlySummary: async (req, res) => {
        try {
            const userId = req.userId;
            const { month, year } = req.query;

            if (!month || !year) {
                return res.status(400).json({ message: 'Month and year are required' });
            }

            const result = await pool.query(
                `WITH monthly_data AS (
                    SELECT 
                        c.name as category,
                        c.type as category_type,
                        SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) as total_expenses,
                        SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) as total_income,
                        b.amount as budget_amount
                    FROM categories c
                    LEFT JOIN transactions t ON t.category_id = c.id 
                        AND t.user_id = $1
                        AND EXTRACT(MONTH FROM t.date) = $2
                        AND EXTRACT(YEAR FROM t.date) = $3
                    LEFT JOIN budgets b ON b.category_id = c.id 
                        AND b.user_id = $1
                        AND EXTRACT(MONTH FROM b.month) = $2
                        AND EXTRACT(YEAR FROM b.month) = $3
                    WHERE c.user_id = $1
                    GROUP BY c.name, c.type, b.amount
                )
                SELECT 
                    *,
                    CASE 
                        WHEN budget_amount IS NOT NULL AND budget_amount > 0 
                        THEN ROUND((total_expenses / budget_amount * 100), 2)
                        ELSE 0
                    END as budget_utilized_percentage
                FROM monthly_data
                ORDER BY category_type, category`,
                [userId, month, year]
            );

            // Calculate totals
            const totals = {
                total_income: result.rows.reduce((sum, row) => sum + Number(row.total_income), 0),
                total_expenses: result.rows.reduce((sum, row) => sum + Number(row.total_expenses), 0)
            };
            totals.net_savings = totals.total_income - totals.total_expenses;
            totals.savings_percentage = totals.total_income > 0 
                ? ((totals.net_savings / totals.total_income) * 100).toFixed(2) 
                : 0;

            res.json({
                summary: result.rows,
                totals: totals
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Server error' });
        }
    },

    getYearlySummary: async (req, res) => {
        try {
            const userId = req.userId;
            const { year } = req.query;

            if (!year) {
                return res.status(400).json({ message: 'Year is required' });
            }

            const result = await pool.query(
                `SELECT 
                    EXTRACT(MONTH FROM t.date) as month,
                    c.type as category_type,
                    SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) as total_expenses,
                    SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) as total_income
                FROM transactions t
                JOIN categories c ON t.category_id = c.id
                WHERE t.user_id = $1 AND EXTRACT(YEAR FROM t.date) = $2
                GROUP BY EXTRACT(MONTH FROM t.date), c.type
                ORDER BY month`,
                [userId, year]
            );

            res.json(result.rows);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Server error' });
        }
    },

    getCategoryWiseExpenses: async (req, res) => {
        try {
            const userId = req.userId;
            const { startDate, endDate } = req.query;

            const query = `
                SELECT 
                    c.name as category,
                    SUM(t.amount) as total_amount,
                    COUNT(t.id) as transaction_count,
                    ROUND((SUM(t.amount) * 100.0 / SUM(SUM(t.amount)) OVER ()), 2) as percentage
                FROM transactions t
                JOIN categories c ON t.category_id = c.id
                WHERE t.user_id = $1 
                AND t.type = 'expense'
                ${startDate ? 'AND t.date >= $2' : ''}
                ${endDate ? 'AND t.date <= $3' : ''}
                GROUP BY c.name
                ORDER BY total_amount DESC`;

            const params = [userId];
            if (startDate) params.push(startDate);
            if (endDate) params.push(endDate);

            const result = await pool.query(query, params);
            res.json(result.rows);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Server error' });
        }
    },

    getSpendingTrends: async (req, res) => {
        try {
            const userId = req.userId;
            const { period = 'monthly' } = req.query; // 'monthly' or 'daily'

            const groupBy = period === 'daily' ? 'DATE(t.date)' : 'DATE_TRUNC(\'month\', t.date)';

            const query = `
                SELECT 
                    ${groupBy} as date,
                    SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) as expenses,
                    SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) as income
                FROM transactions t
                WHERE t.user_id = $1
                GROUP BY ${groupBy}
                ORDER BY date DESC
                LIMIT 12`;

            const result = await pool.query(query, [userId]);
            res.json(result.rows);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Server error' });
        }
    },

    getBudgetComparison: async (req, res) => {
        try {
            const userId = req.userId;
            const { month, year } = req.query;

            if (!month || !year) {
                return res.status(400).json({ message: 'Month and year are required' });
            }

            const result = await pool.query(
                `SELECT 
                    c.name as category,
                    b.amount as budget_amount,
                    COALESCE(SUM(t.amount), 0) as spent_amount,
                    CASE 
                        WHEN b.amount > 0 THEN 
                            ROUND((COALESCE(SUM(t.amount), 0) / b.amount * 100), 2)
                        ELSE 0
                    END as utilization_percentage
                FROM budgets b
                JOIN categories c ON b.category_id = c.id
                LEFT JOIN transactions t ON t.category_id = b.category_id 
                    AND t.type = 'expense'
                    AND EXTRACT(MONTH FROM t.date) = $2
                    AND EXTRACT(YEAR FROM t.date) = $3
                WHERE b.user_id = $1
                    AND EXTRACT(MONTH FROM b.month) = $2
                    AND EXTRACT(YEAR FROM b.month) = $3
                GROUP BY c.name, b.amount
                ORDER BY utilization_percentage DESC`,
                [userId, month, year]
            );

            res.json(result.rows);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Server error' });
        }
    }
};

module.exports = reportController;