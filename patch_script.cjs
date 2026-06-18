const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

code = code.replace(
  /if \(\!settings\.metaWhatsAppApiKey\)\s+settings\.metaWhatsAppApiKey = dbSettings\.metaWhatsAppApiKey;/g,
  `if (!settings.metaWhatsAppApiKey)
                settings.metaWhatsAppApiKey = dbSettings.metaWhatsAppApiKey || dbSettings.whatsappApiToken;`
);

code = code.replace(
  /if \(!settings\.metaWhatsAppPhoneNumberId\)\s+settings\.metaWhatsAppPhoneNumberId =\s+dbSettings\.metaWhatsAppPhoneNumberId;/g,
  `if (!settings.metaWhatsAppPhoneNumberId)
                settings.metaWhatsAppPhoneNumberId = dbSettings.metaWhatsAppPhoneNumberId || dbSettings.whatsappPhoneId;`
);

fs.writeFileSync('server.ts', code);
