# SplitMint

SplitMint is a streamlined expense-sharing application designed to help groups track shared costs, manage balances, and settle debts efficiently.

## 🚀 Quick Start

### 🧪 Test Accounts
Use these credentials to explore the application:

| Email | Password |
|-------|----------|
| `koyna@gmail.com` | `123456` |
| `pihu@gmail.com` | `123456` |

---

## 🛠 Tech Stack

- **Frontend:** React (Vite), React Router, Vanilla CSS.
- **Backend:** Node.js, Express.js.
- **Database:** PostgreSQL with Prisma ORM.
- **Authentication:** JWT (JSON Web Tokens) with Bcrypt password hashing.

---

## 🧠 Approach & Decisions

### 1. Data Modeling: Users vs. Participants
One of the core decisions was separating the `User` (the registered account) from the `Participant` (the entity within a group).
- **Decision:** Groups consist of `Participants`. A participant can be "linked" to a `User` if they have an account, but it's not required.
- **Rationale:** This allows users to track expenses for friends who haven't signed up for the app yet, making it much more flexible for real-world scenarios.

### 2. Balance Engine & Settlement Optimization
The application includes a specialized balance engine to calculate who owes whom.
- **Decision:** Implemented a **Greedy Algorithm** to minimize the number of transactions required to settle up.
- **Approach:** It separates debtors and creditors, then matches the largest debtor with the largest creditor until all balances are resolved.
- **Decision:** Supported multiple split types: **Equal**, **Percentage**, and **Custom (Exact Amount)**.

### 3. Architecture
- **Decision:** Chose a monorepo-style structure for simplicity during development, with clear separation between the Express API and the React frontend.
- **Decision:** Used Prisma for type-safe database access, ensuring that schema changes are easily manageable and migrations are tracked.

---

## ⚖️ Trade-offs Considered

### Greedy Settlement vs. Global Debt Simplification

In this project, I used a greedy approach to settle debts within each group. A more advanced method could simplify debts across multiple groups (like Splitwise does), but that would make the database much more complex and could also raise privacy issues between groups. Since this is an MVP, I decided to keep it simple and focus on optimizing settlements at the group level.

### Manual vs. Automated Settlements

Settlements in this project are recorded manually instead of being connected to a payment gateway. Adding real payment integration would involve a lot of extra work, like handling transactions, security, and legal requirements. To keep the scope manageable, I focused on building a reliable system to track and record expenses rather than actually processing payments.

---

## 📁 Project Structure

- `/frontend`: React application (Vite-powered).
- `/backend`: Express server and Prisma schema.
- `/backend/prisma`: Database models and migrations.
