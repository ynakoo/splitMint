// ─────────────────────────────────────────────────────────
// Participant Controller
// ─────────────────────────────────────────────────────────

const participantService = require('../services/participantService');

async function addParticipant(req, res, next) {
  try {
    const { name, color, avatar, userId, email, username } = req.body;
    if (!name && !email && !username) {
      return res.status(400).json({ error: 'Participant name, email, or username is required' });
    }

    const participant = await participantService.addParticipant(req.params.groupId, {
      name, color, avatar, userId, email, username,
    });
    res.status(201).json(participant);
  } catch (err) {
    next(err);
  }
}

async function updateParticipant(req, res, next) {
  try {
    const { name, color, avatar, email, username } = req.body;
    const participant = await participantService.updateParticipant(req.params.id, {
      name, color, avatar, email, username,
    });
    res.json(participant);
  } catch (err) {
    next(err);
  }
}

async function removeParticipant(req, res, next) {
  try {
    const result = await participantService.removeParticipant(req.params.id, req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getParticipants(req, res, next) {
  try {
    const participants = await participantService.getParticipantsByGroup(req.params.groupId);
    res.json(participants);
  } catch (err) {
    next(err);
  }
}

module.exports = { addParticipant, updateParticipant, removeParticipant, getParticipants };
