import Anthropic from "@anthropic-ai/sdk";

// A tool has two halves:
// - definition: what the model sees (name, description, input schema)
// - run: the function we call when the model asks for this tool
export type Tool = {
  definition: Anthropic.Tool;
  run: (input: unknown) => Promise<string>;
};

// ----- TOOLS GO HERE -----
// Eg: const getCurrentTime: Tool = { ... }


// ------------------------

export const tools: Tool[] = []; // Also add it here so it's exported

// What we send to the model
export const toolDefinitions = tools.map((t) => t.definition);

// How we find the function to run, given the name the model answered with
export const toolsByName = new Map(tools.map((t) => [t.definition.name, t]));
