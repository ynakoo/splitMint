// ─────────────────────────────────────────────────────────
// Group Service – CRUD with cascade delete
// ─────────────────────────────────────────────────────────

const prisma = require('../utils/prisma');
const { randomColor } = require('../utils/helpers');
const { getBalances } = require('./balanceService');

const MAX_PARTICIPANTS = 4;

async function createGroup({ name, participants, userId }) {
  // Fetch creator's information
  const creator = await prisma.user.findUnique({ where: { id: userId } });
  if (!creator) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  // Ensure total participants (creator + invited) doesn't exceed MAX_PARTICIPANTS
  const invitedParticipants = participants || [];
  if (invitedParticipants.length + 1 > MAX_PARTICIPANTS) {
    const err = new Error(`A group can have at most ${MAX_PARTICIPANTS} members inclusive of the creator`);
    err.statusCode = 400;
    throw err;
  }

  // Build participants list (Creator always first)
  const usedColors = [];
  const creatorColor = randomColor();
  usedColors.push(creatorColor);

  const allParticipantsData = [
    {
      name: creator.name,
      color: creatorColor,
      userId: creator.id,
    },
    ...invitedParticipants.map((p) => {
      const pColor = p.color || randomColor(usedColors);
      usedColors.push(pColor);
      return {
        name: p.name,
        color: pColor,
        avatar: p.avatar || null,
        userId: p.userId || null,
      };
    }),
  ];

  const group = await prisma.group.create({
    data: {
      name,
      createdById: userId,
      participants: {
        create: allParticipantsData,
      },
    },
    include: { participants: true },
  });

  return group;
}

async function getGroupsByUser(userId) {
  // Return groups where the user is the creator OR is a participant
  const groups = await prisma.group.findMany({
    where: {
      OR: [
        { createdById: userId },
        { participants: { some: { userId, isActive: true } } },
      ],
    },
    include: {
      participants: true,
      _count: { select: { expenses: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });
  return groups;
}

async function getGroupById(groupId, userId) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      participants: true,
      expenses: {
        include: { payer: true, splits: { include: { participant: true } } },
        orderBy: { date: 'desc' },
      },
    },
  });

  if (!group) {
    const err = new Error('Group not found');
    err.statusCode = 404;
    throw err;
  }

  return group;
}

async function updateGroup(groupId, userId, { name, participants }) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { participants: true },
  });

  if (!group) {
    const err = new Error('Group not found');
    err.statusCode = 404;
    throw err;
  }

  if (group.createdById !== userId) {
    const err = new Error('Only the group creator can edit this group');
    err.statusCode = 403;
    throw err;
  }

  // Update group name
  const updated = await prisma.group.update({
    where: { id: groupId },
    data: { name: name || group.name },
    include: { participants: true },
  });

  return updated;
}

async function deleteGroup(groupId, userId) {
  const group = await prisma.group.findUnique({ where: { id: groupId } });

  if (!group) {
    const err = new Error('Group not found');
    err.statusCode = 404;
    throw err;
  }

  if (group.createdById !== userId) {
    const err = new Error('Only the group creator can delete this group');
    err.statusCode = 403;
    throw err;
  }

  // Ensure all expenses are settled before deletion
  const balances = await getBalances(groupId);
  const unsettled = balances.some((b) => Math.abs(b.balance) > 0.01);

  if (unsettled) {
    const err = new Error('Cannot delete group with unsettled balances. Settle all debts first.');
    err.statusCode = 400;
    throw err;
  }

  // Cascade delete is handled by Prisma schema (onDelete: Cascade)
  await prisma.group.delete({ where: { id: groupId } });
  return { message: 'Group deleted successfully' };
}

module.exports = { createGroup, getGroupsByUser, getGroupById, updateGroup, deleteGroup, MAX_PARTICIPANTS };
