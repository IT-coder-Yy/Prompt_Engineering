import Link from "next/link";
export default function NotFound() { return <div className="not-found"><p className="eyebrow">404</p><h1>这里还没有课程内容</h1><p>链接可能已变更，或案例不存在。</p><Link className="button" href="/">回到首页</Link></div> }
