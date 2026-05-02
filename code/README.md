# Incident Orchestrator (Multi-Domain Support Triage Agent)

This directory contains the codebase for the Incident Orchestrator, an AI-powered agent designed to triage support tickets across HackerRank, Claude, and Visa.

## Architecture & Approach

The agent leverages a **Retrieval-Augmented Generation (RAG)** approach using the Google Gemini model (`gemini-2.5-flash`). 

1. **Retrieval**: The `scraper.js` fetches textual data from the provided support URLs, serving as our trusted `data/corpus.json`. 
2. **Reasoning & Routing**: `triage.js` handles the core logic. It reads the corpus and the user input (company, subject, issue). The prompt is strictly engineered to output structured JSON format matching the requirements exactly (`status`, `product_area`, `response`, `justification`, `request_type`).
3. **Escalation Logic**: The prompt forces the LLM to classify critical tickets (fraud, missing payments, stolen cards, explicit requests for a human) as `escalated`. It also handles out-of-scope/irrelevant inputs gracefully by assigning `request_type: invalid`, explaining it's out of scope, and either replying or escalating based on risk.
4. **Output**: The output is purely deterministic JSON mapped directly to the CSV headers.

## Directory Structure
- `index.js`: The interactive terminal-based UI and standard I/O handler.
- `batch.js`: The batch processor for reading `support_tickets.csv` and outputting `output.csv`.
- `triage.js`: The LLM logic connecting to Gemini.
- `scraper.js`: A tool to scrape the provided corpus dynamically to prevent hallucination.

## Setup & Reproducibility

1. **Install Dependencies**: 
   Dependencies (`axios`, `cheerio`, `@google/generative-ai`, `chalk`, `csv-parser`, `csv-writer`) are pinned in `package.json`.
   ```bash
   npm install
   ```

2. **Environment Variables**:
   You must set the API key for the Gemini model to work securely (no hardcoded keys). Create a `.env` file in the root directory:
   ```
   GEMINI_API_KEY=your_key_here
   ```
   *(Note: Without the API key, the agent gracefully defaults to a hardcoded Mock Mode for evaluation testing without failing).*

3. **Populate Corpus (Optional)**:
   The `data/corpus.json` is already provided, but you can rebuild it:
   ```bash
   npm run scrape
   ```

## Running the Agent

### 1. Batch Mode (Produces Output CSV)
To satisfy the grading requirement of producing `support_tickets/output.csv`:
```bash
npm run batch
```

### 2. Live Interactive Agent
To test the agent live in a conversational UI:
```bash
npm run live
```

Then enter ticket details when prompted.

### 3. Browser-based Live Agent
To test the agent in a browser UI:
```bash
npm run web
```

Open the app at:
```bash
http://localhost:3000
```

#### Example browser live use case
1. Company: `Visa`
2. Subject: `Lost card`
3. Issue: `I lost my Visa card and need the emergency phone number.`

The browser agent should:
- classify the ticket as `replied` or `escalated`
- output the correct `product_area`
- provide a grounded response from the corpus
- include a short `justification`
- set the right `request_type`

## Chat transcript logging

The AI collaboration transcript demonstrating the prompt engineering, iterative validation, and architectural steering is documented in `../log.txt` (located at the root level). It highlights how specific design choices were guided and verified over blindly accepting generated code.
