// ─────────────────────────────────────────────────────────
// Dashboard Routes
// ─────────────────────────────────────────────────────────

const router = require('express').Router();
const { getDashboard } = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// GET /api/dashboard – Get user dashboard summary
router.get('/', getDashboard);

module.exports = router;
