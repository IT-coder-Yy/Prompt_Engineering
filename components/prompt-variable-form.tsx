"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { type Scenario } from "@/lib/content";
import { fillPrompt } from "@/lib/prompt";
import { CopyButton } from "@/components/copy-button";

export function PromptVariableForm({ scenario }: { scenario: Scenario }) {
  const router = useRouter();
  const [values, setValues] = useState(scenario.sampleInput);
  const prompt = useMemo(() => fillPrompt(scenario.improvedPrompt, values), [scenario.improvedPrompt, values]);
  function sendToLab() {
    window.sessionStorage.setItem("playground-prompt:" + scenario.slug, prompt);
    window.sessionStorage.setItem("playground-input:" + scenario.slug, JSON.stringify(values));
    router.push("/playground?scenario=" + encodeURIComponent(scenario.slug));
  }
  return <section className="panel variable-panel"><div><p className="eyebrow">可编辑模板</p><h2>填入你的业务材料</h2></div>
    {scenario.variables.map((variable) => <label key={variable.key}>{variable.label}{variable.required && <em>必填</em>}<textarea value={values[variable.key] ?? ""} onChange={(event) => setValues({ ...values, [variable.key]: event.target.value })} placeholder={variable.example} /></label>)}
    <pre className="prompt-preview">{prompt}</pre><div className="actions"><CopyButton text={prompt} /><button className="button small" onClick={sendToLab}>送入实验室 →</button></div>
  </section>;
}
