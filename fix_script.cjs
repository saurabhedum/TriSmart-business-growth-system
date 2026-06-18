const admin = require("firebase-admin");
const serviceAccount = require("./firebase-applet-config.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function run() {
  const settingsSnap = await db.collection("chatbotSettings").get();
  let foundSettings = false;
  settingsSnap.forEach(doc => {
     foundSettings = true;
     console.log("Commands for user:", doc.id);
     const data = doc.data();
     if(data.commands) {
         data.commands.forEach(cmd => {
             console.log(cmd.triggerWord, "->", cmd.response);
         });
     }
  });

  const settingsSnap2 = await db.collection("chatbot_settings").get();
  settingsSnap2.forEach(doc => {
     foundSettings = true;
     console.log("Commands (chatbot_settings) for user:", doc.id);
     const data = doc.data();
     if(data.commands) {
         data.commands.forEach(cmd => {
             console.log(cmd.triggerWord, "->", cmd.response);
         });
     }
  });
}

run().catch(console.error);
