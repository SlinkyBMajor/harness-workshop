function getCurrentTime(): string {
  return new Date().toISOString();
}

export const tools = {
  get_current_time: getCurrentTime,
} as const;
