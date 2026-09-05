import express from "express";
import Anthropic from "@anthropic-ai/sdk";
import { callClaude, type ChatRequest } from "./claude.js";
import { tools } from "./tools.js";

const app = express();
const port = 3001;

app.use((req, _res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.use(express.json());

app.post("/api/chat", async (req, res) => {
  try {
    // -- Here you can add logic that handles the incoming prompt
    //
    // ----

    // Here we send the
    const response = await callClaude(req.body as ChatRequest);

    // -- Here you can add logic that handles the response
    //
    // ----

    res.json(response);
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      res.status(error.status ?? 500).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: String(error) });
  }
});

app.listen(port, () => {
  console.log(`server listening on http://localhost:${port}`);
});
