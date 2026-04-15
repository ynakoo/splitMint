// ─────────────────────────────────────────────────────────
// Participant Routes
// ─────────────────────────────────────────────────────────

const router = require('express').Router();
const { addParticipant, updateParticipant, removeParticipant, getParticipants } = require('../controllers/participantController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// GET    /api/participants/group/:groupId   – List participants in a group
router.get('/group/:groupId', getParticipants);

// POST   /api/participants/group/:groupId   – Add participant to group
router.post('/group/:groupId', addParticipant);

// PUT    /api/participants/:id              – Update participant
router.put('/:id', updateParticipant);

// DELETE /api/participants/:id              – Remove participant
router.delete('/:id', removeParticipant);

module.exports = router;
