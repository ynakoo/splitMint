// ─────────────────────────────────────────────────────────
// Dashboard Service – aggregated stats & summaries
// ─────────────────────────────────────────────────────────

const prisma = require('../utils/prisma');
const { roundCurrency } = require('../utils/helpers');
const { getBalances } = require('./balanceService');

/**
 * Get dashboard summary for a user across all their groups.
 */
async function getDashboard(userId) {
  // Get all groups the user is part of
  const groups = await prisma.group.findMany({
    where: {
      OR: [
        { createdById: userId },
        { participants: { some: { userId, isActive: true } } },
      ],
    },
    include: {
      participants: true,
      expenses: {
        include: { splits: true, payer: true },
        orderBy: { date: 'desc' },
      },
    },
  });

  let totalSpent = 0;
  let youOwe = 0;
  let youAreOwed = 0;
  const recentTransactions = [];
  const groupSummaries = [];

  for (const group of groups) {
    // 0. Find the user's participant in this group and check activity
    const userParticipantEntry = group.participants.find((p) => p.userId === userId);
    
    // If user is not the creator AND is not active, skip this group's contribution to stats
    // (Creators are always considered active for dashboard purposes unless they delete)
    if (group.createdById !== userId && (!userParticipantEntry || !userParticipantEntry.isActive)) {
      continue;
    }

    // 1. Get accurate net balance for the user in this group
    const balances = await getBalances(group.id);
    const userBalanceEntry = balances.find((b) => b.participant.userId === userId);
    const groupNetBalance = userBalanceEntry ? userBalanceEntry.balance : 0;

    if (groupNetBalance < 0) {
      youOwe += Math.abs(groupNetBalance);
    } else if (groupNetBalance > 0) {
      youAreOwed += groupNetBalance;
    }

    // 2. Process expenses for general group stats and recent history
    let groupTotal = 0;
    let groupYouPaid = 0;

    for (const expense of group.expenses) {
      groupTotal += expense.amount;

      // Track if user was the payer for contribution stat
      if (expense.payer.userId === userId) {
        groupYouPaid += expense.amount;
      }

      // Collect recent transactions
      recentTransactions.push({
        id: expense.id,
        description: expense.description,
        amount: expense.amount,
        date: expense.date,
        groupName: group.name,
        groupId: group.id,
        payerName: expense.payer.name,
      });
    }

    totalSpent += groupTotal;

    groupSummaries.push({
      groupId: group.id,
      groupName: group.name,
      totalExpenses: roundCurrency(groupTotal),
      yourContribution: roundCurrency(groupYouPaid),
      participantCount: group.participants.length,
      expenseCount: group.expenses.length,
    });
  }

  // Sort recent transactions by date desc and limit to 20
  recentTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

  return {
    totalSpent: roundCurrency(totalSpent),
    youOwe: roundCurrency(youOwe),
    youAreOwed: roundCurrency(youAreOwed),
    netBalance: roundCurrency(youAreOwed - youOwe),
    recentTransactions: recentTransactions.slice(0, 20),
    groupSummaries,
  };
}

module.exports = { getDashboard };
