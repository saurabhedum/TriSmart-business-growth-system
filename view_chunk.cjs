const fs = require('fs');
const lines = fs.readFileSync('server.ts', 'utf-8').split('\n');
console.log(lines.slice(1243, 1262).join('\n'));
