const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

// The pattern to match for WhatsApp interaction logger
const waLoggerPattern = `                    try {
                      // Log interaction so it shows up in InteractionHub
                      await db.collection("interactions").doc(messageId).set({
                        id: messageId,
                        leadId: senderId,
                        leadName: senderId, // Fallback to phone number as name
                        platform: "WhatsApp",
                        type: "WhatsApp",
                        content: text,
                        message: text,
                        status: "Pending",
                        direction: "Inbound",
                        isPotentialBuyer,
                        timestamp: new Date().toISOString(),
                        createdAt: new Date().toISOString(),
                        ownerId
                      });
                    } catch (e) {
                      console.error("Failed to log interaction:", e);
                    }`;

const igLoggerPattern = `                     try {
                       await db.collection("interactions").doc(messageId).set({
                         id: messageId,
                         leadId: senderId,
                         leadName: senderId,
                         platform: "Instagram",
                         type: "Instagram",
                         content: text,
                         message: text,
                         status: "Pending",
                         direction: "Inbound",
                         isPotentialBuyer,
                         timestamp: new Date().toISOString(),
                         createdAt: new Date().toISOString(),
                         ownerId
                       });
                     } catch (e) {
                       console.error("Failed to log interaction:", e);
                     }`;

// Remove them from where they are currently
code = code.replace(waLoggerPattern, '');
code = code.replace(igLoggerPattern, '');

// Now we insert logic exactly after the chatbot computes \`replyText\` 
// to ONLY log to interactions if it is an unhandled case (not a command, not a greeting)

// We can look for the exact end of the catch block for chatbot settings fetching:
const waChatbotSettingsEnd = `                    } catch (e) {
                      console.error("Error fetching chatbot settings:", e);
                    }`;

// Insert WA logger right after the catch block completes:
code = code.replace(waChatbotSettingsEnd, waChatbotSettingsEnd + `
                    
                    // IF it wasn't a handled command/greeting, it fell back to default message or human handoff.
                    // We only want to put it in the inbox if it's unhandled or explicitly asking for a human!
                    const isDefaultOrHandoff = replyText.includes("assist you") || replyText.includes("assistance") || replyText.includes("agent") || replyText.includes("human");
                    if (isDefaultOrHandoff || true /* Actually, let's just use the strict match */) {
                       if (replyText.includes("assist you") || replyText.includes("human") || replyText.includes("agent") || replyText.includes("inquiry")) {
                          ` + waLoggerPattern + `
                       }
                    }`);

const igChatbotSettingsEnd = `                     } catch (e) {}`;
// Note: instagram has \`catch (e) {}\` around its settings, wait let me verify its catch block.
// I'll just use a safer string that I know exists in IG webhook.
code = code.replace(
  `                     } catch (e) {}\n\n                     let deliveryStatus = "failed";`,
  `                     } catch (e) {}\n\n` + 
  `                     if (replyText.includes("assist you") || replyText.includes("human") || replyText.includes("agent") || replyText.includes("inquiry")) {
` + igLoggerPattern + `
                     }\n\n                     let deliveryStatus = "failed";`
);

fs.writeFileSync('server.ts', code);
