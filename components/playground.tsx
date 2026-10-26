"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import { findScenario, scenarios } from "@/lib/content";
import { readBrowserApiConfig, parseStoredApiConfig, readApiConfigSnapshot, subscribeApiConfig } from "@/lib/browser-api-config";
import { completionInput, createDraft, draftError, generateDesign, parameterChanges, resolvePrompt, selectedTechniques, techniques, type ExperimentDraft, type ExperimentMode, type Parameters, type Side, type Variant } from "@/lib/experiment";
import { ExperimentResults, type ExperimentRun, type Sample } from "./experiment-results";
import { TextDiff } from "./text-diff";

function storedDraft(slug: string, preset?: string) {
  const scenario = findScenario(slug);
  let values = scenario?.sampleInput;
  if (scenario && typeof window !== "undefined") try {
    const stored: unknown = JSON.parse(window.sessionStorage.getItem("playground-input:" + slug) ?? "null");
    if (stored && typeof stored === "object" && !Array.isArray(stored) && Object.values(stored).every((value) => typeof value === "string")) values = { ...values, ...stored };
  } catch { /* 浏览器存储不可用时仍可使用示例。 */ }
  return createDraft(slug, preset, values);
}

export function Playground() {
  const search = useSearchParams();
  const slug = search.get("scenario") ?? scenarios[0].slug;
  return <Workspace key={search.toString()} initialSlug={slug === "__custom__" || findScenario(slug) ? slug : scenarios[0].slug} initialPreset={search.get("experiment") ?? undefined} />;
}

function Workspace({ initialSlug, initialPreset }: { initialSlug: string; initialPreset?: string }) {
  const [draft, setDraft] = useState(() => storedDraft(initialSlug, initialPreset));
  const [pending, setPending] = useState<ExperimentDraft | null>(null);
  const [run, setRun] = useState<ExperimentRun | null>(null);
  const [error, setError] = useState("");
  const [panel, setPanel] = useState<"config" | "results">("config");
  const sequence = useRef(0);
  const drafts = useRef(new Map<string, ExperimentDraft>());
  const connection = useRef<ReturnType<typeof readBrowserApiConfig>>(null);
  const controllers = useRef<AbortController[]>([]);
  const configRef = useRef<HTMLElement>(null);
  const resultsRef = useRef<HTMLElement>(null);
  useEffect(() => () => { controllers.current.forEach((controller) => controller.abort()); }, []);

  const scenario = findScenario(draft.scenarioSlug);
  const enabled = selectedTechniques(draft);
  const busy = Boolean(run && [...run.a, ...run.b].some((sample) => sample.status === "pending"));
  const stale = Boolean(run && JSON.stringify(run.draft) !== JSON.stringify(draft));
  const changes = parameterChanges(draft.a.parameters, draft.b.parameters);

  function update(patch: Partial<ExperimentDraft>) { setDraft((current) => ({ ...current, ...patch })); setPending(null); setError(""); }
  function apply(next: ExperimentDraft) { setDraft(next); setPending(null); setError(""); }
  function replaceDesign(next: ExperimentDraft) {
    if (draft.mode === "manual" && (draft.a.prompt.trim() || draft.b.prompt.trim())) setPending(next);
    else apply(next);
  }
  function changeDesign(patch: Partial<ExperimentDraft>) { replaceDesign(generateDesign({ ...draft, ...patch })); }
  function selectScenario(slug: string) {
    drafts.current.set(draft.scenarioSlug, draft);
    const saved = drafts.current.get(slug);
    replaceDesign(saved ?? { ...storedDraft(slug), system: draft.system, sampleCount: draft.sampleCount });
  }
  function edit(side: Side, variant: Variant) {
    update({ [side]: variant, mode: "manual", title: "自定义 A/B 对比", notice: "已进入手工编辑；运行前查看 Prompt 与参数差异，确认变化符合你的实验目的。" });
  }
  function showPanel(next: "config" | "results") {
    setPanel(next);
    requestAnimationFrame(() => (next === "config" ? configRef : resultsRef).current?.scrollIntoView({ block: "start", behavior: "instant" }));
  }
  function updateSample(id: number, side: Side, index: number, sample: Sample) {
    setRun((current) => current?.id === id ? { ...current, [side]: current[side].map((item, i) => i === index ? sample : item) } : current);
  }
  async function requestSample(id: number, snapshot: ExperimentDraft, side: Side, index: number) {
    const controller = new AbortController(); controllers.current.push(controller);
    try {
      const response = await fetch("/api/completions", { method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...completionInput(snapshot, side), connection: connection.current ?? undefined }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "模型请求失败，请重试。");
      if (typeof body.content !== "string") throw new Error("模型返回了无法识别的结果，请重试。");
      updateSample(id, side, index, { status: "success", result: body });
    } catch (caught) {
      if (!controller.signal.aborted) updateSample(id, side, index, { status: "error", error: caught instanceof Error ? caught.message : "请求失败，请检查连接后重试。" });
    }
  }
  function runExperiment() {
    if (busy || pending) return;
    const invalid = draftError(draft);
    if (invalid) { setError(invalid); showPanel("config"); return; }
    try { connection.current = readBrowserApiConfig(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "无法读取 API 配置。"); return; }
    const snapshot = structuredClone(draft), id = ++sequence.current;
    controllers.current = []; setError("");
    setRun({ id, draft: snapshot, a: Array.from({ length: snapshot.sampleCount }, () => ({ status: "pending" })), b: Array.from({ length: snapshot.sampleCount }, () => ({ status: "pending" })) });
    showPanel("results");
    for (const side of ["a", "b"] as const) for (let index = 0; index < snapshot.sampleCount; index++) void requestSample(id, snapshot, side, index);
  }
  function retry(side: Side, index: number) {
    if (!run || busy || run[side][index].status !== "error") return;
    updateSample(run.id, side, index, { status: "pending" });
    void requestSample(run.id, run.draft, side, index);
  }

  return <div className="experiment-workspace">
    <div className="experiment-actionbar">
      <div className="segmented-control" role="group" aria-label="实验工作区">
        <button aria-pressed={panel === "config"} onClick={() => showPanel("config")}>配置实验</button>
        <button aria-pressed={panel === "results"} aria-label={"查看结果" + (run ? busy ? " · 运行中" : " · 已返回" : "")} onClick={() => showPanel("results")}>查看结果<span className="workspace-progress" aria-hidden="true">{run ? busy ? " · 运行中" : " · 已返回" : ""}</span></button>
      </div>
      <span className="call-count">A / B 各 {draft.sampleCount} 次 · 共 {draft.sampleCount * 2} 次调用</span>
      <button className="button run-button" disabled={busy || Boolean(pending)} onClick={runExperiment} aria-label={busy ? "模型运行中" : `运行本轮实验（调用模型 ${draft.sampleCount * 2} 次）`}>{busy ? "模型运行中…" : `运行 · ${draft.sampleCount * 2} 次调用`}</button>
    </div>
    <ConnectionStatus />
    {error && <p className="notice" role="alert">{error}</p>}
    {pending && <section className="pending-design" aria-label="确认替换手工编辑"><p><b>将载入“{pending.title}”</b>，并替换当前手工编辑的 Prompt。当前内容还未改变。</p><div className="diff-actions"><button className="button small" onClick={() => apply(pending)}>应用并替换</button><button className="button secondary small" onClick={() => setPending(null)}>保留当前编辑</button></div></section>}

    <section ref={configRef} id="experiment-config" className={`workspace-section ${panel !== "config" ? "is-hidden" : ""}`} aria-label="实验配置">
      <div className="workspace-heading"><div><p className="eyebrow">01 / 准备实验</p><h2>同一份材料，两种方案</h2></div><button className="button secondary small" onClick={() => selectScenario("__custom__")}>空白实验 ＋</button></div>
      <div className="experiment-setup-grid">
        <section className="panel material-panel">
          <label>业务场景<select value={draft.scenarioSlug} onChange={(event) => selectScenario(event.target.value)}><option value="__custom__">自定义 · 从空白开始</option>{scenarios.map((item) => <option value={item.slug} key={item.slug}>{item.category} · {item.title}</option>)}</select></label>
          <h3>共享任务与材料</h3><p className="field-hint">两组使用同一份材料。切换场景会保留本页草稿。</p>
          {scenario ? scenario.variables.map((variable) => <label key={variable.key}>{variable.label}{variable.required ? "（必填）" : ""}<textarea value={draft.values[variable.key] ?? ""} onChange={(event) => update({ values: { ...draft.values, [variable.key]: event.target.value } })} placeholder={variable.example} /></label>) : <label>用户任务 / 问题 / 材料<textarea value={draft.task} onChange={(event) => update({ task: event.target.value })} placeholder="输入两组共同处理的任务或材料；两侧 Prompt 只写处理方式。" /></label>}
          <details className="advanced-settings" open={!scenario || undefined}><summary>系统提示词与采样</summary>
            <label>系统提示词<textarea value={draft.system} onChange={(event) => update({ system: event.target.value })} /></label>
            <label>每组独立采样次数<select value={draft.sampleCount} onChange={(event) => update({ sampleCount: Number(event.target.value) })}>{[1, 2, 3].map((count) => <option key={count} value={count}>{count} 次（共 {count * 2} 次调用）</option>)}</select></label>
          </details>
        </section>
        <section className="panel design-panel">
          <label>实验模式<select value={draft.mode} onChange={(event) => changeDesign({ mode: event.target.value as ExperimentMode, ...(event.target.value === "manual" ? { title: "自定义 A/B 对比", notice: "自由编辑两种写法，运行前检查实际差异。" } : {}) })}>{scenario && <option value="preset">场景预设实验</option>}<option value="single">单项提示技术</option><option value="combo">提示技术组合</option><option value="manual">手工编辑 A/B</option></select></label>
          {draft.mode === "preset" && <label>预设实验<select value={draft.presetId} onChange={(event) => changeDesign({ presetId: event.target.value })}>{scenario?.experiments.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>}
          {draft.mode === "single" && <label>提示技术<select value={draft.technique} onChange={(event) => changeDesign({ technique: event.target.value })}>{techniques.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>}
          {draft.mode === "combo" && <div className="technique-options">{techniques.map((item) => <label key={item.id}><input type="checkbox" checked={draft.combo.includes(item.id)} onChange={(event) => changeDesign({ combo: event.target.checked ? [...draft.combo, item.id] : draft.combo.filter((id) => id !== item.id) })} />{item.title}</label>)}</div>}
          {enabled.includes("few-shot") && <label>少样本示例<textarea value={draft.examples} onChange={(event) => changeDesign({ examples: event.target.value })} placeholder="填写与当前任务相关的输入—输出示例。" /></label>}
          {enabled.includes("directional") && <label>方向关键词<input value={draft.direction} onChange={(event) => changeDesign({ direction: event.target.value })} /></label>}
          {enabled.includes("structured") && <label>结构化字段<input value={draft.fields} onChange={(event) => changeDesign({ fields: event.target.value })} /></label>}
          <div className="experiment-note"><span className="eyebrow">本轮改变什么</span><h3>{draft.title}</h3><p>{draft.notice}</p></div>
          <details className="advanced-settings"><summary>任务验收要求</summary><label>人工验收项（每行一项）<textarea value={draft.criteria} onChange={(event) => update({ criteria: event.target.value })} placeholder="例如：保留全部明确日期；不编造负责人。" /></label><label className="checkbox-label"><input type="checkbox" checked={draft.checkJson} onChange={(event) => update({ checkJson: event.target.checked })} />启用共同 JSON 格式基准</label>{draft.checkJson && <label>必需的顶层字段（逗号分隔）<input value={draft.expectedFields} onChange={(event) => update({ expectedFields: event.target.value })} placeholder="留空时只检查 JSON 是否可解析" /></label>}<p className="field-hint">验收条件不修改 Prompt。格式通过不代表事实正确；也可专门比较指定格式前后的效果。</p></details>
        </section>
      </div>

      <section className="panel prompt-workspace" aria-label="A/B Prompt 编辑">
        <div className="workspace-heading"><div><h2>A / B Prompt</h2><p className="field-hint">{scenario ? "模板中的 {{变量}} 会在运行时填入共享材料；下方可预览完整请求。" : "两侧只填写处理指令，共享材料会自动附加到两组。"}</p></div><span className="run-status">{draft.mode === "manual" ? "手工编辑" : "配置已应用"}</span></div>
        <div className="variant-grid"><VariantEditor side="a" variant={draft.a} onChange={(value) => edit("a", value)} /><VariantEditor side="b" variant={draft.b} onChange={(value) => edit("b", value)} /></div>
        <div className="parameter-summary"><b>参数差异</b><span>{changes.length ? changes.join("；") : "两组参数相同"}</span></div>
        <details className="prompt-review"><summary>审阅完整 Prompt 差异</summary><TextDiff a={resolvePrompt(draft, "a")} b={resolvePrompt(draft, "b")} label="草稿 Prompt 差异" /></details>
      </section>
    </section>

    <section ref={resultsRef} id="experiment-results" className={`panel workspace-section experiment-results ${panel !== "results" ? "is-hidden" : ""}`} aria-label="实验结果">
      {run ? <ExperimentResults key={run.id} run={run} stale={stale} onRetry={retry} retrying={busy} /> : <div className="results-empty"><p className="eyebrow">02 / 审阅结果</p><h2>等待第一轮实验</h2><p>运行后先用红绿差异查看内容变化，再逐项检查任务要求。</p><div className="diff-legend"><span>− A 删除的内容</span><span>+ B 新增的内容</span><span>未变内容保持中性色</span></div></div>}
    </section>
  </div>;
}

function ConnectionStatus() {
  const raw = useSyncExternalStore(subscribeApiConfig, readApiConfigSnapshot, () => null);
  let label = "服务器默认连接 · 模型或演示状态将在结果中显示";
  try { const config = parseStoredApiConfig(raw); if (config) label = "浏览器连接 · " + config.model; }
  catch { label = "浏览器配置无法读取，请重新配置"; }
  return <p className="connection-status">{label}<Link href="/setup">API 配置 ↗</Link></p>;
}

function VariantEditor({ side, variant, onChange }: { side: Side; variant: Variant; onChange: (value: Variant) => void }) {
  const parameters = variant.parameters;
  const optionalNumber = (value: string) => value === "" ? undefined : Number(value);
  function setParameter(patch: Partial<Parameters>) { onChange({ ...variant, parameters: { ...parameters, ...patch } }); }
  return <section className="variant-editor" aria-label={side.toUpperCase() + " 组编辑"}>
    <h3><span className="side-tag">{side.toUpperCase()}</span>{side === "a" ? "对照组 · 作为基准" : "实验组 · 尝试改进"}</h3>
    <label>{side.toUpperCase()} Prompt<textarea value={variant.prompt} onChange={(event) => onChange({ ...variant, prompt: event.target.value })} placeholder={side === "a" ? "填写基础写法…" : "填写你要比较的新写法…"} /></label>
    <details className="parameter-details"><summary>模型参数</summary><div className="parameter-grid">
      <label>Temperature<input type="number" min="0" max="2" step="0.1" value={parameters.temperature} onChange={(event) => setParameter({ temperature: Number(event.target.value) })} /></label>
      <label>Top_p<input type="number" min="0" max="1" step="0.05" value={parameters.topP ?? ""} onChange={(event) => setParameter({ topP: optionalNumber(event.target.value) })} placeholder="服务默认" /></label>
      <label>Max Length / 输出 Token<input type="number" min="32" max="4096" step="32" value={parameters.maxTokens} onChange={(event) => setParameter({ maxTokens: Number(event.target.value) })} /></label>
      <label>Frequency Penalty<input type="number" min="-2" max="2" step="0.1" value={parameters.frequencyPenalty ?? ""} onChange={(event) => setParameter({ frequencyPenalty: optionalNumber(event.target.value) })} placeholder="服务默认" /></label>
      <label>Presence Penalty<input type="number" min="-2" max="2" step="0.1" value={parameters.presencePenalty ?? ""} onChange={(event) => setParameter({ presencePenalty: optionalNumber(event.target.value) })} placeholder="服务默认" /></label>
    </div><label>Stop Sequences（每行或逗号一个）<textarea value={parameters.stopText} onChange={(event) => setParameter({ stopText: event.target.value })} placeholder="最多 4 个，留空不设置" /></label><p className="field-hint">可选参数留空时使用服务默认值；支持范围由上游模型决定。</p></details>
  </section>;
}
