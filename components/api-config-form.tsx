"use client";

import { useState, useSyncExternalStore, type FormEvent } from "react";
import Link from "next/link";
import { apiConfigSchema, type ApiConfig } from "@/lib/validation/api-config";
import { parseStoredApiConfig, readApiConfigSnapshot, saveBrowserApiConfig, subscribeApiConfig } from "@/lib/browser-api-config";

const emptyConfig: ApiConfig = { baseUrl: "", model: "", apiKey: "" };
const serverSnapshot = () => null;

export function ApiConfigForm() {
  const snapshot = useSyncExternalStore(subscribeApiConfig, readApiConfigSnapshot, serverSnapshot);
  let saved: ApiConfig | null = null;
  let readError = "";
  try { saved = parseStoredApiConfig(snapshot); } catch (error) { readError = (error as Error).message; }
  const [draft, setDraft] = useState<ApiConfig | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const values = draft ?? saved ?? emptyConfig;

  function change(field: keyof ApiConfig, value: string) {
    setDraft({ ...values, [field]: value }); setMessage(""); setError("");
  }
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(""); setError("");
    const result = apiConfigSchema.safeParse(values);
    if (!result.success) { setError(result.error.issues[0].message); return; }
    try {
      saveBrowserApiConfig(result.data); setDraft(null); setShowKey(false);
      setMessage("已保存，实验室将使用这组配置。连接是否可用会在运行实验时验证。");
    } catch (error) { setError((error as Error).message); }
  }
  function clear() {
    try {
      saveBrowserApiConfig(null); setDraft(null); setShowKey(false); setError("");
      setMessage("已清除浏览器配置。实验室将使用服务器配置；服务器未配置时使用演示模式。");
    } catch (error) { setError((error as Error).message); }
  }

  return <section className="panel api-settings">
    <div className="api-settings-heading"><div><h2>你的模型连接</h2><p>保存后立即生效，无需重启。</p></div><span className="api-config-state">{draft ? "尚未保存" : saved ? "已保存到此浏览器" : "尚未配置"}</span></div>
    <form onSubmit={save}>
      <label htmlFor="api-base-url">Base URL</label>
      <input id="api-base-url" type="url" autoComplete="off" spellCheck={false} required maxLength={2000} placeholder="https://api.example.com/v1" value={values.baseUrl} onChange={(event) => change("baseUrl", event.target.value)} aria-describedby="base-url-hint" />
      <p className="field-hint" id="base-url-hint">填写服务商的公网接口根地址，例如 https://api.example.com/v1。</p>
      <label htmlFor="api-model">Model</label>
      <input id="api-model" autoComplete="off" spellCheck={false} required maxLength={200} placeholder="填写服务商提供的模型名称" value={values.model} onChange={(event) => change("model", event.target.value)} />
      <label htmlFor="api-key">API Key</label>
      <div className="api-key-field"><input id="api-key" type={showKey ? "text" : "password"} autoComplete="off" spellCheck={false} required maxLength={2000} placeholder="填写你的 API Key" value={values.apiKey} onChange={(event) => change("apiKey", event.target.value)} aria-describedby="api-storage-hint" /><button type="button" className="text-link" onClick={() => setShowKey(!showKey)} aria-pressed={showKey}>{showKey ? "隐藏密钥" : "显示密钥"}</button></div>
      <p className="field-hint" id="api-storage-hint">配置（含密钥）保存在当前浏览器，请勿在共用设备上保存。运行时通过本站转发给你填写的模型服务，不写入服务器配置文件。</p>
      {values.baseUrl.startsWith("http://") && <p className="notice">HTTP 会明文传输密钥与输入，建议使用服务商的 HTTPS 地址。</p>}
      {(error || readError) && <p className="notice" role="alert">{error || readError}</p>}
      {message && <p className="api-save-message" role="status">{message}</p>}
      <div className="actions"><button className="button" type="submit">保存配置</button>{snapshot !== null && <button className="button secondary" type="button" onClick={clear}>清除已保存配置</button>}<Link className="text-link" href="/playground">去实验室 →</Link></div>
    </form>
  </section>;
}
