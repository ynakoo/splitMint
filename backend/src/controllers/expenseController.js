// ─────────────────────────────────────────────────────────
// Expense Controller
// ─────────────────────────────────────────────────────────

const expenseService = require('../services/expenseService');
const { parseNaturalLanguageExpense } = require('../utils/helpers');

async function createExpense(req, res, next) {
  try {
    const {
      amount, description, date, splitType, groupId, payerId,
      participantIds, customAmounts, percentages, isSettlement
    } = req.body;

    if (!amount || !description || !groupId || !payerId || !participantIds) {
      return res.status(400).json({
        error: 'amount, description, groupId, payerId, and participantIds are required',
      });
    }

    const expense = await expenseService.createExpense({
      amount: parseFloat(amount),
      description,
      date,
      splitType: splitType || 'EQUAL',
      groupId,
      payerId,
      participantIds,
      customAmounts: customAmounts?.map(Number),
      percentages: percentages?.map(Number),
      isSettlement: Boolean(isSettlement),
    }, req.user.id);

    res.status(201).json(expense);
  } catch (err) {
    next(err);
  }
}

async function getExpenses(req, res, next) {
  try {
    const { groupId } = req.params;
    const { search, participantId, startDate, endDate, minAmount, maxAmount } = req.query;

    const expenses = await expenseService.getExpensesByGroup(groupId, {
      search, participantId, startDate, endDate, minAmount, maxAmount,
    });
    res.json(expenses);
  } catch (err) {
    next(err);
  }
}

async function getExpense(req, res, next) {
  try {
    const expense = await expenseService.getExpenseById(req.params.id);
    res.json(expense);
  } catch (err) {
    next(err);
  }
}

async function updateExpense(req, res, next) {
  try {
    const {
      amount, description, date, splitType, payerId,
      participantIds, customAmounts, percentages,
    } = req.body;

    const expense = await expenseService.updateExpense(req.params.id, {
      amount: amount !== undefined ? parseFloat(amount) : undefined,
      description,
      date,
      splitType,
      payerId,
      participantIds,
      customAmounts: customAmounts?.map(Number),
      percentages: percentages?.map(Number),
    }, req.user.id);

    res.json(expense);
  } catch (err) {
    next(err);
  }
}

async function deleteExpense(req, res, next) {
  try {
    const result = await expenseService.deleteExpense(req.params.id, req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function confirmSettlement(req, res, next) {
  try {
    const confirmed = await expenseService.confirmSettlement(req.params.id, req.user.id);
    res.json(confirmed);
  } catch (err) {
    next(err);
  }
}

/**
 * Bonus: Parse natural language into an expense object.
 * POST /api/expenses/parse
 * Body: { text: "Alice paid 50 for dinner split with Bob and Charlie" }
 */
async function parseExpense(req, res, next) {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'text is required' });

    const parsed = parseNaturalLanguageExpense(text);
    if (!parsed) {
      return res.status(422).json({ error: 'Could not parse expense from text', text });
    }

    res.json(parsed);
  } catch (err) {
    next(err);
  }
}

module.exports = { createExpense, getExpenses, getExpense, updateExpense, deleteExpense, confirmSettlement, parseExpense };
