// ─────────────────────────────────────────────────────────
// Group Controller
// ─────────────────────────────────────────────────────────

const groupService = require('../services/groupService');

async function createGroup(req, res, next) {
  try {
    const { name, participants } = req.body;
    if (!name) return res.status(400).json({ error: 'Group name is required' });

    const group = await groupService.createGroup({
      name,
      participants: participants || [],
      userId: req.user.id,
    });
    res.status(201).json(group);
  } catch (err) {
    next(err);
  }
}

async function getGroups(req, res, next) {
  try {
    const groups = await groupService.getGroupsByUser(req.user.id);
    res.json(groups);
  } catch (err) {
    next(err);
  }
}

async function getGroup(req, res, next) {
  try {
    const group = await groupService.getGroupById(req.params.id, req.user.id);
    res.json(group);
  } catch (err) {
    next(err);
  }
}

async function updateGroup(req, res, next) {
  try {
    const { name, participants } = req.body;
    const group = await groupService.updateGroup(req.params.id, req.user.id, { name, participants });
    res.json(group);
  } catch (err) {
    next(err);
  }
}

async function deleteGroup(req, res, next) {
  try {
    const result = await groupService.deleteGroup(req.params.id, req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { createGroup, getGroups, getGroup, updateGroup, deleteGroup };
