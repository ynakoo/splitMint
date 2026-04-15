// ─────────────────────────────────────────────────────────
// Balance Routes
// ─────────────────────────────────────────────────────────

const router = require('express').Router();
const { getBalances, getSettlements } = require('../controllers/balanceController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// GET /api/balances/:groupId              – Get net balances for a group
router.get('/:groupId', getBalances);

// GET /api/balances/:groupId/settlements  – Get optimized settlements
router.get('/:groupId/settlements', getSettlements);

module.exports = router;
