import OpenAI from "openai";
import { toolDefinitions, toolsByName } from "./tools.js";

try {
  process.loadEnvFile();
} catch {
  console.log(
    "Can't load the .env file. Make sure you have one, with MODEL_BASE_URL, MODEL_API_KEY and MODEL_NAME set",
  );
}

// Here we create the client, provided by the SDK.
// It works with any provider that follows OpenAI's API format, such as
// Azure Foundry or berget.ai. The base URL in .env decides which one.
// We could have done this using a fetch instead,
// but the SDK just provides a handy client
const client = new OpenAI({
  baseURL: process.env.MODEL_BASE_URL,
  apiKey: process.env.MODEL_API_KEY,
});

// The model to use, as the provider names it
const MODEL = process.env.MODEL_NAME ?? "";

// Safety cap so a confused model can't loop forever
const MAX_TOOL_ROUNDS = 3;

// What the browser sends us. The model API has no "system" field: a system
// prompt is the first message in "messages", with the role "system".
// We accept it as a field of its own, so it survives while you chat.
export type ChatRequest = Omit<
  OpenAI.ChatCompletionCreateParamsNonStreaming,
  "model"
> & { system?: string };
export type ChatResponse = OpenAI.ChatCompletion;

// This is where we call the API through the client.
//
// Right now we send the conversation once and return whatever comes back.
// If the model asks for a tool, the reply has finish_reason "tool_calls" and
// we hand that straight to the client without running anything.
export async function callModel(params: ChatRequest): Promise<ChatResponse> {
  const { system, ...rest } = params;
  const messages: OpenAI.ChatCompletionMessageParam[] = [...params.messages];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await client.chat.completions.create({
      ...rest,
      model: MODEL,
      messages: system
        ? [{ role: "system", content: system }, ...messages]
        : messages,
    });

    return response;
  }

  throw new Error(`Gave up after ${MAX_TOOL_ROUNDS} rounds of tool calls`);
}

// Runs one tool the model asked for and wraps the outcome as a "tool" message.
// A failing tool is reported back to the model, not thrown, so the model can recover.
// Nothing calls this until you add the tool loop to callModel.
export async function runTool(
  toolCall: OpenAI.ChatCompletionMessageToolCall,
): Promise<OpenAI.ChatCompletionToolMessageParam> {
  if (toolCall.type !== "function") {
    return {
      role: "tool",
      tool_call_id: toolCall.id,
      content: `Unsupported tool call type: ${toolCall.type}`,
    };
  }

  const { name, arguments: args } = toolCall.function;
  const tool = toolsByName.get(name);

  if (!tool) {
    return {
      role: "tool",
      tool_call_id: toolCall.id,
      content: `Unknown tool: ${name}`,
    };
  }

  try {
    console.log(`tool ${name}`, args);
    // The model sends its input as a JSON string, so we parse it first
    const content = await tool.run(JSON.parse(args || "{}"));
    return { role: "tool", tool_call_id: toolCall.id, content };
  } catch (error) {
    return {
      role: "tool",
      tool_call_id: toolCall.id,
      content: `Error: ${String(error)}`,
    };
  }
}
