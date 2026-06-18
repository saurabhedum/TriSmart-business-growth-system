const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const target = `                  // NEW: If NOT handled by any AI, Custom Command, Complaint logic -> DO NOT DO ANYTHING to prevent spam!
                  // That means no "we received your message" spam from chatbot.
                }
              }
            } catch (innerErr) {`;

const replacement = `                  // NEW: If NOT handled by any AI, Custom Command, Complaint logic -> DO NOT DO ANYTHING to prevent spam!
                  // That means no "we received your message" spam from chatbot.
                  
                  // Mark interaction as Bot Handled if handled!
                  if (handled && msgId && dbInstance) {
                    try {
                       await dbInstance.collection("interactions").doc(msgId).update({ status: "Resolved" });
                    } catch (e) {}
                  }
                }
              }
            } catch (innerErr) {`;

code = code.replace(target, replacement);
fs.writeFileSync('server.ts', code);
console.log('Handled status patch applied');
