// ─────────────────────────────────────────────────────────
// Auth Routes
// ─────────────────────────────────────────────────────────

const router = require('express').Router();
const { signup, login, getProfile } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// POST /api/auth/signup
router.post('/signup', signup);

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/profile
router.get('/profile', authenticate, getProfile);

module.exports = router;
