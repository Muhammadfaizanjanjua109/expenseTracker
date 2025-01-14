// utils/notifications.js
const pool = require('../config/db');

const createNotification = async (userId, message, type) => {
  try {
    await pool.query(
      'INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, $3)',
      [userId, message, type]
    );
  } catch (err) {
    console.error('Notification error:', err);
  }
};

const checkBudgetLimit = async (userId, categoryId) => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
    
    const result = await pool.query(
      `SELECT 
        b.amount as budget,
        SUM(t.amount) as spent
      FROM budgets b
      LEFT JOIN transactions t ON t.category_id = b.category_id
        AND EXTRACT(MONTH FROM t.date) = EXTRACT(MONTH FROM b.month)
        AND EXTRACT(YEAR FROM t.date) = EXTRACT(YEAR FROM b.month)
      WHERE b.user_id = $1 
        AND b.category_id = $2
        AND b.month = $3
      GROUP BY b.amount`,
      [userId, categoryId, currentMonth]
    );

    if (result.rows.length > 0) {
      const { budget, spent } = result.rows[0];
      if (spent >= budget * 0.8) {
        await createNotification(
          userId,
          `You've used ${Math.round((spent/budget) * 100)}% of your budget in this category`,
          'budget_warning'
        );
      }
    }
  } catch (err) {
    console.error('Budget check error:', err);
  }
};