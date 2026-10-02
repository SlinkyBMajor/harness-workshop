import type OpenAI from "openai";

// A tool has two halves:
// - definition: what the model sees (name, description, parameters)
// - run: the function we call when the model asks for this tool
export type Tool = {
  definition: OpenAI.FunctionDefinition;
  run: (input: unknown) => Promise<string>;
};

// ----- TOOLS GO HERE -----
// Eg: const getCurrentTime: Tool = { ... }


// ------------------------

export const tools: Tool[] = []; // Also add it here so it's exported

// What we send to the model. The API wants each definition wrapped as a
// "function" tool.
export const toolDefinitions: OpenAI.ChatCompletionTool[] = tools.map((t) => ({
  type: "function",
  function: t.definition,
}));

// How we find the function to run, given the name the model answered with
export const toolsByName = new Map(tools.map((t) => [t.definition.name, t]));
