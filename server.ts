import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini API client on the server side
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Endpoint to draft/refine message content using Gemini 3.5 Flash
  app.post("/api/refine-message", async (req, res) => {
    try {
      const { draft, instructions, customerName, serviceType } = req.body;

      if (!draft) {
        return res.status(400).json({ error: "Draft or base text is required" });
      }

      const systemInstruction = 
        "You are a sophisticated, friendly, and highly professional CRM copywriting specialist for NOVA Hair Atelier, " +
        "an elegant luxury boutique hair salon in Kuala Lumpur. Your task is to craft or refine premium, warm, " +
        "and engaging message campaigns (to be sent via WhatsApp or SMS). The tone should be high-end, friendly, " +
        "personal, and never pushy or spammy. Keep the output concise, structured, and easy to read. " +
        "Always use natural Malaysian/universal english, sometimes inserting appropriate elegant emojis, but keeping it premium.";

      let userPrompt = `Please refine or rewrite the following salon CRM message draft:
"${draft}"`;

      if (customerName) {
        userPrompt += `\n- The customer's name is "${customerName}". Ensure it is personalized nicely.`;
      }
      if (serviceType) {
        userPrompt += `\n- The service discussed or recommended is "${serviceType}".`;
      }
      if (instructions) {
        userPrompt += `\n- Custom refinement instructions: ${instructions}`;
      }

      userPrompt += `\n\nReturn ONLY the refined message content. Do not include any surrounding conversational filler, markdown formatting (such as "Here is your refined message:"), or notes. Just the text.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      const refinedMessage = response.text?.trim() || draft;
      res.json({ refinedMessage });
    } catch (error: any) {
      console.error("Gemini API Error in refine-message endpoint:", error);
      res.status(500).json({ error: error.message || "Failed to generate or refine message via AI" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
