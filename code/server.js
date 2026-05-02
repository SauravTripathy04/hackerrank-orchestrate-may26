import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { processTicket } from './triage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/triage', async (req, res) => {
  const { company, subject, issue } = req.body;
  if (!issue || !issue.trim()) {
    return res.status(400).json({ error: 'Issue is required' });
  }

  try {
    const result = await processTicket({ company, subject, issue });
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error?.message || 'Ticket processing failed' });
  }
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Live agent UI available at http://localhost:${port}`);
});
