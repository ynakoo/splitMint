// ─────────────────────────────────────────────────────────
// SplitMint – Express Server Entry Point
// ─────────────────────────────────────────────────────────
console.log("THIS FILE IS RUNNING");
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const prisma = require('./utils/prisma');

const authRoutes = require('./routes/authRoutes');
const groupRoutes = require('./routes/groupRoutes');
const participantRoutes = require('./routes/participantRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const balanceRoutes = require('./routes/balanceRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Routes ───────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'SplitMint API', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/participants', participantRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/balances', balanceRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ── Error handling ───────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start ────────────────────────────────────────────────
// app.listen(PORT, () => {
//   console.log(`🌿 SplitMint API running on http://localhost:${PORT}`);
// });
async function main() {
    try {
        console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
        await prisma.$connect();
        console.log('Connected to Database');

        app.listen(PORT, () => {
            console.log(`🌿 SplitMint API running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Error starting server:', error);
        process.exit(1);
    }
}

main();

module.exports = app;
