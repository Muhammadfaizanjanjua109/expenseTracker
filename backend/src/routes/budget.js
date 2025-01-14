const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budgetController');

router.post('/', budgetController.setBudget);
router.get('/', budgetController.getBudgets);
router.get('/progress', budgetController.getBudgetProgress);
router.put('/:id', budgetController.updateBudget);
router.delete('/:id', budgetController.deleteBudget);

module.exports = router;