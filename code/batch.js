import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import csvParser from 'csv-parser';
import { createObjectCsvWriter } from 'csv-writer';
import { processTicket } from './triage.js';

const inputPath = path.join(process.cwd(), 'support_tickets', 'support_tickets.csv');
const outputPath = path.join(process.cwd(), 'support_tickets', 'output.csv');

async function processBatch() {
  if (!fs.existsSync(inputPath)) {
    console.error(`Error: Could not find ${inputPath}`);
    console.log('Please ensure the input CSV is present.');
    process.exit(1);
  }

  const results = [];
  console.log('Starting batch processing...');

  return new Promise((resolve, reject) => {
    fs.createReadStream(inputPath)
      .pipe(csvParser())
      .on('data', (row) => {
        results.push(row);
      })
      .on('end', async () => {
        console.log(`Loaded ${results.length} tickets. Processing with Agent...`);
        
        const outputData = [];
        for (let i = 0; i < results.length; i++) {
          const row = results[i];
          console.log(`Processing ticket ${i + 1}/${results.length}...`);
          
          // handle uppercase/lowercase keys dynamically based on parsed csv
          const issue = row.issue || row.Issue || "";
          const subject = row.subject || row.Subject || "";
          const company = row.company || row.Company || "";
          
          try {
            const result = await processTicket({
              issue: issue,
              subject: subject,
              company: company
            });
            outputData.push({
              issue: issue,
              subject: subject,
              company: company,
              response: result.response,
              product_area: result.product_area,
              status: result.status,
              request_type: result.request_type,
              justification: result.justification
            });
          } catch (e) {
            console.error(`Error processing ticket ${i + 1}:`, e.message);
            outputData.push({
              issue: issue,
              subject: subject,
              company: company,
              response: 'Failed to process ticket automatically.',
              product_area: 'Unknown',
              status: 'escalated',
              request_type: 'invalid',
              justification: 'Error during processing: ' + e.message
            });
          }
          
          // Delay to avoid hitting Gemini API rate limits (15 Requests Per Minute)
          if (i < results.length - 1) {
             await new Promise(resolve => setTimeout(resolve, 4000));
          }
        }

        const csvWriter = createObjectCsvWriter({
          path: outputPath,
          header: [
            { id: 'issue', title: 'issue' },
            { id: 'subject', title: 'subject' },
            { id: 'company', title: 'company' },
            { id: 'response', title: 'response' },
            { id: 'product_area', title: 'product_area' },
            { id: 'status', title: 'status' },
            { id: 'request_type', title: 'request_type' },
            { id: 'justification', title: 'justification' }
          ]
        });

        await csvWriter.writeRecords(outputData);
        console.log(`\n✅ Batch processing complete! Results saved to ${outputPath}`);
        resolve();
      })
      .on('error', reject);
  });
}

processBatch();
