const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const webhook1Start = 'app.post(["/api/whatsapp-webhook/:ownerId", "/api/instagram-webhook/:ownerId"], async (req, res, next) => {';

// First, let's locate the first instance and the second instance hook.
const startIdx = code.indexOf(webhook1Start);
if (startIdx === -1) {
  console.log('Could not find webhook 1');
  process.exit(1);
}

// Find the end of webhook 1
const endMarker = '  // Webhook for Web Portal Uploads (bypass storage rules)';
const endIdx = code.indexOf(endMarker, startIdx);

if (endIdx === -1) {
  console.log('Could not find end of webhook 1');
  process.exit(1);
}

// Delete Webhook 1
code = code.slice(0, startIdx) + '\n\n' + code.slice(endIdx);
fs.writeFileSync('server.ts', code);
console.log('Webhook 1 deleted successfully');
