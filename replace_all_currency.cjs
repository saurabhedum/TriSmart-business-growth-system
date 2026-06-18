const fs = require('fs');
const path = require('path');

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walkDir(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walkDir('src');
let changedAny = false;
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  // replace >$ or > $
  content = content.replace(/>\$/g, '>₹').replace(/> \$/g, '> ₹');
  
  // replace `$${ and `\$$ and `$$
  content = content.replace(/`\$\$\{/g, '`₹${');
  
  // replace $ followed by numbers
  content = content.replace(/\$([0-9]+)/g, '₹$1');
  
  if (original !== content) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
    changedAny = true;
  }
});
if (!changedAny) console.log('No more dollar signs found');
