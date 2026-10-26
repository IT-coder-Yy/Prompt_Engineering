"use client";

import { useState } from "react";
import { TextDiff } from "./text-diff";
import { inspectJson } from "@/lib/evaluation";
import { parameterChanges, resolvePrompt, type ExperimentDraft, type Side } from "@/lib/experiment";
import type { CompletionOutput } from "@/lib/llm/types";

export type Sample = { status: "pending" } | { status: "error"; error: string } | { status: "success"; result: CompletionOutput & { elapsedMs?: number } };
export type ExperimentRun = { id: number; draft: ExperimentDraft; a: Sample[]; b: Sample[] };

export function ExperimentResults({ run, stale, onRetry, retrying }: { run: ExperimentRun; stale: boolean; onRetry: (side: Side, index: number) => void; retrying: boolean }) {
  const [index, setIndex] = useState(0);
  const [view, setView] = useState<"diff" | "raw">("diff");
  const a = run.a[index], b = run.b[index];
  const completed = [...run.a, ...run.b].filter((item) => item.status !== "pending").length;
  const failures = [...run.a, ...run.b].filter((item) => item.status === "error").length;
  const bothReady = a.status === "success" && b.status === "success";
  const changes = parameterChanges(run.draft.a.parameters, run.draft.b.parameters);
  return <>
    <div className="workspace-heading">
      <div><p className="eyebrow">02 / 审阅结果</p><h2>先看哪里变了</h2><p className="field-hint">{run.draft.title} · 第 {run.id} 轮</p></div>
      <span className="run-status" role="status">{completed === run.a.length * 2 ? failures ? `已结束 · ${failures} 项失败` : "本轮已完成" : `已返回 ${completed} / ${run.a.length * 2}`}</span>
    </div>
    {stale && <p className="notice">草稿已修改，尚未重新运行。这里仍显示上一轮实际配置对应的结果。</p>}
    {[a, b].some((sample) => sample.status === "success" && sample.result.demo) && <p className="notice">当前包含预置演示结果，两组可能相同，不能据此判断模型效果。可先审阅本轮 Prompt 差异，或配置真实模型后重跑。</p>}
    <div className="results-toolbar">
      <div className="segmented-control" role="group" aria-label="结果视图">
        <button type="button" aria-pressed={view === "diff"} onClick={() => setView("diff")}>差异审阅</button>
        <button type="button" aria-pressed={view === "raw"} onClick={() => setView("raw")}>原始输出</button>
      </div>
      {run.a.length > 1 && <label className="sample-picker">采样配对<select value={index} onChange={(event) => setIndex(Number(event.target.value))}>{run.a.map((_, i) => <option key={i} value={i}>A{i + 1} / B{i + 1}</option>)}</select></label>}
    </div>
    {run.a.length > 1 && <p className="field-hint">按请求编号配对独立采样；单次差异不代表稳定改善，也不构成自我一致性聚合。</p>}
    <div className="result-columns">
      {(["a", "b"] as const).map((side) => {
        const sample = run[side][index];
        const result = sample.status === "success" ? sample.result : undefined;
        const json = result && run.draft.checkJson ? inspectJson(result.content, run.draft.expectedFields.split(/[,，\n]/).map((field) => field.trim()).filter(Boolean)) : null;
        return <section className="result-side" key={side} aria-label={side.toUpperCase() + " 运行状态"}>
          <h3>{side === "a" ? "对照组输出" : "实验组输出"}<span className="side-tag" aria-hidden="true">{side.toUpperCase()}</span></h3>
          {sample.status === "pending" && <p role="status">正在等待模型返回…</p>}
          {sample.status === "error" && <div><p className="notice" role="alert">{sample.error}</p><button className="button secondary small" disabled={retrying} onClick={() => onRetry(side, index)}>仅重试 {side.toUpperCase()} 第 {index + 1} 次</button></div>}
          {result && <>
            <p className="result-meta">{result.demo ? "预置演示" : result.model ?? "模型未提供"}</p>
            <dl className="result-metrics"><div><dt>耗时</dt><dd>{result.elapsedMs === undefined ? "未提供" : result.elapsedMs + " ms"}</dd></div><div><dt>Token</dt><dd>{result.usage?.totalTokens ?? "未提供"}</dd></div><div><dt>JSON 基准</dt><dd>{!json ? "未启用" : !json.valid ? "无法解析" : json.missing.length ? "缺少字段" : "通过格式检查"}</dd></div></dl>
            {json?.missing.length ? <p className="field-hint">缺少：{json.missing.join("、")}</p> : null}
            {(view === "raw" || !bothReady) && <pre className="raw-output">{result.content || "（空输出）"}</pre>}
          </>}
        </section>;
      })}
    </div>
    {view === "diff" && bothReady && <TextDiff a={a.result.content} b={b.result.content} label="输出差异" />}
    {view === "diff" && !bothReady && <p className="field-hint">两侧都成功返回后可审阅差异；已成功的输出会保留在上方。</p>}
    <details className="run-snapshot"><summary>查看本轮实际配置与 Prompt 差异</summary>
      <p className="field-hint">{changes.length ? changes.join("；") : "两组模型参数相同。"} 重试使用本轮配置，不使用当前草稿。</p>
      <details><summary>系统提示词与完整参数</summary><pre className="raw-output">{run.draft.system + "\n\nA 参数：" + JSON.stringify(run.draft.a.parameters, null, 2) + "\n\nB 参数：" + JSON.stringify(run.draft.b.parameters, null, 2)}</pre></details>
      <TextDiff a={resolvePrompt(run.draft, "a")} b={resolvePrompt(run.draft, "b")} label="本轮 Prompt 差异" />
    </details>
    <Evaluation key={JSON.stringify([index, a, b])} draft={run.draft} a={a} b={b} />
  </>;
}

function Evaluation({ draft, a, b }: { draft: ExperimentDraft; a: Sample; b: Sample }) {
  const [reviews, setReviews] = useState<Record<string, string>>({});
  const criteria = draft.criteria.split("\n").map((item) => item.trim()).filter(Boolean);
  return <section className="evaluation" aria-label="任务验收">
    <p className="eyebrow">03 / 检查任务要求</p><h2>变化之后，是否更符合任务？</h2>
    <p className="field-hint">格式检查由程序完成；事实与内容质量由你核验。以下标记仅保留在当前采样视图，重新运行或重试后重置。</p>
    {criteria.length ? <div className="evaluation-table"><div className="evaluation-row evaluation-head"><span>人工核验项</span><span>A · 对照</span><span>B · 实验</span></div>{criteria.map((criterion, index) => <div className="evaluation-row" key={index}>
      <span>{criterion}</span>{(["a", "b"] as const).map((side) => <label key={side}><span className="sr-only">{side.toUpperCase()}：{criterion}</span><select disabled={(side === "a" ? a : b).status !== "success"} value={reviews[side + index] ?? "pending"} onChange={(event) => setReviews({ ...reviews, [side + index]: event.target.value })}><option value="pending">待核验</option><option value="pass">通过</option><option value="fail">不通过</option></select></label>)}
    </div>)}</div> : <p className="empty">尚未设置人工验收项。可在配置区补充任务要求，再运行下一轮。</p>}
  </section>;
}
