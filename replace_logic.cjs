const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

// Replace "We received your message..." default
code = code.replace(/"We received your message. Please let us know how we can assist you."/g, '"We received your message. Please let us know how we can assist you. Thanks, your message is saved."');

// Fix the logic:
// const settingsDoc = await db.collection("chatbot_settings").doc(ownerId).get();
// ->
// let settingsDoc = await db.collection("chatbot_settings").doc(ownerId).get();
// if (!settingsDoc.exists) settingsDoc = await db.collection("chatbotSettings").doc(ownerId).get();
code = code.replace(
  /const settingsDoc = await db\.collection\("chatbot_settings"\)\.doc\(ownerId\)\.get\(\);/g,
  `let settingsDoc = await db.collection("chatbot_settings").doc(ownerId).get();
                      if (!settingsDoc.exists) settingsDoc = await db.collection("chatbotSettings").doc(ownerId).get();`
);

// if (settings?.autoResponderActive) {
// ->
// if (settings?.autoResponderActive || settings?.isActive || settings?.autoResponderActive === undefined) {
code = code.replace(
  /if \(settings\?\.autoResponderActive\) {/g,
  'if (settings?.autoResponderActive || settings?.isActive || settings?.autoResponderActive === undefined) {'
);

// return c.isActive && c.triggerWord && textLower.includes(c.triggerWord.toLowerCase().trim());
// ->
// if (!c.isActive || !c.triggerWord) return false;
// return textLower.includes(c.triggerWord.toLowerCase().trim());
code = code.replace(
  /return c\.isActive && c\.triggerWord && textLower\.includes\(c\.triggerWord\.toLowerCase\(\)\.trim\(\)\);/g,
  `if (!c.isActive || !c.triggerWord) return false;\n                                return textLower.includes(c.triggerWord.toLowerCase().trim());`
);

// } else if (settings.welcomeMessage) {
//    replyText = settings.welcomeMessage;
// }
// ->
// } else if (settings.welcomeMessage) {
//    replyText = settings.welcomeMessage;
// } else {
//    replyText = "We received your message. Please let us know how we can assist you. Thanks, your message is saved.";
// }
// We have to be careful with this one.
code = code.replace(
  /} else if \(settings\.welcomeMessage\) {\n[ ]+replyText = settings\.welcomeMessage;\n[ ]+}/g,
  `} else if (settings.welcomeMessage) {
                                 replyText = settings.welcomeMessage;
                              } else {
                                 replyText = "We received your message. Please let us know how we can assist you. Thanks, your message is saved.";
                              }`
);


// Same for instance where the toggle is completely absent/outer if statement
// Actually earlier I changed the default fallback at the top so it should cover it.

fs.writeFileSync('server.ts', code);
