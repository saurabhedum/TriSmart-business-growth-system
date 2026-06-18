const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

code = code.replace(
  /"We received your message on Instagram. Please let us know how we can assist you."/g,
  '"We received your message on Instagram. Please let us know how we can assist you. Thanks, your message is saved."'
);

fs.writeFileSync('server.ts', code);
