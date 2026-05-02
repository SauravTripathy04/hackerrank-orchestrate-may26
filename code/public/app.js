const form = document.getElementById('ticket-form');
const resultCard = document.getElementById('result-card');
const statusEl = document.getElementById('status');
const productAreaEl = document.getElementById('product_area');
const requestTypeEl = document.getElementById('request_type');
const responseEl = document.getElementById('response');
const justificationEl = document.getElementById('justification');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const company = document.getElementById('company').value;
  const subject = document.getElementById('subject').value;
  const issue = document.getElementById('issue').value;

  form.querySelector('button').disabled = true;
  form.querySelector('button').textContent = 'Processing…';

  try {
    const response = await fetch('/api/triage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company, subject, issue })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Unable to get agent response');
    }

    statusEl.textContent = data.status || 'unknown';
    productAreaEl.textContent = data.product_area || 'None';
    requestTypeEl.textContent = data.request_type || 'unknown';
    responseEl.textContent = data.response || '';
    justificationEl.textContent = data.justification || '';
    resultCard.hidden = false;
  } catch (error) {
    statusEl.textContent = 'error';
    productAreaEl.textContent = '—';
    requestTypeEl.textContent = '—';
    responseEl.textContent = error.message;
    justificationEl.textContent = '';
    resultCard.hidden = false;
  } finally {
    form.querySelector('button').disabled = false;
    form.querySelector('button').textContent = 'Send to Live Agent';
  }
});
