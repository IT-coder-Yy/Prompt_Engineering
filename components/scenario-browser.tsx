"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import Search from "reicon-react/icons/Search";
import { scenarios, templateCategories } from "@/lib/content";
import { CategoryIcon } from "@/components/category-icon";

export function ScenarioBrowser({ initialCategory = "全部" }: { initialCategory?: string }) {
  const [category, setCategory] = useState(initialCategory);
  const [query, setQuery] = useState("");
  const visible = useMemo(() => scenarios.filter((s) => (category === "全部" || s.category === category) && `${s.title}${s.goal}${s.category}`.toLowerCase().includes(query.trim().toLowerCase())), [category, query]);
  return <>
    <div className="filter-bar">
      <div className="chips" role="group" aria-label="场景类别">{templateCategories.map((item) => <button type="button" aria-pressed={item === category} className={item === category ? "chip active" : "chip"} onClick={() => setCategory(item)} key={item}>{item}</button>)}</div>
      <div className="search-field"><Search size={20} aria-hidden="true" /><input type="search" aria-label="搜索场景" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索任务、业务类别…" /></div>
    </div>
    <p className="results-count" role="status">{category} · {visible.length} 个案例</p>
    <div className="scenario-grid">{visible.map((scenario) => <article className="scenario-card" key={scenario.slug}>
      <div className="scenario-card-top"><span className="scenario-icon"><CategoryIcon category={scenario.category} /></span><p className="eyebrow">{scenario.category}</p></div>
      <h3>{scenario.title}</h3><p>{scenario.goal}</p><Link href={`/scenarios/${scenario.slug}`}>查看案例 →</Link>
    </article>)}</div>
    {visible.length === 0 && <div className="empty-state"><p className="empty">没有匹配的案例。试试更少关键词，或切换到“全部”。</p><button className="button secondary small" onClick={() => { setCategory("全部"); setQuery(""); }}>清除筛选</button></div>}
  </>;
}
