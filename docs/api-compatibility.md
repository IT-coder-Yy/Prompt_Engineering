# API 兼容能力

首版实现以 OpenAI-compatible Chat Completions 为基线：`POST {LLM_BASE_URL}/chat/completions`，请求含 `model`、`messages`、`temperature` 和 `max_tokens`。上游地址只允许由服务端环境变量指定，支持 HTTP 和 HTTPS；远程 HTTP 会明文传输 API Key 与输入，仅应连接受信任内网服务。

已实现：非流式文本响应、服务端密钥读取、请求长度与参数校验、超时取消、上游错误归一化、可选 usage 展示、无配置演示模式。

未在无真实配置条件下验证：具体供应商、模型名、结构化输出、流式响应、工具调用及不同参数字段。提供 `.env.local` 后，应依次验证正常请求、system/user 消息、输出 Token、鉴权失败、限流与上游 5xx；不要记录或提交真实密钥。
