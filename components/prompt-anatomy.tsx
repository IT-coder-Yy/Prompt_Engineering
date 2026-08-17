const parts = [
  ["任务", "告诉模型要完成的具体动作"], ["上下文", "补足业务背景与边界"], ["输入", "本次待处理的资料"], ["约束", "范围、禁止项、长度与语气"], ["示例", "校准关键判断或风格"], ["输出格式", "让结果可验收、可复用"],
];

export function PromptAnatomy() {
  return <div className="anatomy-grid">{parts.map(([title, text], index) => <article className={`anatomy-card part-${index + 1}`} key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{text}</p></article>)}</div>;
}
