// ─────────────────────────────────────────────────────────
// Balance Controller
// ─────────────────────────────────────────────────────────

const balanceService = require('../services/balanceService');

async function getBalances(req, res, next) {
  try {
    const balances = await balanceService.getBalances(req.params.groupId);
    res.json(balances);
  } catch (err) {
    next(err);
  }
}

async function getSettlements(req, res, next) {
  try {
    const result = await balanceService.getSettlements(req.params.groupId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { getBalances, getSettlements };
