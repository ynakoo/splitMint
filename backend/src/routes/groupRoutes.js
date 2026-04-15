// ─────────────────────────────────────────────────────────
// Group Routes
// ─────────────────────────────────────────────────────────

const router = require('express').Router();
const { createGroup, getGroups, getGroup, updateGroup, deleteGroup } = require('../controllers/groupController');
const { authenticate } = require('../middleware/auth');

// All group routes require authentication
router.use(authenticate);

// POST   /api/groups         – Create a new group
router.post('/', createGroup);

// GET    /api/groups         – List user's groups
router.get('/', getGroups);

// GET    /api/groups/:id     – Get group details
router.get('/:id', getGroup);

// PUT    /api/groups/:id     – Update group
router.put('/:id', updateGroup);

// DELETE /api/groups/:id     – Delete group
router.delete('/:id', deleteGroup);

module.exports = router;
