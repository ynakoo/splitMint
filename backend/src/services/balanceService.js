// ─────────────────────────────────────────────────────────
// Balance Engine – net balances & settlement optimization
// ─────────────────────────────────────────────────────────

const prisma = require('../utils/prisma');
const { roundCurrency } = require('../utils/helpers');

/**
 * Calculate net balances for all participants in a group.
 *
 * For each expense:
 *   - payer gets +amount (they paid)
 *   - each split participant gets -splitAmount (they owe)
 *
 * Net balance > 0 → person is owed money
 * Net balance < 0 → person owes money
 */
async function getBalances(groupId) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      participants: true,
      expenses: {
        include: { splits: true },
      },
    },
  });

  if (!group) {
    const err = new Error('Group not found');
    err.statusCode = 404;
    throw err;
  }

  // Initialize balances
  const balanceMap = {};
  for (const p of group.participants) {
    balanceMap[p.id] = { participant: p, balance: 0 };
  }

  // Process each expense
  for (const expense of group.expenses) {
    if (!expense.isConfirmed) continue;

    // Payer is credited the full amount
    if (balanceMap[expense.payerId]) {
      balanceMap[expense.payerId].balance += expense.amount;
    }

    // Each split participant is debited their share
    for (const split of expense.splits) {
      if (balanceMap[split.participantId]) {
        balanceMap[split.participantId].balance -= split.amount;
      }
    }
  }

  // Round all balances
  const balances = Object.values(balanceMap).map((entry) => ({
    participant: entry.participant,
    balance: roundCurrency(entry.balance),
  }));

  return balances;
}

/**
 * Optimize settlements – minimize the number of transactions.
 *
 * Uses a greedy algorithm:
 * 1. Separate participants into debtors (owe money) and creditors (are owed).
 * 2. Sort debtors by amount ascending, creditors by amount descending.
 * 3. Match the largest debtor with the largest creditor and settle.
 */
async function getSettlements(groupId) {
  const balances = await getBalances(groupId);

  const debtors = []; // negative balance → they owe
  const creditors = []; // positive balance → they are owed

  for (const { participant, balance } of balances) {
    if (balance < -0.01) {
      debtors.push({ participant, amount: Math.abs(balance) });
    } else if (balance > 0.01) {
      creditors.push({ participant, amount: balance });
    }
  }

  // Sort: largest amounts first
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const settlements = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const settleAmount = roundCurrency(Math.min(debtors[i].amount, creditors[j].amount));

    if (settleAmount > 0.01) {
      settlements.push({
        from: debtors[i].participant,
        to: creditors[j].participant,
        amount: settleAmount,
      });
    }

    debtors[i].amount = roundCurrency(debtors[i].amount - settleAmount);
    creditors[j].amount = roundCurrency(creditors[j].amount - settleAmount);

    if (debtors[i].amount < 0.01) i++;
    if (creditors[j].amount < 0.01) j++;
  }

  return { balances, settlements };
}

module.exports = { getBalances, getSettlements };
