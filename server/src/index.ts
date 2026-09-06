import express from "express";
import Anthropic from "@anthropic-ai/sdk";
import { callClaude, type ChatRequest } from "./claude.js";

const app = express();
const port = 3001;
//const messageHistory: Anthropic.MessageParam[] = [];

app.use((req, _res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.use(express.json());

app.post("/api/chat", async (req, res) => {
  try {

    // We push the user's messages into the message history
    // messageHistory.push(...req.body.messages);

    // Send the conversation to Claude. If the model asks for tools,
    const response = await callClaude(req.body as ChatRequest);

    // Send the entire history to Claude, inlcuding the new message
    // const response = await callClaude({ ...req.body, messages: messageHistory } as ChatRequest);

    // We push the assistant's response into the message history
    //messageHistory.push({ role: "assistant", content: response.content });

    // We return the response to the client
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
