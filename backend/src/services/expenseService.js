// ─────────────────────────────────────────────────────────
// Expense Service – CRUD with split calculations
// ─────────────────────────────────────────────────────────

const prisma = require('../utils/prisma');
const {
  roundCurrency,
  distributeEqual,
  validateSplitSum,
  validatePercentageSum,
} = require('../utils/helpers');

/**
 * Build split records for an expense based on the split type.
 */
function buildSplits({ amount, splitType, participantIds, customAmounts, percentages }) {
  const splits = [];

  if (splitType === 'EQUAL') {
    const amounts = distributeEqual(amount, participantIds.length);
    participantIds.forEach((pid, i) => {
      splits.push({ participantId: pid, amount: amounts[i] });
    });
  } else if (splitType === 'CUSTOM') {
    if (!customAmounts || customAmounts.length !== participantIds.length) {
      const err = new Error('Custom amounts must be provided for each participant');
      err.statusCode = 400;
      throw err;
    }
    if (!validateSplitSum(customAmounts, amount)) {
      const err = new Error('Custom amounts must sum to the total expense amount');
      err.statusCode = 400;
      throw err;
    }
    participantIds.forEach((pid, i) => {
      splits.push({ participantId: pid, amount: roundCurrency(customAmounts[i]) });
    });
  } else if (splitType === 'PERCENTAGE') {
    if (!percentages || percentages.length !== participantIds.length) {
      const err = new Error('Percentages must be provided for each participant');
      err.statusCode = 400;
      throw err;
    }
    if (!validatePercentageSum(percentages)) {
      const err = new Error('Percentages must sum to 100');
      err.statusCode = 400;
      throw err;
    }

    let remaining = amount;
    participantIds.forEach((pid, i) => {
      const isLast = i === participantIds.length - 1;
      const splitAmount = isLast ? roundCurrency(remaining) : roundCurrency(amount * percentages[i] / 100);
      remaining -= splitAmount;
      splits.push({ participantId: pid, amount: splitAmount, percentage: percentages[i] });
    });
  } else {
    const err = new Error('Invalid split type. Use EQUAL, CUSTOM, or PERCENTAGE');
    err.statusCode = 400;
    throw err;
  }

  return splits;
}

async function createExpense({
  amount, description, date, splitType, groupId, payerId,
  participantIds, customAmounts, percentages,
  isSettlement = false, isConfirmed = true
}, requestingUserId) {
  // Validate group exists
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { participants: true },
  });
  if (!group) {
    const err = new Error('Group not found');
    err.statusCode = 404;
    throw err;
  }

  // Check Permissions: Creator can do anything, others only their own expenses
  const isLeader = group.createdById === requestingUserId;
  const requesterParticipant = group.participants.find((p) => p.userId === requestingUserId);

  if (!isLeader) {
    if (!requesterParticipant || requesterParticipant.id !== payerId) {
      const err = new Error('You can only create expenses where you are the payer');
      err.statusCode = 403;
      throw err;
    }
  }

  // Validate payer is in the group
  const payerInGroup = group.participants.find((p) => p.id === payerId);
  if (!payerInGroup) {
    const err = new Error('Payer must be a participant in the group');
    err.statusCode = 400;
    throw err;
  }

  // Validate all participantIds are in the group
  const groupParticipantIds = group.participants.map((p) => p.id);
  for (const pid of participantIds) {
    if (!groupParticipantIds.includes(pid)) {
      const err = new Error(`Participant ${pid} is not in this group`);
      err.statusCode = 400;
      throw err;
    }
  }

  const splits = buildSplits({ amount, splitType, participantIds, customAmounts, percentages });

  const expense = await prisma.expense.create({
    data: {
      amount,
      description,
      date: date ? new Date(date) : new Date(),
      splitType,
      isSettlement,
      isConfirmed: isSettlement ? false : isConfirmed, // Force settlements to start unconfirmed
      groupId,
      payerId,
      splits: {
        create: splits,
      },
    },
    include: {
      payer: true,
      splits: { include: { participant: true } },
    },
  });

  return expense;
}

async function getExpensesByGroup(groupId, { search, participantId, startDate, endDate, minAmount, maxAmount } = {}) {
  const where = { groupId };
  const AND = [];

  if (search) {
    AND.push({ description: { contains: search, mode: 'insensitive' } });
  }
  if (participantId) {
    AND.push({
      OR: [
        { payerId: participantId },
        { splits: { some: { participantId } } },
      ],
    });
  }
  if (startDate) AND.push({ date: { gte: new Date(startDate) } });
  if (endDate) AND.push({ date: { lte: new Date(endDate) } });
  if (minAmount) AND.push({ amount: { gte: parseFloat(minAmount) } });
  if (maxAmount) AND.push({ amount: { lte: parseFloat(maxAmount) } });

  if (AND.length > 0) where.AND = AND;

  return prisma.expense.findMany({
    where,
    include: {
      payer: true,
      splits: { include: { participant: true } },
    },
    orderBy: { date: 'desc' },
  });
}

async function getExpenseById(expenseId) {
  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: {
      payer: true,
      splits: { include: { participant: true } },
      group: true,
    },
  });

  if (!expense) {
    const err = new Error('Expense not found');
    err.statusCode = 404;
    throw err;
  }

  return expense;
}

async function updateExpense(expenseId, {
  amount, description, date, splitType, payerId,
  participantIds, customAmounts, percentages,
}, requestingUserId) {
  const existing = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: { group: { include: { participants: true } } },
  });

  if (!existing) {
    const err = new Error('Expense not found');
    err.statusCode = 404;
    throw err;
  }

  // Check Permissions
  const isLeader = existing.group.createdById === requestingUserId;
  const requesterParticipant = existing.group.participants.find((p) => p.userId === requestingUserId);

  if (!isLeader) {
    if (!requesterParticipant || requesterParticipant.id !== existing.payerId) {
      const err = new Error('You can only edit expenses you paid for');
      err.statusCode = 403;
      throw err;
    }
    // Also if they are changing the payer, they can only change it TO themselves (which is already true if they are limited)
    if (payerId && payerId !== requesterParticipant.id) {
       const err = new Error('You cannot assign an expense to someone else');
       err.statusCode = 403;
       throw err;
    }
  }

  const finalAmount = amount ?? existing.amount;
  const finalSplitType = splitType ?? existing.splitType;

  let splitsData;
  if (participantIds) {
    splitsData = buildSplits({
      amount: finalAmount,
      splitType: finalSplitType,
      participantIds,
      customAmounts,
      percentages,
    });
  }

  const expense = await prisma.$transaction(async (tx) => {
    // Delete old splits if we're replacing them
    if (splitsData) {
      await tx.expenseSplit.deleteMany({ where: { expenseId } });
    }

    return tx.expense.update({
      where: { id: expenseId },
      data: {
        ...(amount !== undefined && { amount }),
        ...(description !== undefined && { description }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(splitType !== undefined && { splitType }),
        ...(payerId !== undefined && { payerId }),
        ...(splitsData && {
          splits: { create: splitsData },
        }),
      },
      include: {
        payer: true,
        splits: { include: { participant: true } },
      },
    });
  });

  return expense;
}

async function deleteExpense(expenseId, requestingUserId) {
  const expense = await prisma.expense.findUnique({ 
    where: { id: expenseId },
    include: { group: true }
  });
  if (!expense) {
    const err = new Error('Expense not found');
    err.statusCode = 404;
    throw err;
  }

  // Check Permissions
  const isLeader = expense.group.createdById === requestingUserId;
  const requesterParticipant = await prisma.participant.findFirst({
    where: { groupId: expense.groupId, userId: requestingUserId }
  });

  if (!isLeader) {
    if (!requesterParticipant || requesterParticipant.id !== expense.payerId) {
      const err = new Error('You can only delete expenses you paid for');
      err.statusCode = 403;
      throw err;
    }
  }

  // Cascade delete handles splits
  await prisma.expense.delete({ where: { id: expenseId } });
  return { message: 'Expense deleted successfully' };
}

async function confirmSettlement(expenseId, requestingUserId) {
  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: {
      group: true,
      splits: true,
    },
  });

  if (!expense || !expense.isSettlement) {
    const err = new Error('Settlement not found');
    err.statusCode = 404;
    throw err;
  }

  if (expense.isConfirmed) {
    const err = new Error('Settlement is already confirmed');
    err.statusCode = 400;
    throw err;
  }

  const requesterParticipant = await prisma.participant.findFirst({
    where: { groupId: expense.groupId, userId: requestingUserId }
  });

  // Only the person receiving the money (in the split array) can confirm
  const isReceiver = requesterParticipant && expense.splits.some((s) => s.participantId === requesterParticipant.id);

  if (!isReceiver) {
    const err = new Error('Only the receiver can confirm this settlement');
    err.statusCode = 403;
    throw err;
  }

  const confirmed = await prisma.expense.update({
    where: { id: expenseId },
    data: { isConfirmed: true },
    include: {
      payer: true,
      splits: { include: { participant: true } },
    },
  });

  return confirmed;
}

async function rejectSettlement(expenseId, requestingUserId) {
  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: {
      group: true,
      splits: true,
    },
  });

  if (!expense || !expense.isSettlement) {
    const err = new Error('Settlement not found');
    err.statusCode = 404;
    throw err;
  }

  if (expense.isConfirmed) {
    const err = new Error('Settlement is already confirmed');
    err.statusCode = 400;
    throw err;
  }

  const requesterParticipant = await prisma.participant.findFirst({
    where: { groupId: expense.groupId, userId: requestingUserId }
  });

  const isReceiver = requesterParticipant && expense.splits.some((s) => s.participantId === requesterParticipant.id);

  if (!isReceiver) {
    const err = new Error('Only the receiver can reject this settlement');
    err.statusCode = 403;
    throw err;
  }

  const rejected = await prisma.expense.update({
    where: { id: expenseId },
    data: { isRejected: true },
    include: {
      payer: true,
      splits: { include: { participant: true } },
    },
  });

  return rejected;
}

module.exports = {
  createExpense,
  getExpensesByGroup,
  getExpenseById,
  updateExpense,
  deleteExpense,
  confirmSettlement,
  rejectSettlement,
};
