import { llmConfig } from "./config";
import { CompletionInput, CompletionOutput, LlmError } from "./types";
import { type ApiConfig } from "../validation/api-config";
import { publicApiRequest } from "./public-api-request";

export async function complete(input: CompletionInput, connection?: ApiConfig): Promise<CompletionOutput> {
  const config = connection ? { key: connection.apiKey, baseUrl: connection.baseUrl, model: connection.model, timeout: 30000 } : llmConfig();
  if (!config) return { demo: true, model: "演示模式", content: JSON.stringify({ summary: "这是预置演示结果，不是实时模型输出。", key_points: ["已收到你的 Prompt 与输入", "在 API 配置页保存连接后可发起真实请求"], missing_information: ["请在 API 配置页填写 Base URL、Model 和 API Key"], observation_note: "比较两组的格式、字段、耗时与 Token 用量，理解本轮唯一改变的变量。" }, null, 2) };
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), config.timeout);
  try {
    const payload = JSON.stringify({
      model: config.model,
      messages: [{ role: "system", content: input.system }, { role: "user", content: input.prompt }],
      temperature: input.temperature,
      top_p: input.topP,
      max_tokens: input.maxTokens,
      stop: input.stop?.length ? input.stop : undefined,
      frequency_penalty: input.frequencyPenalty,
      presence_penalty: input.presencePenalty
    });
    const url = new URL(`${config.baseUrl}/chat/completions`);
    const response = connection ? await publicApiRequest(url, payload, config.key, controller.signal) : await fetch(url, { method: "POST", signal: controller.signal, redirect: "error", cache: "no-store", headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.key}` }, body: payload });
    const body = await response.json().catch(() => null) as { choices?: { message?: { content?: string } }[]; usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }; error?: { message?: string } } | null;
    if (!response.ok) {
      const hint = response.status === 401 || response.status === 403 ? "鉴权失败，请检查 API Key。" : response.status === 429 ? "请求限流或额度不足，请检查服务商配额。" : response.status >= 300 && response.status < 400 ? "接口返回重定向，请填写最终的 Base URL。" : "请检查 Base URL、模型名称和参数，或稍后重试。";
      throw new LlmError(`UPSTREAM_${response.status}`, `模型服务返回 ${response.status}：${hint}`, response.status === 401 ? 401 : 502);
    }
    const content = body?.choices?.[0]?.message?.content;
    if (!content) throw new LlmError("MALFORMED_RESPONSE", "上游服务未返回可用文本。");
    return { content, demo: false, model: config.model, usage: body?.usage ? { promptTokens: body.usage.prompt_tokens, completionTokens: body.usage.completion_tokens, totalTokens: body.usage.total_tokens } : undefined };
  } catch (error) {
    if (error instanceof LlmError) throw error;
    if (controller.signal.aborted) throw new LlmError("TIMEOUT", "请求超时，请缩短输入或稍后重试。", 504);
    throw new LlmError("NETWORK_ERROR", "无法连接模型服务，请检查服务地址和网络。", 502);
  } finally { clearTimeout(timer); }
}
