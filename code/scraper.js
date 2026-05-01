import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';

const urls = [
  { domain: 'HackerRank', url: 'https://support.hackerrank.com/' },
  { domain: 'Claude', url: 'https://support.claude.com/en/' },
  { domain: 'Visa', url: 'https://www.visa.co.in/support.html' }
];

async function scrapeUrl(source) {
  try {
    console.log(`Scraping ${source.domain} at ${source.url}...`);
    const response = await axios.get(source.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    const $ = cheerio.load(response.data);
    
    // Remove scripts, styles, etc.
    $('script, style, nav, footer, header').remove();
    
    // Get text content and clean it up
    let text = $('body').text();
    text = text.replace(/\s+/g, ' ').trim();
    
    return {
      domain: source.domain,
      url: source.url,
      content: text.substring(0, 15000) // Increase token limit slightly to capture more content
    };
  } catch (error) {
    console.error(`Error scraping ${source.domain}:`, error.message);
    return {
      domain: source.domain,
      url: source.url,
      content: "Failed to load content due to an error: " + error.message
    };
  }
}

async function runScraper() {
  const corpus = [];
  for (const source of urls) {
    const data = await scrapeUrl(source);
    corpus.push(data);
  }
  
  const dataDir = path.join(process.cwd(), 'data');
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(
    path.join(dataDir, 'corpus.json'), 
    JSON.stringify(corpus, null, 2)
  );
  console.log('Corpus saved to data/corpus.json');
}

runScraper();
