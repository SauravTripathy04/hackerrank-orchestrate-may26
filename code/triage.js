import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs/promises';
import path from 'path';

let corpus = [];

async function loadCorpus() {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'corpus.json');
    const data = await fs.readFile(dataPath, 'utf8');
    corpus = JSON.parse(data);
  } catch (error) {
    console.warn("Could not load corpus. Run 'npm run scrape' first.");
  }
}

export async function processTicket({ issue, subject, company }) {
  await loadCorpus();
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("\n[WARNING] GEMINI_API_KEY environment variable is missing. Running in MOCK mode for live demonstration.");
    return new Promise((resolve) => {
      setTimeout(() => {
        const text = (issue + " " + subject).toLowerCase();
        
        if (text.includes('down') || text.includes('error 500')) {
           resolve({
             status: 'escalated',
             product_area: '',
             response: 'Escalate to a human',
             justification: '[MOCK] System outage requires immediate escalation.',
             request_type: 'bug'
           });
        } else if (text.includes('iron man') || text.includes('pizza')) {
           resolve({
             status: 'replied',
             product_area: 'conversation_management',
             response: 'I am sorry, this is out of scope from my capabilities',
             justification: '[MOCK] Question is unrelated to supported domains.',
             request_type: 'invalid'
           });
        } else if (text.includes('thank you') || text.includes('thanks')) {
           resolve({
             status: 'replied',
             product_area: '',
             response: 'Happy to help',
             justification: '[MOCK] Acknowledged user appreciation.',
             request_type: 'invalid'
           });
        } else if (text.includes('stolen') || text.includes('lost')) {
           resolve({
             status: 'replied',
             product_area: 'travel_support',
             response: '[MOCK RESPONSE] Call Visa India at 000-800-100-1219 to report a lost card.',
             justification: '[MOCK] Provided standard FAQ contact numbers for lost cards.',
             request_type: 'product_issue'
           });
        } else {
           resolve({
             status: 'replied',
             product_area: company && company !== 'None' ? 'screen' : 'general_support',
             response: '[MOCK RESPONSE] Standard reply based on corpus. Please add GEMINI_API_KEY for real answers.',
             justification: '[MOCK] Standard product issue routing.',
             request_type: 'product_issue'
           });
        }
      }, 1500);
    });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0,
      topK: 1,
      topP: 1
    }
  });

  const corpusContext = corpus.map(c => `=== ${c.domain} (${c.url}) ===\n${c.content}`).join('\n\n');

  const prompt = `
You are the "Incident Orchestrator", a highly intelligent Multi-Domain Support Triage agent.
Your job is to analyze support tickets for three ecosystems: HackerRank, Claude, and Visa.

Here is the support corpus you MUST use to understand the issue and generate a response. DO NOT use outside knowledge.
<corpus>
${corpusContext}
</corpus>

Input Data:
- Company: ${company || "None"}
- Subject: ${subject || "None"}
- Issue: ${issue}

Based ONLY on the corpus provided above, perform the triage and generate a JSON response with the following exact keys and constraints:

1. "status": Must be exactly "replied" or "escalated".
   - REPLIED: Use for general FAQs, how-to questions, reporting lost/stolen Visa cards (provide the official phone numbers), impossible/out-of-scope requests, or generic greetings/thanks.
   - ESCALATED: Use only when the system is completely down/broken (e.g., "site is down & none of the pages are accessible") or requires human intervention that is not covered by a standard FAQ.
2. "product_area": The most relevant support category tag (e.g., "screen", "community", "privacy", "travel_support", "general_support", "conversation_management"). Leave empty if no area applies.
3. "response": A user-facing answer grounded ONLY in the support corpus. 
   - If reporting a lost/stolen card or cheque, provide the emergency contact numbers from the Visa corpus.
   - If out of scope (e.g., movies, random questions), reply exactly: "I am sorry, this is out of scope from my capabilities".
   - If thanking the agent, reply exactly: "Happy to help".
   - If escalating a bug/outage, reply exactly: "Escalate to a human".
4. "justification": A concise explanation of your routing decision & response.
5. "request_type": Must be exactly one of: "product_issue", "feature_request", "bug", "invalid".
   - "invalid": Out of scope questions, malicious requests, or generic greetings ("Thank you").
   - "bug": System outages ("site is down").
   - "feature_request": Asking for new features.
   - "product_issue": Standard questions, account deletion, how-to, reporting stolen cards.

Example 1:
Input: Issue: "site is down & none of the pages are accessible"
Output JSON: { "status": "escalated", "product_area": "", "response": "Escalate to a human", "justification": "System outage requires immediate escalation.", "request_type": "bug" }

Example 2:
Input: Issue: "Where can I report a lost or stolen Visa card from India?", Company: "Visa"
Output JSON: { "status": "replied", "product_area": "general_support", "response": "Call Visa India at 000-800-100-1219 to report a lost card...", "justification": "Provided standard FAQ contact numbers for lost cards.", "request_type": "product_issue" }

Example 3:
Input: Issue: "What is the name of the actor in Iron Man?"
Output JSON: { "status": "replied", "product_area": "conversation_management", "response": "I am sorry, this is out of scope from my capabilities", "justification": "Question is unrelated to supported domains.", "request_type": "invalid" }

Example 4:
Input: Issue: "Thank you for helping me"
Output JSON: { "status": "replied", "product_area": "", "response": "Happy to help", "justification": "Acknowledged user appreciation.", "request_type": "invalid" }

Example 5:
Input: Issue: "i signed up using google login on hackerrank community , so i do not have a separate hackerrank password. please delete my account"
Output JSON: { "status": "replied", "product_area": "community", "response": "To delete your HackerRank account created via Google login...", "justification": "Provided steps to delete account.", "request_type": "product_issue" }

Respond in pure JSON format (no markdown tags, just the JSON object):
{
  "status": "string (replied/escalated)",
  "product_area": "string",
  "response": "string",
  "justification": "string",
  "request_type": "string (product_issue/feature_request/bug/invalid)"
}
`;

  let retries = 3;
  while (retries > 0) {
    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text().trim();
      
      let cleanJson = responseText;
      if (cleanJson.startsWith('```json')) {
          cleanJson = cleanJson.replace(/^```json\n/, '').replace(/\n```$/, '');
      } else if (cleanJson.startsWith('```')) {
          cleanJson = cleanJson.replace(/^```\n/, '').replace(/\n```$/, '');
      }
      
      return JSON.parse(cleanJson);
    } catch (error) {
      retries--;
      if (retries === 0) {
        throw new Error("Failed to process ticket with LLM after retries: " + error.message);
      }
      console.warn(`\n[WARNING] LLM API Error. Retrying... (${retries} attempts left). Message: ${error.message}`);
      // Wait 5 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}
