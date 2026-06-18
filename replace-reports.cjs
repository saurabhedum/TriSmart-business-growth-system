const fs = require('fs');
const path = './src/views/ReportsView.tsx';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(/indigo-600/g, 'accent')
                 .replace(/indigo-500/g, 'accent')
                 .replace(/text-indigo/g, 'text-accent')
                 .replace(/bg-indigo/g, 'bg-accent')
                 .replace(/shadow-indigo/g, 'shadow-accent');
fs.writeFileSync(path, content, 'utf8');
console.log('Done');
