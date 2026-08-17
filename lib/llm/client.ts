import { llmConfig } from "./config";
import { CompletionInput, CompletionOutput, LlmError } from "./types";

export async function complete(input: CompletionInput): Promise<CompletionOutput> {
  const config = llmConfig();
  if (!config) return { demo: true, model: "演示模式", content: JSON.stringify({ summary: "这是预置演示结果，不是实时模型输出。", key_points: ["已收到你的 Prompt 与输入", "配置 LLM_* 环境变量后可发起真实请求"], missing_information: ["请在 .env.local 中配置兼容 API"], observation_note: "比较两组的格式、字段、耗时与 Token 用量，理解本轮唯一改变的变量。" }, null, 2) };
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), config.timeout);
  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, { method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.key}` }, body: JSON.stringify({
      model: config.model,
      messages: [{ role: "system", content: input.system }, { role: "user", content: input.prompt }],
      temperature: input.temperature,
      top_p: input.topP,
      max_tokens: input.maxTokens,
      stop: input.stop?.length ? input.stop : undefined,
      frequency_penalty: input.frequencyPenalty,
      presence_penalty: input.presencePenalty
    }) });
    const body = await response.json().catch(() => null) as { choices?: { message?: { content?: string } }[]; usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }; error?: { message?: string } } | null;
    if (!response.ok) throw new LlmError(`UPSTREAM_${response.status}`, body?.error?.message || "上游模型服务返回错误", response.status === 401 ? 401 : 502);
    const content = body?.choices?.[0]?.message?.content;
    if (!content) throw new LlmError("MALFORMED_RESPONSE", "上游服务未返回可用文本。");
    return { content, demo: false, model: config.model, usage: body?.usage ? { promptTokens: body.usage.prompt_tokens, completionTokens: body.usage.completion_tokens, totalTokens: body.usage.total_tokens } : undefined };
  } catch (error) {
    if (error instanceof LlmError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") throw new LlmError("TIMEOUT", "请求超时，请缩短输入或稍后重试。", 504);
    throw new LlmError("NETWORK_ERROR", "无法连接模型服务，请检查服务地址和网络。", 502);
  } finally { clearTimeout(timer); }
}
