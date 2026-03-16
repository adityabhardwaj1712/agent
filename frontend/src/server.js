require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health-check API example
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from AgentCloud backend!" });
});

// Simple LLM proxy example (e.g. OpenAI-compatible API)
// Expects: POST /api/chat { "message": "your prompt" }
// Reads API key from process.env.OPENAI_API_KEY
app.post("/api/chat", async (req, res) => {
  const userMessage = (req.body && req.body.message) || "";
  if (!userMessage.trim()) {
    return res.status(400).json({ error: "message is required" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res
      .status(500)
      .json({ error: "Server is missing OPENAI_API_KEY environment variable" });
  }

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are AgentCloud, a helpful AI coding assistant. Answer briefly.",
          },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return res
        .status(502)
        .json({ error: "Upstream API error", status: response.status, text });
    }

    const data = await response.json();
    const content =
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content;

    res.json({
      reply: content || "",
      raw: data,
    });
  } catch (err) {
    console.error("LLM error:", err);
    res.status(500).json({ error: "LLM request failed", detail: String(err) });
  }
});

// Serve static frontend
const publicDir = path.join(__dirname, "..", "public");
app.use(express.static(publicDir));

// Fallback to index.html for root
app.get("*", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

