"use client";

import { useId, useMemo, useRef, useState } from "react";
import { compareText, normalizedJsonPair, type DiffLine } from "@/lib/text-diff";

export function TextDiff({ a, b, label = "内容差异" }: { a: string; b: string; label?: string }) {
  // 文本变化时重置定位，避免保留指向上一轮输出的变化序号。
  return <DiffView key={JSON.stringify([a, b])} a={a} b={b} label={label} />;
}

function DiffView({ a, b, label }: { a: string; b: string; label: string }) {
  const [formatJson, setFormatJson] = useState(true);
  const [onlyChanges, setOnlyChanges] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [current, setCurrent] = useState(-1);
  const root = useRef<HTMLDivElement>(null);
  const id = useId();
  const normalized = useMemo(() => normalizedJsonPair(a, b), [a, b]);
  const diff = useMemo(() => compareText(...(formatJson && normalized ? normalized : [a, b] as [string, string])), [a, b, formatJson, normalized]);
  const starts = diff.rows.flatMap((row, index) => row.changed && (index === 0 || !diff.rows[index - 1].changed) ? [index] : []);
  const nearby = new Set<number>();
  diff.rows.forEach((row, index) => { if (row.changed) for (let offset = -3; offset <= 3; offset++) nearby.add(index + offset); });

  function navigate(direction: number) {
    const next = current < 0 ? (direction > 0 ? 0 : starts.length - 1) : (current + direction + starts.length) % starts.length;
    setCurrent(next);
    const element = root.current?.querySelector<HTMLElement>(`[data-diff-row="${starts[next]}"]`);
    element?.focus({ preventScroll: true }); element?.scrollIntoView({ block: "center", behavior: "instant" });
  }
  function line(value: DiffLine | undefined, side: "a" | "b", changed: boolean) {
    if (!value) return <div className="diff-cell diff-placeholder" aria-hidden="true" />;
    const sign = changed ? side === "a" ? "−" : "+" : " ";
    return <div className={`diff-cell ${changed ? side === "a" ? "diff-removed" : "diff-added" : "diff-unchanged"}`}>
      <span className="diff-line-number" aria-label={`${side.toUpperCase()} 第 ${value.number} 行`}>{value.number}</span>
      <span className="diff-sign" aria-label={changed ? side === "a" ? "删除" : "新增" : "未改变"}>{sign}</span>
      <code>{value.text.replace(/\n$/, "")}{!value.text.endsWith("\n") && <span className="diff-eof" title="本行末尾无换行"> ⏎</span>}</code>
    </div>;
  }

  return <div className="text-diff" ref={root} role="region" aria-label={label}>
    <div className="diff-toolbar">
      <span className="diff-count"><b>+{diff.additions}</b> <b>−{diff.deletions}</b><span> 行 · {starts.length} 处变化</span></span>
      <div className="diff-actions">
        <button type="button" className="quiet-button" disabled={!starts.length} onClick={() => navigate(-1)} aria-label={label + "：上一处变化"}>↑ 上一处</button>
        <button type="button" className="quiet-button" disabled={!starts.length} onClick={() => navigate(1)} aria-label={label + "：下一处变化"}>↓ 下一处</button>
      </div>
    </div>
    <div className="diff-options">
      <label><input type="checkbox" checked={onlyChanges} onChange={(event) => setOnlyChanges(event.target.checked)} />只看差异</label>
      <label><input type="checkbox" checked={showAll} disabled={onlyChanges} onChange={(event) => setShowAll(event.target.checked)} />展开未变内容</label>
      {normalized && <label><input type="checkbox" checked={formatJson} onChange={(event) => { setFormatJson(event.target.checked); setCurrent(-1); }} />格式化 JSON</label>}
    </div>
    <p className="diff-caption" id={id}>A 为基准 · 红色 − 为删除，绿色 + 为新增；颜色不代表好坏。{normalized && formatJson && " 对象键已排序，数组顺序不变。"}</p>
    {diff.simplified && <p className="notice">文本差异过大，已按整段替换展示；可切换原始输出完整阅读。</p>}
    {!starts.length && <p className="diff-identical">{formatJson && normalized ? "格式化后的 JSON 内容相同。" : "两侧内容完全相同。"}</p>}
    <div className="diff-head" aria-hidden="true"><span>A · 对照</span><span>B · 实验</span></div>
    <div className="diff-body" aria-describedby={id}>
      {diff.rows.map((row, index) => {
        const visible = row.changed || (!onlyChanges && (showAll || nearby.has(index) || !starts.length));
        if (!visible) {
          const prior = diff.rows[index - 1];
          const priorVisible = !prior || prior.changed || (!onlyChanges && (showAll || nearby.has(index - 1)));
          return priorVisible && !onlyChanges ? <button className="diff-fold" type="button" key={index} onClick={() => setShowAll(true)}>··· 展开未改变的内容</button> : null;
        }
        return <div className={`diff-row ${row.changed ? "diff-changed-row" : "diff-equal-row"}`} data-diff-row={index} tabIndex={row.changed ? -1 : undefined} key={index}>
          {line(row.a, "a", row.changed)}{line(row.b, "b", row.changed)}
        </div>;
      })}
    </div>
  </div>;
}
