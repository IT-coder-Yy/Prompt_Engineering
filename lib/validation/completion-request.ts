import { z } from "zod";
export const completionRequestSchema = z.object({
  system: z.string().trim().min(1, "请填写系统说明").max(4000),
  prompt: z.string().trim().min(1, "请填写 Prompt").max(16000),
  temperature: z.number().min(0).max(2).optional().default(0.3),
  topP: z.number().min(0).max(1).optional(),
  maxTokens: z.number().int().min(32).max(4096).optional().default(800),
  stop: z.array(z.string().trim().min(1).max(80)).max(4).optional(),
  frequencyPenalty: z.number().min(-2).max(2).optional(),
  presencePenalty: z.number().min(-2).max(2).optional()
});
