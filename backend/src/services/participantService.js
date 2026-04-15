// ─────────────────────────────────────────────────────────
// Participant Service – add, edit, remove participants
// ─────────────────────────────────────────────────────────

const prisma = require('../utils/prisma');
const { randomColor } = require('../utils/helpers');
const { MAX_PARTICIPANTS } = require('./groupService');
const { getBalances } = require('./balanceService');

async function addParticipant(groupId, { name, color, avatar, userId, email, username }) {
  // Check group exists and participant count
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { 
      participants: { select: { color: true } },
      _count: { select: { participants: true } } 
    },
  });

  if (!group) {
    const err = new Error('Group not found');
    err.statusCode = 404;
    throw err;
  }

  if (group._count.participants >= MAX_PARTICIPANTS) {
    const err = new Error(`A group can have at most ${MAX_PARTICIPANTS} members inclusive of the creator`);
    err.statusCode = 400;
    throw err;
  }

  // If email or username is provided, try to find the user first
  let linkedUserId = userId;
  let participantName = name;

  const identifier = email || username;

  if (identifier) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
    });
    if (user) {
      linkedUserId = user.id;
      // Optionally use user's name if no name provided
      if (!participantName) participantName = user.name;
    }
  }

  if (!participantName) {
    const err = new Error('Participant name or identifying username/email is required');
    err.statusCode = 400;
    throw err;
  }

  // Check if an inactive participant with same name or userId exists
  const existingInactive = await prisma.participant.findFirst({
    where: {
      groupId,
      isActive: false,
      OR: [
        { name: participantName },
        ...(linkedUserId ? [{ userId: linkedUserId }] : []),
      ],
    },
  });

  if (existingInactive) {
    return prisma.participant.update({
      where: { id: existingInactive.id },
      data: { 
        isActive: true,
        name: participantName, // Update name in case it changed
        userId: linkedUserId || existingInactive.userId,
      },
    });
  }

  const usedColors = group.participants.map((p) => p.color);

  const participant = await prisma.participant.create({
    data: {
      name: participantName,
      color: color || randomColor(usedColors),
      avatar: avatar || null,
      isActive: true,
      groupId,
      userId: linkedUserId || null,
    },
  });

  return participant;
}

async function updateParticipant(participantId, { name, color, avatar, email, username }) {
  const participant = await prisma.participant.findUnique({ where: { id: participantId } });

  if (!participant) {
    const err = new Error('Participant not found');
    err.statusCode = 404;
    throw err;
  }

  let linkedUserId = undefined;
  const identifier = email || username;

  if (identifier) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
    });
    if (user) {
      linkedUserId = user.id;
    } else {
      const err = new Error('User not found with provided identifier');
      err.statusCode = 404;
      throw err;
    }
  }

  const updated = await prisma.participant.update({
    where: { id: participantId },
    data: {
      ...(name !== undefined && { name }),
      ...(color !== undefined && { color }),
      ...(avatar !== undefined && { avatar }),
      ...(linkedUserId !== undefined && { userId: linkedUserId }),
    },
  });

  return updated;
}

async function removeParticipant(participantId, requestingUserId) {
  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    include: {
      group: true,
      paidExpenses: true,
      expenseSplits: true,
    },
  });

  if (!participant) {
    const err = new Error('Participant not found');
    err.statusCode = 404;
    throw err;
  }

  const isCreator = participant.group.createdById === requestingUserId;
  const isSelf = participant.userId === requestingUserId;

  // Rule 2: Only group leader can remove others
  if (!isCreator && !isSelf) {
    const err = new Error('Only the group creator can remove other participants');
    err.statusCode = 403;
    throw err;
  }

  // Rule 1: A participant can only leave if they don't owe/are owed anything
  const balances = await getBalances(participant.groupId);
  const pBalance = balances.find((b) => b.participant.id === participantId)?.balance || 0;

  if (Math.abs(pBalance) > 0.01) {
    const err = new Error(
      `Cannot remove participant with a non-zero balance ($${pBalance.toFixed(2)}). Settle all debts first.`
    );
    err.statusCode = 400;
    throw err;
  }

  // Double check manual expense check (original logic)
  if (participant.paidExpenses.length > 0) {
    const err = new Error(
      'Cannot remove participant who has records as a payer. Delete or edit those expenses first.'
    );
    err.statusCode = 400;
    throw err;
  }

  // Rule 2: Soft Leave - just set isActive to false
  await prisma.participant.update({
    where: { id: participantId },
    data: { isActive: false },
  });

  return { message: 'Participant left successfully' };
}

async function getParticipantsByGroup(groupId) {
  return prisma.participant.findMany({
    where: { groupId },
    orderBy: { name: 'asc' },
  });
}

module.exports = { addParticipant, updateParticipant, removeParticipant, getParticipantsByGroup };
