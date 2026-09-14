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
  {
    model: "gemini-3.5-flash-lite",
    delay: 0,
  },
  {
    model: "gemini-3.6-flash",
    delay: 650,
  },
  {
    model: "gemini-3.5-flash",
    delay: 1550,
  },
];

function isRetryableError(error) {
  const status = error?.status;

  return (
    status === 408 ||
    status === 429 ||
    (typeof status === "number" && status >= 500)
  );
}

async function askModel(model, history, delay = 0) {
  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  console.log(`🚪 Bruno tocando: ${model}`);

  const contents = history.map((item) => ({
    role: item.sender === "bruno" ? "model" : "user",
    parts: [
      {
        text: item.text,
      },
    ],
  }));

  try {
    const response = await ai.models.generateContent({
      model,
      contents,
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
    console.log(`⚠️ ${model} falló. Status: ${error?.status ?? "desconocido"}`);

    throw error;
  }
}
async function askBruno(history) {
  const attempts = BRUNO_MODELS.map(({ model, delay }) =>
    askModel(model, history, delay),
  );

  try {
    const result = await Promise.any(attempts);

    console.log(`🏁 Ganó: ${result.model}`);

    return result;
  } catch (error) {
    console.error("❌ Todas las puertas fallaron.");

    throw error;
  }
}

app.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "Bruno server está funcionando.",
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { history } = req.body;

    if (!Array.isArray(history) || history.length === 0) {
      return res.status(400).json({
        error: "La conversación está vacía.",
      });
    }

    const result = await askBruno(history);

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
app.post("/api/chat-stream", async (req, res) => {
  try {
    const { history } = req.body;

    if (!Array.isArray(history) || history.length === 0) {
      return res.status(400).json({
        error: "La conversación está vacía.",
      });
    }

    const contents = history.map((item) => ({
      role: item.sender === "bruno" ? "model" : "user",
      parts: [
        {
          text: item.text,
        },
      ],
    }));

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    res.flushHeaders();

    console.log("🌊 Bruno iniciando streaming...");

    const stream = await ai.models.generateContentStream({
      model: "gemini-3.5-flash-lite",
      contents,
      config: {
        systemInstruction: brunoIdentity,
      },
    });

    for await (const chunk of stream) {
      const text = chunk.text;

      if (text) {
        res.write(text);
      }
    }

    console.log("✅ Streaming terminado.");

    res.end();
  } catch (error) {
    console.error("❌ Error en streaming:", error);

    if (!res.headersSent) {
      return res.status(503).json({
        error: "Bruno tuvo dificultad para responder.",
      });
    }

    res.end();
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🔵 Bruno server escuchando en puerto ${PORT}`);
});
