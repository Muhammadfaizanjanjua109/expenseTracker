const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const categoryController = require('../controllers/category');
const transactionController = require('../controllers/transaction');
const budgetController = require('../controllers/budget');
const reportController = require('../controllers/report');

// Category routes
router.post('/categories', auth, categoryController.createCategory);
router.get('/categories', auth, categoryController.getCategories);

// Transaction routes
router.post('/transactions', auth, transactionController.addTransaction);
router.get('/transactions', auth, transactionController.getTransactions);

// Budget routes
router.post('/budgets', auth, budgetController.setBudget);

// Report routes
router.get('/reports/monthly', auth, reportController.getMonthlySummary);

module.exports = router;