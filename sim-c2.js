// sim-c2.js — simulated C2 server for demo purposes
const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json({ limit: '1mb' }));

const LOG_FILE = path.join(__dirname, 'sim_c2_log.jsonl');

// helper: append JSON line
function appendLog(obj) {
  const line = JSON.stringify(obj);
  fs.appendFileSync(LOG_FILE, line + '\n', 'utf8');
}

// Accept simulated exfil uploads (safe)
app.post('/c2/upload', (req, res) => {
  const entry = {
    received_at: new Date().toISOString(),
    source_ip: req.ip,
    payload: req.body
  };
  appendLog(entry);
  console.log('Simulated exfil received:', entry.payload.summary || '(no summary)');
  // return a fake "ACK" that real C2 might return
  res.json({ ok: true, message: 'simulated C2 received payload', stored: true });
});

// Dashboard: show last N logs
app.get('/dashboard', (req, res) => {
  let lines = [];
  try {
    lines = fs.readFileSync(LOG_FILE, 'utf8').trim().split('\n').filter(Boolean);
    lines = lines.slice(-30).map(l => JSON.parse(l)); // last 30
  } catch (e) {
    lines = [];
  }

  // very simple HTML dashboard
  const html = `
  <html>
    <head><title>Simulated C2 Dashboard</title>
      <style>body{font-family:system-ui;padding:16px} pre{background:#f6f6f8;padding:12px;border-radius:8px;overflow:auto}</style>
    </head>
    <body>
      <h1>Simulated C2 — Recent Payloads</h1>
      <p>This is a safe demo. Payloads are stored locally in <code>${LOG_FILE}</code>.</p>
      ${lines.length === 0 ? '<p><em>No payloads yet</em></p>' : lines.map(l => {
        return `<div style="margin-bottom:12px;border:1px solid #eee;padding:8px;border-radius:8px">
          <div><strong>Received:</strong> ${l.received_at} — <strong>source</strong> ${l.source_ip}</div>
          <pre>${escapeHtml(JSON.stringify(l.payload, null, 2))}</pre>
        </div>`;
      }).join('')}
    </body>
  </html>
  `;
  res.send(html);
});

function escapeHtml(s) {
  return s.replace(/[&<>]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
}

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Simulated C2 server listening on http://localhost:${PORT}`);
  console.log(`Dashboard: http://localhost:${PORT}/dashboard`);
});
