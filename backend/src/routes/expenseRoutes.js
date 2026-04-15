// ─────────────────────────────────────────────────────────
// Expense Routes
// ─────────────────────────────────────────────────────────

const router = require('express').Router();
const {
  createExpense, getExpenses, getExpense,
  updateExpense, deleteExpense, confirmSettlement, rejectSettlement, parseExpense,
} = require('../controllers/expenseController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// POST   /api/expenses/parse              – Parse natural language expense
router.post('/parse', parseExpense);

// POST   /api/expenses                    – Create expense
router.post('/', createExpense);

// GET    /api/expenses/group/:groupId     – List expenses for a group (with filters)
router.get('/group/:groupId', getExpenses);

// GET    /api/expenses/:id                – Get single expense
router.get('/:id', getExpense);

// PUT    /api/expenses/:id                – Update expense
router.put('/:id', updateExpense);

// PUT    /api/expenses/:id/confirm        – Confirm a pending settlement
router.put('/:id/confirm', confirmSettlement);

// PUT    /api/expenses/:id/reject         – Reject a pending settlement
router.put('/:id/reject', rejectSettlement);

// DELETE /api/expenses/:id                – Delete expense
router.delete('/:id', deleteExpense);

module.exports = router;
