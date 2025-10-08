import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:4200",
    methods: ["GET", "POST"],
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));

// Validazione API Key
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ ERRORE: GEMINI_API_KEY non configurata!");
  process.exit(1);
}

// ✅ Endpoint principale per Gemini
app.post("/api/gemini/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    // Validazione input
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({
        error: "Prompt richiesto e deve essere una stringa",
      });
    }

    if (prompt.length > 30000) {
      return res.status(400).json({
        error: "Prompt troppo lungo (max 30.000 caratteri)",
      });
    }

    console.log(
      `📨 Richiesta ricevuta - Prompt length: ${prompt.length} caratteri`
    );

    // Chiamata a Gemini API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Errore Gemini API:", errorData);

      return res.status(response.status).json({
        error: "Errore dalla API di Gemini",
        details: errorData,
      });
    }

    const data = await response.json();
    console.log("✅ Risposta Gemini ricevuta con successo");

    res.json(data);
  } catch (error) {
    console.error("❌ Errore nel server:", error);
    res.status(500).json({
      error: "Errore interno del server",
      message: error.message,
    });
  }
});

// ✅ Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ✅ Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "AI Study Assistant Backend API",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      gemini: "POST /api/gemini/generate",
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Endpoint non trovato",
    path: req.path,
  });
});

// Error handler globale
app.use((err, req, res, next) => {
  console.error("❌ Errore non gestito:", err);
  res.status(500).json({
    error: "Errore interno del server",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Avvio server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════╗
║   🚀 Gino AI Assistant Backend          ║
║                                           ║
║   Server: http://localhost:${PORT}       ║
║   Status: ✅ Running                      ║
║   Environment: ${process.env.NODE_ENV || "development"}              ║
╚═══════════════════════════════════════════╝
  `);
});

// Gestione graceful shutdown
process.on("SIGTERM", () => {
  console.log("👋 SIGTERM ricevuto, chiusura server...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("👋 SIGINT ricevuto, chiusura server...");
  process.exit(0);
});
