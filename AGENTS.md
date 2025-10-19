# Repository Guidelines

## Project Structure & Module Organization
Clumsy Data Viewer splits into `backend/` (Node.js API) and `frontend/` (Vue 3 client). The API entrypoint is `backend/server.js` with query helpers under `backend/utils/`. Configuration defaults ship in `backend/config.js` and can be overridden via `backend/config.json` or env variables. Tests live in `backend/test/`, while shared scripts such as `check-columns.js` sit alongside. The frontend uses Vite; view logic flows from `frontend/src/main.js` into single-file components inside `frontend/src/components/`, with shared configuration in `frontend/src/config.js` and static assets in `frontend/public/`. `docker-compose.yml` coordinates both services plus MySQL.

## Build, Test, and Development Commands
Install dependencies once per service with `cd backend && npm install` and `cd frontend && npm install`. Run the API locally via `npm run dev` inside `backend/` (identical to `npm start`). Launch the Vue dev server with `npm run dev` inside `frontend/`; the app expects the API at `http://localhost:3001`. Produce a production bundle using `npm run build` in `frontend/`. Use `docker-compose up --build` to spin up the full stack with Docker.

## Coding Style & Naming Conventions
Use modern JavaScript with `const`/`let`, arrow functions for inline callbacks, and 2-space indentation (mirrors existing files). Keep backend modules CommonJS (`require/module.exports`). Frontend components stay PascalCase (e.g., `ItemFilters.vue`), while utilities and configs are camelCase (`src/utils/`). Prefer descriptive function names that reflect the dataset or filter being handled.

## Testing Guidelines
Backend tests rely on the Node test runner; add files as `backend/test/<feature>.test.js` and execute them with `npm test`. Mock external services and database calls where practical to keep the suite fast. No frontend harness exists yet; if adding one, prefer Vitest to align with Vite and colocate tests near components.

## Commit & Pull Request Guidelines
Commits follow short, imperative subjects (`Harden config loading`, `Move project files to root`). Prefixes like `feat:` are acceptable but optional—prioritize clarity. Open pull requests with a summary of behaviour changes, setup notes (migrations, env vars), and screenshots for UI updates. Link to related issues or tickets and confirm tests/Docker builds pass before requesting review.

## Configuration & Environment
The API reads settings from environment variables or `backend/config.json`; override the file path with `BACKEND_CONFIG_PATH`. Populate database credentials via `DB_HOST`, `DB_USER`, etc., and expose allowed origins through `CORS_ORIGINS`. Frontend runtime config comes from Vite env vars such as `VITE_API_URL`. Never commit production secrets or populated config files.
