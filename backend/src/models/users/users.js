const connectToDatabase = require('../../config/db');

const initializeUserModel = async () => {
    try {
        const pool = await connectToDatabase();
        
        // Create users table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        console.log('Users table created successfully');
        
        return pool;
    } catch (error) {
        console.error('Error creating users table:', error);
        throw error;
    }
};

module.exports = initializeUserModel;