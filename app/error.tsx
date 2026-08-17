"use client";
export default function Error({ reset }: { error: Error; reset: () => void }) { return <div className="not-found"><p className="eyebrow">出现了一个可恢复的错误</p><h1>页面暂时没能加载</h1><button className="button" onClick={reset}>重新尝试</button></div> }
