"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { scenarios, templateCategories } from "@/lib/content";

export function ScenarioBrowser() {
  const [category, setCategory] = useState("全部"); const [query, setQuery] = useState("");
  const visible = useMemo(() => scenarios.filter((s) => (category === "全部" || s.category === category) && `${s.title}${s.goal}${s.category}`.toLowerCase().includes(query.toLowerCase())), [category, query]);
  return <><div className="filter-bar"><div className="chips" role="group" aria-label="场景类别">{templateCategories.map((item) => <button className={item === category ? "chip active" : "chip"} onClick={() => setCategory(item)} key={item}>{item}</button>)}</div><input aria-label="搜索场景" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索任务、业务类别…" /></div>
    <div className="scenario-grid">{visible.map((scenario) => <article className="scenario-card" key={scenario.slug}><span className="icon">{scenario.emoji}</span><p className="eyebrow">{scenario.category}</p><h3>{scenario.title}</h3><p>{scenario.goal}</p><Link href={`/scenarios/${scenario.slug}`}>查看案例 →</Link></article>)}</div>
    {visible.length === 0 && <p className="empty">没有匹配的案例。试试更少关键词，或切换到“全部”。</p>}</>;
}
