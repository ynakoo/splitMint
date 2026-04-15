# SplitMint Frontend

Splitwise-like expense splitter frontend built with React + Vite.

## Deployment on Vercel

To deploy this frontend to Vercel:

1.  **Project Settings**:
    *   **Build Command**: `npm run build`
    *   **Output Directory**: `dist`
    *   **Root Directory**: `frontend/` (if deploying from the root of the monorepo)

2.  **Environment Variables**:
    *   Add `VITE_API_BASE` and set it to your backend API URL (e.g., `https://your-backend.render.com/api`).

3.  **Routing**:
    *   The `vercel.json` file in the `frontend/` directory handles client-side routing automatically.

## Local Development

1.  Navigate to the `frontend/` directory.
2.  Install dependencies: `npm install`.
3.  Create a `.env` file with `VITE_API_BASE=http://localhost:3001/api`.
4.  Run the dev server: `npm run dev`.

