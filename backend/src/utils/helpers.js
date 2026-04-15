// ─────────────────────────────────────────────────────────
// Utility Helpers
// ─────────────────────────────────────────────────────────

/**
 * Round a number to 2 decimal places (for currency).
 */
function roundCurrency(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Distribute a total amount equally among `count` people,
 * handling rounding so the total matches exactly.
 * Returns an array of amounts.
 */
function distributeEqual(total, count) {
  if (count <= 0) return [];
  const base = roundCurrency(total / count);
  const amounts = new Array(count).fill(base);

  // Fix rounding error by adjusting the last person
  const diff = roundCurrency(total - base * count);
  amounts[amounts.length - 1] = roundCurrency(amounts[amounts.length - 1] + diff);
  return amounts;
}

/**
 * Validate that split amounts sum to total (within tolerance).
 */
function validateSplitSum(splits, total, tolerance = 0.02) {
  const sum = splits.reduce((s, v) => s + v, 0);
  return Math.abs(sum - total) <= tolerance;
}

/**
 * Validate percentages sum to 100 (within tolerance).
 */
function validatePercentageSum(percentages, tolerance = 0.5) {
  const sum = percentages.reduce((s, v) => s + v, 0);
  return Math.abs(sum - 100) <= tolerance;
}

/**
 * Simple natural-language expense parser.
 * Supports patterns like:
 *   "Alice paid 50 for dinner"
 *   "Bob spent 120.50 on groceries"
 *   "Charlie paid 30 for cab split with Dave and Eve"
 */
function parseNaturalLanguageExpense(text) {
  if (!text || typeof text !== 'string') return null;

  const patterns = [
    /^(?<payer>\w+)\s+(?:paid|spent)\s+(?<amount>[\d.]+)\s+(?:for|on)\s+(?<description>.+?)(?:\s+split\s+(?:with|between|among)\s+(?<others>.+))?$/i,
    /^(?<description>.+?)\s+(?<amount>[\d.]+)\s+(?:paid\s+by|by)\s+(?<payer>\w+)$/i,
  ];

  for (const pattern of patterns) {
    const match = text.trim().match(pattern);
    if (match) {
      const { payer, amount, description, others } = match.groups;
      const participants = others
        ? others.split(/\s*(?:,|and)\s*/i).map((s) => s.trim()).filter(Boolean)
        : [];
      return {
        payer: payer.trim(),
        amount: parseFloat(amount),
        description: description.trim(),
        participants, // additional participants besides payer
      };
    }
  }
  return null;
}

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6', '#a855f7', '#e11d48',
];

/**
 * Generate a random hex color for participants.
 * Optionally exclude a list of already-used colors.
 */
function randomColor(exclude = []) {
  const available = COLORS.filter((c) => !exclude.includes(c));
  const pool = available.length > 0 ? available : COLORS;
  return pool[Math.floor(Math.random() * pool.length)];
}

module.exports = {
  roundCurrency,
  distributeEqual,
  validateSplitSum,
  validatePercentageSum,
  parseNaturalLanguageExpense,
  randomColor,
};
