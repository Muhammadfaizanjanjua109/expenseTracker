const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/monthly', reportController.getMonthlySummary);
router.get('/yearly', reportController.getYearlySummary);
router.get('/category-expenses', reportController.getCategoryWiseExpenses);
router.get('/spending-trends', reportController.getSpendingTrends);
router.get('/budget-comparison', reportController.getBudgetComparison);

module.exports = router;