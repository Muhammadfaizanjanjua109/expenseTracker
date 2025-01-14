const express = require('express');
const cors = require('cors');
const auth = require('./middleware/auth');
const initializeDb = require('./utils/dbInit');
require('dotenv').config();

const app = express();

// Initialize database tables before starting the server
initializeDb().then(() => {
    // Middleware
    app.use(cors());
    app.use(express.json());

    // Import all routes
    const authRoutes = require('./routes/auth');
    const categoryRoutes = require('./routes/category');
    const budgetRoutes = require('./routes/budget');
    const transactionRoutes = require('./routes/transaction');
    const reportRoutes = require('./routes/report');
    const exportRoutes = require('./routes/export');

    // Public routes
    app.use('/api/auth', authRoutes);

    // Protected routes
    app.use('/api/categories', auth, categoryRoutes);
    app.use('/api/budgets', auth, budgetRoutes);
    app.use('/api/transactions', auth, transactionRoutes);
    app.use('/api/reports', auth, reportRoutes);
    app.use('/api/export',auth, exportRoutes);
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});