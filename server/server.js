import "dotenv/config";

import { GoogleGenAI } from "@google/genai";
import cors from "cors";
import express from "express";

import brunoIdentity from "./config/brunoIdentity.js";

const app = express();
const PORT = 3000;

if (!process.env.GEMINI_API_KEY) {
  console.error("❌ No se encontró GEMINI_API_KEY en server/.env");
  process.exit(1);
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

app.use(cors());
app.use(express.json());

const BRUNO_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
];

function isRetryableError(error) {
  const status = error?.status;

  return (
    status === 408 ||
    status === 429 ||
    (typeof status === "number" && status >= 500)
  );
}

async function askBruno(message) {
  let lastError = null;

  for (const model of BRUNO_MODELS) {
    try {
      console.log(`🚪 Bruno tocando: ${model}`);

      const response = await ai.models.generateContent({
        model,

        contents: [
          {
            role: "user",
            parts: [
              {
                text: message,
              },
            ],
          },
        ],

        config: {
          systemInstruction: brunoIdentity,
        },
      });

      const reply = response.text?.trim();

      if (!reply) {
        throw new Error("El modelo respondió sin texto.");
      }

      console.log(`✅ Respondió: ${model}`);

      return {
        reply,
        model,
      };
    } catch (error) {
      lastError = error;

      console.log(
        `⚠️ ${model} no respondió. Status: ${error?.status ?? "desconocido"}`,
      );

      if (!isRetryableError(error)) {
        throw error;
      }

      console.log("➡️ Probando la siguiente puerta...");
    }
  }

  throw lastError ?? new Error("Ningún modelo respondió.");
}

app.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "Bruno server está funcionando.",
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        error: "El mensaje está vacío.",
      });
    }

    const result = await askBruno(message.trim());

    return res.json({
      reply: result.reply,
    });
  } catch (error) {
    console.error("❌ Ninguna puerta respondió:", error);

    return res.status(503).json({
      error:
        "Bruno está teniendo un poco de dificultad para responder. Inténtalo de nuevo en un momento.",
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🔵 Bruno server escuchando en puerto ${PORT}`);
});
