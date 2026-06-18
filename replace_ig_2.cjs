const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

code = code.replace(
  /c\.isActive && c\.triggerWord && textLower\.includes\(c\.triggerWord\.toLowerCase\(\)\.trim\(\)\)/g,
  '(c.isActive && c.triggerWord && textLower.includes(c.triggerWord.toLowerCase().trim()))'
);

fs.writeFileSync('server.ts', code);
