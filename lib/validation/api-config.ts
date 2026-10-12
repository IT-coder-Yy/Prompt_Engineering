import { z } from "zod";

export const apiConfigSchema = z.object({
  baseUrl: z.string().trim().max(2000).url("请输入完整的 API 地址").refine((value) => {
    try {
      const url = new URL(value);
      return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password && !url.search && !url.hash;
    } catch { return false; }
  }, "地址需以 HTTP 或 HTTPS 开头，且不能包含账号、查询参数或锚点").transform((value) => value.replace(/\/+$/, "").replace(/\/chat\/completions$/, "")),
  model: z.string().trim().min(1, "请填写模型名称").max(200, "模型名称过长"),
  apiKey: z.string().trim().min(1, "请填写 API Key").max(2000, "API Key 过长").regex(/^[\x21-\x7e]+$/, "API Key 不能包含空格或换行"),
});

export type ApiConfig = z.infer<typeof apiConfigSchema>;
