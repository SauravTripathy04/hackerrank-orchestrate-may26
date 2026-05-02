# hackerrank-orchestrate-may26
Multi-Domain Support Triage Challenge

This repository contains the Incident Orchestrator, an AI-powered support triage agent for HackerRank, Claude, and Visa.

## Live Agent Use Case

The live agent is now available in two modes:

- Terminal mode: `npm run live`
- Browser UI mode: `npm run web`

### Run the browser-based live agent

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file in the project root with:
   ```bash
   GEMINI_API_KEY=your_key_here
   ```
3. Launch the browser UI:
   ```bash
   npm run web
   ```
4. Open the app in your browser:
   ```bash
   http://localhost:3000
   ```

### Example live browser use case

- Company: `Visa`
- Subject: `Lost card`
- Issue: `I lost my Visa card and need the emergency phone number.`

The browser app will show:
- `status`: `replied` or `escalated`
- `product_area`: the selected domain tag
- `response`: the grounded answer from the support corpus
- `justification`: why this routing was chosen
- `request_type`: `product_issue`, `bug`, `feature_request`, or `invalid`

## Available commands

- `npm run live` — start the terminal-based live agent
- `npm run web` — start the browser-based live agent at `http://localhost:3000`
- `npm run batch` — process tickets in batch mode and print JSON output
- `npm run scrape` — refresh the support corpus from `code/scraper.js`
