import Anthropic from "@anthropic-ai/sdk";

// A tool has two halves:
// - definition: what the model sees (name, description, input schema)
// - run: the function we call when the model asks for this tool
//
// The model only ever answers with a tool name and an input object,
// so keeping both halves in one place makes the lookup trivial.
export type Tool = {
  definition: Anthropic.Tool;
  run: (input: unknown) => Promise<string>;
};

const getCurrentTime: Tool = {
  definition: {
    name: "get_current_time",
    description: "Get the current time as an ISO 8601 string",
    input_schema: { type: "object", properties: {} },
  },
  run: async () => new Date().toISOString(),
};

const getWeather: Tool = {
  definition: {
    name: "get_weather",
    description: "Get the current weather at a latitude/longitude coordinate",
    input_schema: {
      type: "object",
      properties: {
        latitude: { type: "number", description: "Latitude in decimal degrees" },
        longitude: { type: "number", description: "Longitude in decimal degrees" },
      },
      required: ["latitude", "longitude"],
    },
  },
  run: async (input) => {
    const { latitude, longitude } = input as {
      latitude: number;
      longitude: number;
    };
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${latitude}&longitude=${longitude}` +
      `&current=temperature_2m,weather_code`;
    const res = await fetch(url);
    return JSON.stringify(await res.json());
  },
};

export const tools: Tool[] = [getCurrentTime, getWeather];

// What we send to the model
export const toolDefinitions = tools.map((t) => t.definition);

// How we find the function to run, given the name the model answered with
export const toolsByName = new Map(tools.map((t) => [t.definition.name, t]));
