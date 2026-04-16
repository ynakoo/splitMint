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

### Real-time Updates vs. Simplicity
- **Trade-off:** Decided against WebSockets for real-time notifications in favor of a robust RESTful API.
- **Why:** For an expense-tracking app, data integrity and accurate calculation are more critical than sub-second real-time visibility. This reduced complexity while maintaining a high-quality user experience via standard state management.

### Greedy Settlement vs. Global Debt Simplification
- **Trade-off:** The settlement optimizer uses a greedy approach at the group level.
- **Why:** While global simplification across multiple groups is possible (like Splitwise's "Debt Simplification" feature), it significantly increases database complexity and privacy concerns between groups. Group-level optimization provides the best balance of simplicity and utility for the MVP.

### Manual vs. Automated Settlements
- **Trade-off:** Settlements are manually recorded rather than integrated with a payment gateway.
- **Why:** This avoids the legal and technical overhead of handling actual financial transactions, focusing purely on being a reliable "ledger."

---

## 📁 Project Structure

- `/frontend`: React application (Vite-powered).
- `/backend`: Express server and Prisma schema.
- `/backend/prisma`: Database models and migrations.
