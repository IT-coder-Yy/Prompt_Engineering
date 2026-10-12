import { ApiConfigForm } from "@/components/api-config-form";

export default function SetupPage() {
  return <div className="shell"><header className="page-head"><p className="eyebrow">API 配置</p><h1>连接你的模型</h1><p>填写 Base URL、Model 和 API Key，保存后即可在实验室使用 OpenAI-compatible API。</p></header><ApiConfigForm /></div>;
}
