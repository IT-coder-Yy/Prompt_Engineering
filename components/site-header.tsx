"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ArrowUpRight from "reicon-react/icons/ArrowUpRight";
import Menu from "reicon-react/icons/Menu";
import Moon from "reicon-react/icons/Moon";
import Sun from "reicon-react/icons/Sun";

const links = [["学习", "/learn"], ["场景库", "/scenarios"], ["实验室", "/playground"], ["API 配置", "/setup"]];

export function SiteHeader() {
  const pathname = usePathname();
  function toggleTheme() {
    const root = document.documentElement;
    const dark = root.dataset.theme ? root.dataset.theme === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
  }
  const navigation = links.map(([label, href]) => (
    <Link key={href} href={href} aria-current={pathname.startsWith(href) ? "page" : undefined}
      onClick={(event) => event.currentTarget.closest("details")?.removeAttribute("open")}>
      {label}
    </Link>
  ));

  return <header className="site-header"><div className="shell header-inner">
    <Link href="/" className="brand"><span aria-hidden="true">✦</span> Prompt 实战学习站</Link>
    <nav className="desktop-nav" aria-label="主导航">{navigation}</nav>
    <Link className="button ink small header-cta" href="/playground">开始实验 <ArrowUpRight size={17} aria-hidden="true" /></Link>
    <button className="icon-button theme-toggle" type="button" onClick={toggleTheme} aria-label="切换明暗主题" title="切换明暗主题">
      <Moon className="moon-icon" size={20} aria-hidden="true" /><Sun className="sun-icon" size={20} aria-hidden="true" />
    </button>
    <details className="mobile-menu">
      <summary className="icon-button" aria-label="菜单"><Menu size={23} aria-hidden="true" /></summary>
      <nav aria-label="移动导航">{navigation}</nav>
    </details>
  </div></header>;
}
