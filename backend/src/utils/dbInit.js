// src/utils/dbInit.js
const fs = require('fs').promises;
const path = require('path');
const pool = require('../config/db');

const initializeDb = async () => {
    try {
        // Read all SQL files
        const usersSQL = await fs.readFile(
            path.join(__dirname, '../models/users/users.sql'),
            'utf8'
        );
        const userPreferencesSQL = await fs.readFile(
            path.join(__dirname, '../models/users/user_preferences.sql'),
            'utf8'
        );
        const categoriesSQL = await fs.readFile(
            path.join(__dirname, '../models/categories/categories.sql'),
            'utf8'
        );
        const budgetsSQL = await fs.readFile(
            path.join(__dirname, '../models/budgets/budgets.sql'),
            'utf8'
        );
        const transactionsSQL = await fs.readFile(
            path.join(__dirname, '../models/transactions/transactions.sql'),
            'utf8'
        );
        const notificationsSQL = await fs.readFile(
            path.join(__dirname, '../models/notifications/notifications.sql'),
            'utf8'
        );

        // Execute SQL in correct order (respecting foreign key dependencies)
        await pool.query(usersSQL);
        console.log('Users table created successfully');
        
        await pool.query(userPreferencesSQL);
        console.log('User preferences table created successfully');
        
        await pool.query(categoriesSQL);
        console.log('Categories table created successfully');
        
        await pool.query(budgetsSQL);
        console.log('Budgets table created successfully');
        
        await pool.query(transactionsSQL);
        console.log('Transactions table created successfully');
        
        await pool.query(notificationsSQL);
        console.log('Notifications table created successfully');

        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
};

// Execute if this file is run directly
if (require.main === module) {
    initializeDb()
        .then(() => process.exit(0))
        .catch(err => {
            console.error(err);
            process.exit(1);
        });
}

module.exports = initializeDb;