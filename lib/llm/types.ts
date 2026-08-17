export type CompletionInput = {
  system: string;
  prompt: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  stop?: string[];
  frequencyPenalty?: number;
  presencePenalty?: number;
};
export type CompletionOutput = { content: string; usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number }; model?: string; demo: boolean };
export class LlmError extends Error { constructor(public code: string, message: string, public status = 502) { super(message); } }
