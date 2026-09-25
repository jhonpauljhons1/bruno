import "dotenv/config";

import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import cors from "cors";
import express from "express";
import ws from "ws";

import brunoIdentity from "./config/brunoIdentity.js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    realtime: {
      transport: ws,
    },
  },
);
async function getBrunoMemory(userId) {
  try {
    const { data, error } = await supabaseAdmin
      .from("bruno_memory")
      .select("memory")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.log("⚠️ Error leyendo memoria de Bruno:", error.message);
      return "";
    }

    return data?.memory ?? "";
  } catch (error) {
    console.log("⚠️ No se pudo leer la memoria de Bruno:", error?.message);
    return "";
  }
}
async function saveBrunoMemory(userId, memory) {
  try {
    const { error } = await supabaseAdmin.from("bruno_memory").upsert(
      {
        user_id: userId,
        memory,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      },
    );

    if (error) {
      console.log("⚠️ Error guardando memoria de Bruno:", error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.log("⚠️ No se pudo guardar la memoria de Bruno:", error?.message);
    return false;
  }
}
async function updateBrunoMemory(userId, history) {
  try {
    const currentMemory = await getBrunoMemory(userId);

    const recentConversation = history
      .slice(-12)
      .map((item) => {
        const speaker = item.sender === "bruno" ? "Bruno" : "Usuario";
        return `${speaker}: ${item.text}`;
      })
      .join("\n");

    if (!recentConversation.trim()) return;

    const memoryPrompt = `
Eres el sistema de memoria de Bruno.

Tu trabajo NO es responder al usuario.
Debes decidir qué información de la conversación merece conservarse
para que Bruno pueda recordar al usuario en conversaciones futuras.

MEMORIA ACTUAL:
${currentMemory || "(vacía)"}

CONVERSACIÓN RECIENTE:
${recentConversation}

Conserva únicamente información útil a largo plazo, por ejemplo:
- personas importantes para el usuario y su relación con ellas
- preferencias personales relevantes
- proyectos, objetivos o planes importantes
- situaciones recurrentes que ayuden a entender al usuario
- acontecimientos personales importantes
- temas pendientes que sería natural recordar después

NO guardes:
- saludos o charla trivial
- frases aisladas sin importancia futura
- detalles temporales que probablemente no vuelvan a importar
- información sobre Bruno o sobre cómo funciona el sistema
- cada detalle de la conversación

Devuelve únicamente la memoria actualizada en texto breve y claro.

Si la conversación reciente no contiene nada que valga la pena recordar,
devuelve exactamente la memoria actual sin agregar nada.
`;

    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: memoryPrompt,
    });

    const newMemory = result.text?.trim();

    if (!newMemory || newMemory === currentMemory) {
      return;
    }

    await saveBrunoMemory(userId, newMemory);

    console.log("🧠 Memoria de Bruno actualizada.");
  } catch (error) {
    console.log("⚠️ Error actualizando memoria de Bruno:", error?.message);
  }
}
const app = express();
const PORT = process.env.PORT || 3000;

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
        tools: [
          {
            googleSearch: {},
          },
        ],
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
async function detectEmotion(history) {
  try {
    const recentHistory = history
      .slice(-8)
      .map((item) => {
        const speaker = item.sender === "bruno" ? "Bruno" : "Usuario";
        return `${speaker}: ${item.text}`;
      })
      .join("\n");

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: `
Analiza el estado emocional predominante del USUARIO basándote en la conversación reciente.

No analices la emoción de Bruno.
No busques solamente palabras emocionales explícitas.
Interpreta el significado, tono y contexto de lo que el usuario está expresando.

El usuario no necesita decir directamente "estoy triste", "estoy feliz" o "estoy enojado".
Puedes inferir una emoción cuando el contexto la sugiera claramente.

Debes responder con UNA sola palabra de esta lista:

neutral
calma
alegria
tristeza
ansiedad
enojo

Reglas:
- No diagnostiques estados psicológicos ni condiciones médicas.
- Si varias emociones aparecen, elige la predominante en el contexto reciente.
- Da mayor importancia a los mensajes más recientes del usuario.
- Si no existe evidencia suficiente para identificar una emoción, responde neutral.
- No expliques tu respuesta.

CONVERSACIÓN RECIENTE:

${recentHistory}
  `,
      config: {
        temperature: 0,
      },
    });

    const emotion = response.text?.trim().toLowerCase();

    const validEmotions = [
      "neutral",
      "calma",
      "alegria",
      "tristeza",
      "ansiedad",
      "enojo",
    ];

    return validEmotions.includes(emotion) ? emotion : "neutral";
  } catch (error) {
    console.log("⚠️ No se pudo detectar emoción:", error?.message);
    return "neutral";
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
app.post("/api/emotion", async (req, res) => {
  try {
    const { history } = req.body;

    if (!Array.isArray(history) || history.length === 0) {
      return res.status(400).json({
        emotion: "neutral",
      });
    }

    const emotion = await detectEmotion(history);

    console.log(`🎨 Emoción detectada: ${emotion}`);

    return res.json({
      emotion,
    });
  } catch (error) {
    console.error("❌ Error detectando emoción:", error);

    return res.json({
      emotion: "neutral",
    });
  }
});
app.post("/api/chat-stream", async (req, res) => {
  try {
    const { history, userId } = req.body;
    if (!userId) {
      return res.status(400).json({
        error: "Falta identificar al usuario.",
      });
    }

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
    const currentDate = new Intl.DateTimeFormat("es-MX", {
      timeZone: "America/Mazatlan",
      dateStyle: "full",
    }).format(new Date());

    const brunoMemory = await getBrunoMemory(userId);

    const currentSystemInstruction = `${brunoIdentity}

MEMORIA DEL USUARIO:
${brunoMemory || "(Todavía no hay recuerdos guardados.)"}

Usa esta memoria únicamente cuando sea relevante para la conversación.
No menciones que tienes una base de datos, memoria almacenada o un sistema de memoria.
Recuerda la información de forma natural, como parte de tu relación con el usuario.
No fuerces recuerdos que no tengan relación con lo que se está hablando.

CONTEXTO TEMPORAL ACTUAL:

Hoy es ${currentDate}.

Usa esta fecha como la fecha actual de la conversación.

`;

    const stream = await ai.models.generateContentStream({
      model: "gemini-3.5-flash-lite",
      contents,
      config: {
        systemInstruction: currentSystemInstruction,
        // tools: [
        //   {
        //     googleSearch: {},
        //   },
        // ],
      },
    });

    let searchedTheWeb = false;

    for await (const chunk of stream) {
      const groundingMetadata = chunk.candidates?.[0]?.groundingMetadata;

      if (groundingMetadata && !searchedTheWeb) {
        searchedTheWeb = true;
        console.log("🌐 Bruno escarbó en el patio del vecino :)");
      }

      const text = chunk.text;

      if (text) {
        res.write(text);
      }
    }

    console.log("✅ Streaming terminado.");
    await updateBrunoMemory(userId, history);

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
  console.log(`🔵 Bruno inclinando su cabeza en puerto ${PORT}`);
});
