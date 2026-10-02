import express from "express";
import OpenAI from "openai";
import { callModel, type ChatRequest } from "./model.js";

const app = express();
const port = 3001;

app.use((req, _res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.use(express.json());

app.post("/api/chat", async (req, res) => {
  try {

    // Send the conversation to the model.
    const response = await callModel(req.body as ChatRequest);

    // We return the response to the client
    res.json(response);

  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      res.status(error.status ?? 500).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: String(error) });
  }
});

app.listen(port, () => {
  console.log(`server listening on http://localhost:${port}`);
});
