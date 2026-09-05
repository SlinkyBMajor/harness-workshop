import Anthropic from "@anthropic-ai/sdk";

try {
  process.loadEnvFile();
} catch {
  console.log(
    "Can't load the .env file. Make sure you have one, with the ANTHROPIC_API_KEY set",
  );
}

// Here we create the client, provided by the SDK
// We could have done this using a fetch instead,
// but the SDK just provides a handy client
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export type ChatRequest = Anthropic.MessageCreateParamsNonStreaming;
export type ChatResponse = Anthropic.Message;

// This is where we call the API through the client
export async function callClaude(params: ChatRequest): Promise<ChatResponse> {
  return client.messages.create({ ...params, model: "claude-sonnet-4-6" });
}

// The same call without the SDK, using plain fetch.
// The SDK does exactly this under the hood, plus retries and typed errors.
/*
const res = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
    "anthropic-version": "2023-06-01",
    "content-type": "application/json",
  },
  body: JSON.stringify(params),
});
*/
