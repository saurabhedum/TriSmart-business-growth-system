const fs = require('fs');

let content = fs.readFileSync('src/views/ChatbotView.tsx', 'utf8');

content = content.replace(
  'AI Sales Copilot Personality',
  'AI Sales Assistant Tone'
);

content = content.replace(
  'Global persona for incoming queries and automated generative outreaches.',
  'How the AI assistant sounds when chatting with customers.'
);

fs.writeFileSync('src/views/ChatbotView.tsx', content, 'utf8');
console.log('Fixed');
