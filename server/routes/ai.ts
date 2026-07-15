import express from 'express';
import { GoogleGenAI } from "@google/genai";

export const aiRouter = express.Router();

// Copilot Analytics API using Gemini API
aiRouter.post("/copilot/analyze", async (req, res) => {
  try {
    const { leadData } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: "Gemini API key is not configured on the server." });
    }

    const ai = new GoogleGenAI({ 
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
    
    const prompt = `
      You are a top-tier retail sales copilot and AI consultant.
      Analyze this customer profile:
      ${JSON.stringify(leadData, null, 2)}
      
      Provide real-time actionable recommendations in JSON format:
      {
        "recommendedUpsell": "string (Short specific action to upsell)",
        "crossSellBundle": "string (A logical bundle of products)",
        "objectionHandling": "string (How to overcome likely objections based on their data)",
        "draftMessage": "string (A polite, conversion-optimized message to send them right now)"
      }
      Make it very brief, hyper-specific to their data, and highly persuasive.
      Output ONLY raw JSON, no markdown.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt
    });

    let responseText = response.text || "{}";
    responseText = responseText.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();
    
    const analysis = JSON.parse(responseText);
    res.json(analysis);

  } catch (err) {
    console.error("Copilot Analysis Error:", err);
    res.status(500).json({ error: "Failed to run Copilot analysis" });
  }
});
