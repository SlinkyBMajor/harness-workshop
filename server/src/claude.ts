import Anthropic from "@anthropic-ai/sdk";
import { toolDefinitions, toolsByName } from "./tools.js";

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

const MODEL = "claude-sonnet-4-6";

// Safety cap so a confused model can't loop forever
const MAX_TOOL_ROUNDS = 10;

export type ChatRequest = Anthropic.MessageCreateParamsNonStreaming;
export type ChatResponse = Anthropic.Message;

// This is where we call the API through the client.
//
// Right now we send the conversation once and return whatever comes back.
// If the model asks for a tool, the reply has stop_reason "tool_use" and we
// hand that straight to the client without running anything.
export async function callClaude(params: ChatRequest): Promise<ChatResponse> {
  const messages: Anthropic.MessageParam[] = [...params.messages];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await client.messages.create({
      ...params,
      model: MODEL,
      tools: toolDefinitions,
      messages,
    });

    return response; // <- Remove me once you comment the block below back in

    /* <- Remove me for tools

    // If the current turn is not a tool_use, return the response
    if (response.stop_reason !== "tool_use") {
      return response;
    }

    // Otherwise, find the tool_use blocks
    const toolUses = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
    );

    // Call the tools and collect the results
    const toolResults = await Promise.all(toolUses.map(runTool));

    // Put the model's request and our answers in the conversation, then go again
    messages.push({ role: "assistant", content: response.content });

    // Push the results of the tools to the conversation, so the model can see it
    messages.push({ role: "user", content: toolResults });

    Remove me -> */
  }

  throw new Error(`Gave up after ${MAX_TOOL_ROUNDS} rounds of tool calls`);
}

// Runs one tool the model asked for and wraps the outcome as a tool_result block.
// A failing tool is reported back to the model, not thrown, so the model can recover.
// Nothing calls this until you comment the block in callClaude back in.
export async function runTool(
  toolUse: Anthropic.ToolUseBlock,
): Promise<Anthropic.ToolResultBlockParam> {
  const tool = toolsByName.get(toolUse.name);

  if (!tool) {
    return {
      type: "tool_result",
      tool_use_id: toolUse.id,
      content: `Unknown tool: ${toolUse.name}`,
      is_error: true,
    };
  }

  try {
    console.log(`tool ${toolUse.name}`, JSON.stringify(toolUse.input));
    const content = await tool.run(toolUse.input);
    return { type: "tool_result", tool_use_id: toolUse.id, content };
  } catch (error) {
    return {
      type: "tool_result",
      tool_use_id: toolUse.id,
      content: String(error),
      is_error: true,
    };
  }
}
