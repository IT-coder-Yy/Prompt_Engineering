import Link from "next/link";

const links = [
  ["学习", "/learn"], ["场景库", "/scenarios"], ["实验室", "/playground"], ["API 配置", "/setup"],
];

export function SiteHeader() {
  return <header className="site-header"><div className="shell header-inner">
    <Link href="/" className="brand"><span>✦</span> Prompt 实战学习站</Link>
    <nav aria-label="主导航">{links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</nav>
    <Link className="button small" href="/playground">开始实验</Link>
  </div></header>;
}
