// src/routes/export.js
const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');
const auth = require('../middleware/auth');

// All routes are protected with auth middleware
router.use(auth);

// Export transactions
router.get('/transactions', exportController.exportTransactions);

// Export monthly report
router.get('/monthly-report', exportController.exportMonthlyReport);

module.exports = router;