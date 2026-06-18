const fs = require('fs');
const path = require('path');

function getFiles(dir, filesList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getFiles(fullPath, filesList);
    } else {
      if (fullPath.endsWith('.tsx')) {
        filesList.push(fullPath);
      }
    }
  }
  return filesList;
}

const viewFiles = getFiles('src/views').concat(getFiles('src/components')).concat(['src/App.tsx']);

for (const file of [...new Set(viewFiles)]) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  
  content = content.replace(/value=\{newLead\.name\}/g, 'value={newLead.name || ""}');
  content = content.replace(/value=\{newLead\.mobileNumber\}/g, 'value={newLead.mobileNumber || ""}');
  content = content.replace(/value=\{newLead\.source\}/g, 'value={newLead.source || "Manual"}');
  content = content.replace(/value=\{newLead\.interestLevel\}/g, 'value={newLead.interestLevel || "Medium"}');
  content = content.replace(/value=\{newLead\.status\}/g, 'value={newLead.status || "New"}');
  content = content.replace(/value=\{newCampaign\.title\}/g, 'value={newCampaign.title || ""}');
  content = content.replace(/value=\{newCampaign\.channel\}/g, 'value={newCampaign.channel || "WhatsApp"}');
  content = content.replace(/value=\{newCampaign\.messageTemplate\}/g, 'value={newCampaign.messageTemplate || ""}');
  content = content.replace(/value=\{newTicket\.customerId\}/g, 'value={newTicket.customerId || ""}');
  content = content.replace(/value=\{newTicket\.subject\}/g, 'value={newTicket.subject || ""}');
  content = content.replace(/value=\{newTicket\.description\}/g, 'value={newTicket.description || ""}');
  content = content.replace(/value=\{newTicket\.status\}/g, 'value={newTicket.status || "Open"}');
  content = content.replace(/value=\{newQuotation\.customerId\}/g, 'value={newQuotation.customerId || ""}');
  content = content.replace(/value=\{newInvoice\.customerId\}/g, 'value={newInvoice.customerId || ""}');
  
  content = content.replace(/value=\{tpl\.name\}/g, 'value={tpl.name || ""}');
  content = content.replace(/value=\{tpl\.category\}/g, 'value={tpl.category || ""}');
  content = content.replace(/value=\{tpl\.language\}/g, 'value={tpl.language || ""}');
  content = content.replace(/value=\{testPhoneNumber\}/g, 'value={testPhoneNumber || ""}');
  
  content = content.replace(/value=\{cmd\.buttonLabel\}/g, 'value={cmd.buttonLabel || ""}');
  content = content.replace(/value=\{cmd\.triggerWord\}/g, 'value={cmd.triggerWord || ""}');
  content = content.replace(/value=\{cmd\.response\}/g, 'value={cmd.response || ""}');
  
  content = content.replace(/value=\{title\}/g, 'value={title || ""}');
  content = content.replace(/value=\{triggerWord\}/g, 'value={triggerWord || ""}');
  content = content.replace(/value=\{f\.label\}/g, 'value={f.label || ""}');
  content = content.replace(/value=\{f\.type\}/g, 'value={f.type || ""}');
  content = content.replace(/value=\{confirmModal\.link\}/g, 'value={confirmModal?.link || ""}');

  content = content.replace(/value=\{newItem\.specifications\}/g, 'value={newItem.specifications || ""}');

  fs.writeFileSync(file, content);
}
console.log('Patched default inputs');
