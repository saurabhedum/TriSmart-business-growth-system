const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf-8');

const anchor = '// Meta Incoming Message Receipt';
const startIdx = code.indexOf(anchor);

const endAnchor = '  // WhatsApp Web JS Integration';
const endIdx = code.indexOf(endAnchor);

if (startIdx === -1 || endIdx === -1) {
    console.log("Could not find webhook block!");
    process.exit(1);
}

const replacement = `  // Meta Incoming Message Receipt
  const processedMessageIds: string[] = [];
  app.post(["/api/whatsapp-webhook/:ownerId", "/api/instagram-webhook/:ownerId"], async (req, res) => {
    try {
      const { ownerId } = req.params;
      const body = req.body;

      if (!body.object) {
        return res.sendStatus(200);
      }

      // Send 200 OK immediately to prevent Meta from retrying
      res.status(200).send("EVENT_RECEIVED");

      // Process in background
      (async () => {
        const entries = body.entry || [];
        const isInstagram = body.object === "instagram";
        const platformStr = isInstagram ? "Instagram" : "WhatsApp";

        try {
          // Normalize messages from both platforms
          const normalizedMessages = [];

          for (const entry of entries) {
            if (isInstagram) {
              const messaging = entry.messaging || [];
              for (const m of messaging) {
                if (m.message && m.sender?.id) {
                  normalizedMessages.push({
                    id: m.message.mid,
                    from: m.sender.id,
                    text: m.message.text || "",
                    type: "text",
                    raw: m
                  });
                }
              }
            } else {
              const changes = entry.changes || [];
              for (const change of changes) {
                const messages = change.value?.messages || [];
                for (const m of messages) {
                  normalizedMessages.push({
                    id: m.id,
                    from: m.from,
                    text: m.text?.body || "",
                    type: m.type,
                    imageId: m.image?.id,
                    raw: m
                  });
                }
              }
            }
          }

          for (const messageObj of normalizedMessages) {
            const msgId = messageObj.id;
            
            if (msgId) {
              if (processedMessageIds.includes(msgId)) {
                console.log(\`[Webhook] Ignoring duplicate message: \${msgId}\`);
                continue;
              }
              processedMessageIds.push(msgId);
              if (processedMessageIds.length > 2000) processedMessageIds.shift();

              // DB-backed deduplication
              const dbInstance = admin.apps.length ? getRequiredAdminDb() : null;
              if (dbInstance) {
                try {
                  const dedupRef = dbInstance.collection("webhook_dedup").doc(msgId);
                  const isDuplicate = await dbInstance.runTransaction(async (t) => {
                    const doc = await t.get(dedupRef);
                    if (doc.exists) return true;
                    t.set(dedupRef, { timestamp: FieldValue.serverTimestamp() });
                    return false;
                  });
                  
                  if (isDuplicate) {
                    console.log(\`[Webhook] Ignoring duplicate message (DB Transaction): \${msgId}\`);
                    continue;
                  }
                } catch (e) {
                  console.error("Dedup DB transaction failed:", e);
                }
              }
            }

            const fromMobile = messageObj.from;
            const msgBody = messageObj.text;
            const msgType = messageObj.type;

            console.log(\`[Webhook] Received \${platformStr} message from \${fromMobile} for owner \${ownerId}: \${msgBody || msgType}\`);

            try {
              const cleanMobile = fromMobile.replace(/\\D/g, "");
              const dbInstance = admin.apps.length ? getRequiredAdminDb() : null;
              let isPotentialBuyer = false;
              if (msgBody) {
                  const lower = msgBody.toLowerCase();
                  if (lower.includes("buy") || lower.includes("want") || lower.includes("price") || lower.includes("seeking") || lower.includes("purchase")) {
                    isPotentialBuyer = true;
                  }
              }

              if (dbInstance && msgId) {
                 // Log into Interaction hub
                 try {
                   await dbInstance.collection("interactions").doc(msgId).set({
                     id: msgId,
                     leadId: fromMobile,
                     leadName: fromMobile, // Fallback
                     platform: platformStr,
                     type: platformStr,
                     content: msgBody || "[Media]",
                     message: msgBody || "[Media]",
                     status: "Pending",
                     direction: "Inbound",
                     isPotentialBuyer,
                     timestamp: new Date().toISOString(),
                     createdAt: new Date().toISOString(),
                     ownerId
                   });

                   const msgColl = isInstagram ? "instagram_messages" : "whatsapp_messages";
                   await dbInstance.collection(msgColl).doc(msgId).set({
                      id: msgId,
                      ownerId,
                      from: fromMobile,
                      text: msgBody || "[Media]",
                      direction: "inbound",
                      timestamp: Date.now()
                   });
                 } catch (e) {
                   console.error("Failed to log interaction:", e);
                 }
              }

              let matchedCustomer = await getCustomerByMobile(ownerId, cleanMobile);
              
              // If not found and it's instagram, they might not be registered by mobile number.
              // We just handle it gracefully by skipping advanced CRM functionality if no matchedCustomer.
              
              if (matchedCustomer && matchedCustomer.status !== "Suspended") {
                const settings = await getSettings(ownerId);

                // --- Legacy Advanced Webhook logic follows ---
                if (msgType === "image" && messageObj.imageId && !isInstagram) {
                  const imageId = messageObj.imageId;
                  if (settings && settings.metaWhatsAppApiKey) {
                    try {
                      const mediaRes = await fetch(\`https://graph.facebook.com/v17.0/\${imageId}\`, {
                        headers: { Authorization: \`Bearer \${settings.metaWhatsAppApiKey}\` }
                      });
                      const mediaData = await mediaRes.json();

                      if (mediaData.url) {
                        const imgRes = await fetch(mediaData.url, { headers: { Authorization: \`Bearer \${settings.metaWhatsAppApiKey}\` } });
                        const contentType = imgRes.headers.get("content-type") || "image/jpeg";
                        const arrayBuf = await imgRes.arrayBuffer();
                        const buffer = Buffer.from(arrayBuf);

                        if (dbInstance) {
                          const receiptId = \`REC-\${Math.random().toString(36).substring(2, 10).toUpperCase()}\`;
                          let imageUrl = "";

                          try {
                            const bucket = admin.storage().bucket();
                            const file = bucket.file(\`receipts/\${ownerId}/\${receiptId}\`);
                            await file.save(buffer, { metadata: { contentType } });
                            const signedUrls = await file.getSignedUrl({ action: "read", expires: "01-01-2499" });
                            imageUrl = signedUrls[0];
                          } catch (e) {
                            console.error("Storage upload failed, fallback to base64", e);
                            imageUrl = \`data:\${contentType};base64,\${buffer.toString("base64")}\`;
                          }

                          await dbInstance.collection("payment_receipts").doc(receiptId).set({
                            id: receiptId,
                            customerId: matchedCustomer.id,
                            customerName: matchedCustomer.name,
                            ownerId: ownerId,
                            amount: matchedCustomer.balance || 0,
                            base64Image: imageUrl,
                            status: "Pending",
                            submittedAt: new Date().toISOString(),
                          });

                          await sendWhatsAppMessage(settings as any, fromMobile, "Thank you! We have received your payment screenshot. It is currently under verification.");

                          await dbInstance.collection("customers").doc(matchedCustomer.id).collection("chat_history").add({
                            role: "user",
                            content: "Uploaded payment screenshot.",
                            source: platformStr.toLowerCase(),
                            timestamp: FieldValue.serverTimestamp(),
                          });
                        }
                      }
                    } catch (e) {
                      console.error("Failed to process image receipt:", e);
                    }
                  }
                } else if (msgBody) {
                  if (dbInstance) {
                    try {
                      await dbInstance.collection("customers").doc(matchedCustomer.id).collection("chat_history").add({
                        role: "user",
                        content: msgBody,
                        source: platformStr.toLowerCase(),
                        timestamp: FieldValue.serverTimestamp(),
                      });
                    } catch (e) {}

                    // Month report check
                    if (matchedCustomer.pendingMonthlyReport && !isInstagram) {
                      try {
                        await dbInstance.collection("customers").doc(matchedCustomer.id).update({ pendingMonthlyReport: false });
                        const requestedMonthYear = msgBody.trim().toLowerCase();
                        const reportSnap = await dbInstance.collection("reports").where("ownerId", "==", ownerId).get();
                        
                        let foundReport = null;
                        let reportFileUrl = "";
                        let reportFileName = "";
                        
                        for (const doc of reportSnap.docs) {
                          const r = doc.data();
                          if (r.title && r.title.toLowerCase().includes(requestedMonthYear)) {
                            foundReport = r;
                            if (r.files && r.files.length > 0) { reportFileUrl = r.files[0].data; reportFileName = r.files[0].name || "Report.pdf"; }
                            else if (r.assetLink) { reportFileUrl = r.assetLink; reportFileName = "DriveLink"; }
                            break;
                          }
                        }
                        
                        let compResText = "";
                        if (foundReport && reportFileUrl) {
                          compResText = \`Here is the requested report for \${requestedMonthYear}.\`;
                          await dbInstance.collection("customers").doc(matchedCustomer.id).collection("chat_history").add({
                            role: "assistant", content: compResText, source: platformStr.toLowerCase(), timestamp: FieldValue.serverTimestamp(),
                          });
                          
                          if (settings && settings.metaWhatsAppPhoneNumberId) {
                             if (reportFileName === "DriveLink" || reportFileUrl.includes("drive.google.com") || (!reportFileUrl.startsWith("data:") && reportFileUrl.startsWith("http"))) {
                                compResText = \`Here is the requested report for \${requestedMonthYear}:\\n\${reportFileUrl}\`;
                                await sendWhatsAppMessage(settings as any, fromMobile, compResText);
                             } else if (reportFileUrl.startsWith("data:")) {
                                const base64Data = reportFileUrl.split(',')[1];
                                await sendWhatsAppMessage(settings as any, fromMobile, compResText, base64Data, reportFileName);
                             }
                          }
                        } else {
                          compResText = \`The report does not exist.\`;
                          await dbInstance.collection("customers").doc(matchedCustomer.id).collection("chat_history").add({
                            role: "assistant", content: compResText, source: platformStr.toLowerCase(), timestamp: FieldValue.serverTimestamp(),
                          });
                          if (settings && settings.metaWhatsAppPhoneNumberId) await sendWhatsAppMessage(settings as any, fromMobile, compResText);
                        }
                        continue;
                      } catch (e) {
                        console.error("Error processing monthly report fetch:", e);
                      }
                    } // end monthly check
                    
                    if (matchedCustomer.pendingComplaint) {
                       try {
                          const complaintId = "COMP-" + Math.random().toString(36).substr(2, 8).toUpperCase();
                          await saveComplaintData(complaintId, {
                            id: complaintId, customerId: matchedCustomer.id, ownerId, customerName: matchedCustomer.name, mobileNumber: matchedCustomer.mobileNumber || "",
                            category: "Service Request", message: \`\${platformStr} Complaint\`, description: msgBody, billStatus: matchedCustomer.balance > 0 ? \`Unpaid (₹\${matchedCustomer.balance})\` : "Paid",
                            status: "Pending", priority: "Medium", createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
                          });
                          await dbInstance.collection("customers").doc(matchedCustomer.id).update({ pendingComplaint: false });
                          const compResText = \`Thank you. Your complaint has been registered successfully. We will resolve it soon!\`;
                          await dbInstance.collection("customers").doc(matchedCustomer.id).collection("chat_history").add({
                            role: "assistant", content: compResText, source: platformStr.toLowerCase(), timestamp: FieldValue.serverTimestamp(),
                          });
                          if (settings && settings.metaWhatsAppPhoneNumberId && !isInstagram) await sendWhatsAppMessage(settings as any, fromMobile, compResText);
                          continue;
                       } catch (e) {}
                    }
                    
                    if (matchedCustomer.pendingDeepReportInquiry) {
                      try {
                         await dbInstance.collection("customers").doc(matchedCustomer.id).update({ pendingDeepReportInquiry: false });
                         const auditId = Math.random().toString(36).substr(2, 9);
                         await dbInstance.collection("billing_audit").doc(auditId).set({
                           id: auditId, ownerId, type: 'inquiry', customerId: matchedCustomer.id, customerName: matchedCustomer.name, description: msgBody,
                           affectedCustomersCount: 1, totalAmount: 0, timestamp: new Date().toISOString(), executedBy: 'system'
                         });
                         const compResText = \`Thank you. The request has been submitted. We will inform you of the next steps within 24 working hours.\`;
                         await dbInstance.collection("customers").doc(matchedCustomer.id).collection("chat_history").add({
                           role: "assistant", content: compResText, source: platformStr.toLowerCase(), timestamp: FieldValue.serverTimestamp(),
                         });
                         if (settings && settings.metaWhatsAppPhoneNumberId && !isInstagram) await sendWhatsAppMessage(settings as any, fromMobile, compResText);
                         continue;
                      } catch (e) {}
                    }
                  }

                  const chatbotSettings = await getChatbotSettings(ownerId) as any;
                  let handled = false;
                  const msgLower = msgBody.toLowerCase().trim();
                  let responseText = "I'm sorry, I don't understand that command.";
                  let sysTrigger = "";
                  let hasCustomCommandMatched = false;
                  let matchedCommand: any = null;

                  if (chatbotSettings && chatbotSettings.isActive && Array.isArray(chatbotSettings.commands)) {
                    for (const cmd of chatbotSettings.commands) {
                      if (cmd.isActive && testChatbotCommand(msgBody, cmd.triggerWord, cmd.buttonLabel)) {
                        responseText = processDynamicResponse(cmd.response || "", matchedCustomer, req.get("host") || "");
                        sysTrigger = cmd.triggerWord;
                        hasCustomCommandMatched = true;
                        matchedCommand = cmd;
                        break;
                      }
                    }
                  }

                  if (!hasCustomCommandMatched) sysTrigger = msgLower;

                  const intentRes = await routeSystemIntent(sysTrigger, matchedCustomer, ownerId, settings, hasCustomCommandMatched ? responseText : "", chatbotSettings, req.get("host"));

                  let attachmentsToPass: any[] = [];
                  if (intentRes.matched) {
                    responseText = intentRes.replyText;
                    if (intentRes.attachments && intentRes.attachments.length > 0) attachmentsToPass = intentRes.attachments;
                    handled = true;
                    
                    if (intentRes.action === "complaint" && dbInstance) {
                      try { await dbInstance.collection("customers").doc(matchedCustomer.id).update({ pendingComplaint: true }); } catch (e) {}
                    } else if (intentRes.action === "monthly_report" && dbInstance) {
                      try { await dbInstance.collection("customers").doc(matchedCustomer.id).update({ pendingMonthlyReport: true }); } catch (e) {}
                    } else if (intentRes.action === "deep_report" && dbInstance) {
                      try { await dbInstance.collection("customers").doc(matchedCustomer.id).update({ pendingDeepReportInquiry: true }); } catch (e) {}
                    }
                  } else if (hasCustomCommandMatched) {
                    handled = true;
                    if (matchedCommand?.mediaUrl) {
                      attachmentsToPass.push({ type: "file", name: matchedCommand.mediaName || "Attachment", data: matchedCommand.mediaUrl });
                    }
                  } else if (msgLower.startsWith("complaint") || msgLower.startsWith("issue")) {
                    let complaintText = msgBody;
                    if (msgLower.startsWith("complaint:")) complaintText = msgBody.substring(10).trim();
                    else if (msgLower.startsWith("complaint ")) complaintText = msgBody.substring(10).trim();
                    else if (msgLower.startsWith("issue ")) complaintText = msgBody.substring(6).trim();
                    else if (msgLower.startsWith("issue:")) complaintText = msgBody.substring(6).trim();

                    if (complaintText.startsWith('"') && complaintText.endsWith('"')) complaintText = complaintText.substring(1, complaintText.length - 1);
                    else if (complaintText.startsWith("'") && complaintText.endsWith("'")) complaintText = complaintText.substring(1, complaintText.length - 1);

                    if (complaintText.length > 5 && complaintText.toLowerCase() !== "complaint" && complaintText.toLowerCase() !== "issue") {
                      const complaintId = "COMP-" + Math.random().toString(36).substr(2, 8).toUpperCase();
                      await saveComplaintData(complaintId, {
                        id: complaintId, customerId: matchedCustomer.id, ownerId: ownerId, customerName: matchedCustomer.name, mobileNumber: matchedCustomer.mobileNumber || "",
                        category: "Service Request", message: \`\${platformStr} Complaint\`, description: complaintText,
                        billStatus: matchedCustomer.balance > 0 ? \`Unpaid (₹\${matchedCustomer.balance})\` : "Paid",
                        status: "Pending", priority: "Medium", createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
                      });
                      responseText = \`Thank you. Your complaint has been registered successfully. We will resolve it soon!\`;
                    } else {
                      responseText = \`Please provide more details. Try typing "Complaint " followed by your issue in quotes. (Example: Complaint "my meter is broken")\`;
                    }
                    handled = true;
                  } else {
                    let useAI = false;
                    let aiResponse = "";
                    
                    if (process.env.GEMINI_API_KEY && settings?.aiChatbotEnabled === true) {
                      try {
                         const genAi = new GoogleGenAI({ 
                           apiKey: process.env.GEMINI_API_KEY,
                           httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
                         });
                         let inventoryContext = "Inventory Data: None available right now.\n";
                         if (dbInstance) {
                           const invSnap = await dbInstance.collection("inventory_items").where("ownerId", "==", ownerId).limit(50).get();
                           if (!invSnap.empty) {
                             const items = invSnap.docs.map(d => d.data());
                             inventoryContext = "Available Products in Inventory:\n" + items.map(item => "- " + item.name + " (Price: " + item.price + ", Stock: " + item.stock + ", Status: " + item.status + ")").join("\n") + "\n\n";
                             inventoryContext += "Instructions: If the customer wants to place an order for the above items, collect their delivery details and inform them you will process it.\n";
                           }
                         }
                         const personaIns = settings?.aiPersonaInstructions || "You are a helpful assistant.";
                         const systemIns = personaIns + "\n\n" + inventoryContext;

                         let chatHistoryContext = [];
                         if (dbInstance) {
                           const histSnap = await dbInstance.collection("customers").doc(matchedCustomer.id).collection("chat_history").orderBy("timestamp", "desc").limit(5).get();
                           chatHistoryContext = histSnap.docs.map(d => d.data()).reverse().map(d => d.role + ": " + d.content);
                         }
                         
                         let fullPrompt = chatHistoryContext.concat(["user: " + msgBody, "assistant: "]).join("\n");
                         const result = await genAi.models.generateContent({
                           model: "gemini-1.5-flash",
                           contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
                           config: { systemInstruction: systemIns, temperature: 0.7 }
                         });
                         aiResponse = result.text || "";
                         if (aiResponse) { responseText = aiResponse; handled = true; useAI = true; }
                      } catch (e) {}
                    }
                    if (!useAI) handled = false;
                  }

                  if (handled && settings && ((settings.metaWhatsAppApiKey && settings.metaWhatsAppPhoneNumberId) || settings.watiAccessToken) && !isInstagram) {
                    try {
                      if (attachmentsToPass.length > 0) {
                        await sendWhatsAppMessage(settings as any, fromMobile, responseText, attachmentsToPass[0].data, attachmentsToPass[0].name);
                      } else {
                        await sendWhatsAppMessage(settings as any, fromMobile, responseText);
                      }
                      if (dbInstance) {
                         try { await dbInstance.collection("customers").doc(matchedCustomer.id).collection("chat_history").add({ role: "assistant", content: responseText, source: platformStr.toLowerCase(), timestamp: FieldValue.serverTimestamp() }); } catch (e) {}
                      }
                    } catch (e) {
                      console.error("[Webhook] Failed to send chatbot reply:", e);
                    }
                  } else if (handled && isInstagram) {
                     // TODO: Implement instagram message reply here using Insta API
                     console.log("Instagram reply should be sent here:", responseText);
                  }

                  const isComplaint = msgBody.toLowerCase().includes("complaint") || msgBody.toLowerCase().includes("complain");
                  if (!handled && isComplaint && settings?.automation?.autoCreateComplaints !== false) {
                    const complaintId = \`COMP-\${Math.random().toString(36).substr(2, 6).toUpperCase()}\`;
                    await saveComplaintData(complaintId, {
                      id: complaintId, customerId: matchedCustomer.id, customerName: matchedCustomer.name, message: "Automated Log", description: msgBody,
                      billStatus: matchedCustomer.balance > 0 ? \`Unpaid (₹\${matchedCustomer.balance})\` : "Paid", status: "Pending", createdAt: new Date().toISOString(), ownerId,
                    });

                    if (settings && ((settings.metaWhatsAppApiKey && settings.metaWhatsAppPhoneNumberId) || settings.watiAccessToken) && !isInstagram) {
                      try { await sendWhatsAppMessage(settings as any, fromMobile, \`Dear \${matchedCustomer.name}, we have received your complaint (ID: \${complaintId}). We will look into it soon.\`); } catch (e) {}
                    }
                    handled = true;
                  }
                  
                  // NEW: If NOT handled by any AI, Custom Command, Complaint logic -> DO NOT DO ANYTHING to prevent spam!
                  // That means no "we received your message" spam from chatbot.
                }
              }
            } catch (innerErr) {
              console.error("[Webhook] Processing error:", innerErr);
            }
          }
        } catch (botErr) {
          console.error("Bot execution error", botErr);
        }
      })();
    } catch (err) {
      console.error("[Webhook] Handler error:", err);
      if (!res.headersSent) res.sendStatus(200);
    }
  });
`;

code = code.slice(0, startIdx) + replacement + '\n' + code.slice(endIdx);
fs.writeFileSync('server.ts', code);
console.log('Webhook complete successfully applied!');
