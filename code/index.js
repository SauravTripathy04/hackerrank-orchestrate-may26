import 'dotenv/config';
import readline from 'readline';
import chalk from 'chalk';
import { processTicket } from './triage.js';

async function processBatch(inputData) {
  try {
    let cases = [];
    if (typeof inputData === 'string') {
      try {
        cases = JSON.parse(inputData);
        if (!Array.isArray(cases)) {
           cases = [cases];
        }
      } catch(e) {
        // If not JSON, maybe treat as a single string issue
        cases = [{ issue: inputData, subject: "None", company: "None" }];
      }
    }

    const results = [];
    for (const ticket of cases) {
      const result = await processTicket({
        company: ticket.company || "None",
        subject: ticket.subject || "None",
        issue: ticket.issue || ""
      });
      results.push(result);
    }
    
    // Output pure JSON for grader
    console.log(JSON.stringify(results, null, 2));
  } catch (error) {
    console.error(JSON.stringify({ error: error.message }));
  }
}

if (!process.stdin.isTTY) {
  // Read from piped stdin (e.g., HackerRank grader)
  let inputChunks = [];
  process.stdin.on('data', chunk => inputChunks.push(chunk));
  process.stdin.on('end', async () => {
    const inputData = Buffer.concat(inputChunks).toString('utf-8').trim();
    if (inputData) {
      await processBatch(inputData);
    }
  });
} else {
  // Interactive mode
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.clear();
  console.log(chalk.bold.cyan('================================================='));
  console.log(chalk.bold.cyan('           INCIDENT ORCHESTRATOR                 '));
  console.log(chalk.bold.cyan('       Multi-Domain Support Triage Agent         '));
  console.log(chalk.bold.cyan('=================================================\n'));

  console.log(chalk.gray('Enter ticket details. Type "exit" at any prompt to quit.\n'));

  function promptTicket() {
    rl.question(chalk.green('Company (HackerRank/Claude/Visa/None): '), (company) => {
      if (company.toLowerCase() === 'exit' || company.toLowerCase() === 'quit') {
        console.log(chalk.yellow('Shutting down Incident Orchestrator...'));
        rl.close();
        return;
      }
      
      rl.question(chalk.green('Subject: '), (subject) => {
        if (subject.toLowerCase() === 'exit' || subject.toLowerCase() === 'quit') {
          console.log(chalk.yellow('Shutting down Incident Orchestrator...'));
          rl.close();
          return;
        }

        rl.question(chalk.green('Issue: '), async (issue) => {
          if (issue.toLowerCase() === 'exit' || issue.toLowerCase() === 'quit') {
            console.log(chalk.yellow('Shutting down Incident Orchestrator...'));
            rl.close();
            return;
          }

          if (!issue.trim()) {
            console.log(chalk.red('Issue body is required.'));
            promptTicket();
            return;
          }

          try {
            console.log(chalk.blue('\nAnalyzing issue and consulting knowledge base...'));
            const result = await processTicket({ company, subject, issue });

            console.log(chalk.bold.magenta('\n--- TRIAGE RESULTS ---'));
            
            const statusColor = result.status.toLowerCase() === 'escalated' ? chalk.red.bold : chalk.green.bold;
            console.log(`${chalk.bold('Status:')}       ${statusColor(result.status)}`);
            console.log(`${chalk.bold('Product Area:')} ${result.product_area}`);
            console.log(`${chalk.bold('Request Type:')} ${result.request_type}`);
            console.log(`${chalk.bold('Justification:')} ${chalk.italic(result.justification)}`);

            console.log(chalk.bold.cyan('\n--- AGENT RESPONSE ---'));
            console.log(chalk.white(result.response));
            console.log('\n-------------------------------------------------\n');
            
          } catch (error) {
            console.error(chalk.red('\nError processing ticket:'), error.message);
            console.log('\n-------------------------------------------------\n');
          }

          promptTicket();
        });
      });
    });
  }

  promptTicket();
}
