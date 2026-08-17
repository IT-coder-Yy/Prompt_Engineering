# Prompt 实战学习站

一个面向中文用户的提示词工程学习站，帮助初学者通过课程、业务场景和可运行实验掌握 Prompt 设计方法。

项目包含：

- 分阶段学习内容与提示词拆解
- 12 个业务场景及可复制的 Prompt 模板
- 模板变量填写与预览
- Prompt、模型参数和提示技术的消融实验
- OpenAI-compatible Chat Completions 接口调用
- 无 API Key 时可直接使用的预置演示模式

## 快速开始

环境要求：Node.js 20+、npm。

```bash
npm install
npm run dev
```

启动后访问 <http://localhost:3000>。

## 配置真实模型接口

复制环境变量示例，并仅在本机填写配置：

```bash
cp .env.example .env.local
```

`.env.local` 支持以下变量：

| 变量 | 说明 |
| --- | --- |
| `LLM_API_KEY` | 上游模型服务的 API Key |
| `LLM_BASE_URL` | OpenAI-compatible 服务地址 |
| `LLM_MODEL` | 模型名称 |
| `LLM_TIMEOUT_MS` | 请求超时时间，默认 `30000` 毫秒 |

服务端会请求 `{LLM_BASE_URL}/chat/completions`。密钥只在服务端读取，不会发送到浏览器或写入错误响应。生产环境建议使用 HTTPS；远程 HTTP 只适合受信任的内网服务。

未完整配置上述变量时，实验室会自动使用明确标注的演示结果，不影响课程和场景浏览。

## 常用命令

```bash
npm run dev       # 启动开发服务器
npm run lint      # ESLint 检查
npm run typecheck # TypeScript 类型检查
npm run test      # Vitest 单元测试
npm run test:e2e  # Playwright 端到端测试
npm run build     # 生产构建
```

首次运行端到端测试时，如本机尚未安装浏览器，请执行：

```bash
npx playwright install
```

## 项目结构

```text
app/             页面、布局、样式与 API Route
components/      可复用 UI 组件
lib/content.ts   课程、场景和模板内容
lib/llm/         LLM 配置、客户端和类型
tests/            单元测试与端到端测试
docs/             内容维护与 API 兼容性说明
```

## 内容与接口扩展

- 课程、业务场景和模板：编辑 [`lib/content.ts`](lib/content.ts)。
- LLM 请求适配：集中维护于 [`lib/llm/client.ts`](lib/llm/client.ts)。
- 内容维护规范：参见 [`docs/content-guide.md`](docs/content-guide.md)。
- API 能力和限制：参见 [`docs/api-compatibility.md`](docs/api-compatibility.md)。

## 安全提示

- 不要提交 `.env.local` 或任何包含真实 API Key 的文件。
- `artifacts/` 下的实验结果属于本地中间产物，默认不纳入版本控制。
- `.docx` 文档和常见构建、测试产物已加入 `.gitignore`。
