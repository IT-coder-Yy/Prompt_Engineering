# Prompt 实战学习站

一个面向中文用户的提示词工程学习站，帮助初学者通过课程、业务场景和可运行实验掌握 Prompt 设计方法。

项目包含：

- 分阶段学习内容与提示词拆解，覆盖基础、核心技术、研究进阶、应用和评测，每课含练习与原文出处
- 12 个业务场景及可复制的 Prompt 模板
- 模板变量填写与预览
- Prompt、模型参数和提示技术的消融实验
- 共享材料驱动的 A/B 工作台，支持红绿差异审阅、独立请求状态与失败侧重试
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

打开站内 **API 配置** 页面，填写 Base URL、Model、API Key，点击 **保存配置** 即可在实验室使用，无需重启。配置（包括密钥）仅保存在当前浏览器的 localStorage 中，刷新后保留；可在页面修改或清除，请勿在共用设备上保存。保存会验证格式，实际连通性在运行实验时验证。

浏览器配置优先于服务器环境变量。运行时由本站服务器转发到指定的公网 API，不持久化到服务器；页面配置不允许访问内网、回环或云元数据地址，不自动跟随重定向。公网服务建议使用 HTTPS。

如需服务器默认配置，或连接本地/内网模型，仍可使用环境变量：

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

服务端会请求 `{Base URL}/chat/completions`。环境变量中的密钥不会回传给浏览器；两种配置方式均不会在错误提示中回显密钥。HTTP 会明文传输密钥和输入，仅适合受信任的网络。

未保存浏览器配置、且服务器的 API Key、Base URL 或 Model 未完整配置时，实验室自动使用明确标注的演示结果。超时变量可省略，默认为 30 秒。

## 使用实验室

默认从业务场景开始，也可点击 **空白实验** 自由填写 A/B。共享材料会填入两侧模板；修改材料会替换示例，未被模板引用的材料会附加到请求。手工编辑 Prompt 或参数后进入自定义模式，再载入预设需要明确确认替换。本页切换场景保留草稿，刷新后不保留这些编辑。

运行后先看 **差异审阅**：以 A 为基准，B 新增的行标绿、删除的行标红，未改变内容保留中性色，同时提供行号和 `+ / −` 标记。可只看差异、展开上下文或跳到下一处变化；手机使用合并视图。合法 JSON 默认格式化并排序对象键，数组顺序保持不变；可关闭格式化，或切换 **原始输出** 查看原文。红绿颜色不代表质量好坏。

两侧请求独立展示，单侧失败不清空成功结果。失败侧重试使用该轮的 Prompt、参数与浏览器连接；草稿或连接改动在下一轮运行时生效。每组可独立采样 1–3 次，按编号配对查看，不将单次差异视作稳定改进。JSON 自动检查与人工任务验收分开；空白实验不默认要求 JSON。预置演示结果可能相同，不能据此判断模型效果。

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
