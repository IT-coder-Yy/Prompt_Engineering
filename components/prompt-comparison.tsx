export function PromptComparison({ weak, improved }: { weak: string; improved: string }) {
  return <div className="comparison"><section><p className="eyebrow danger">常见但不稳的写法</p><pre>{weak}</pre></section><section><p className="eyebrow good">可验收的写法</p><pre>{improved}</pre></section></div>;
}
