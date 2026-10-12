import Image from "next/image";
import Settings from "reicon-react/icons/Settings";
import Layers from "reicon-react/icons/Layers";
import Code from "reicon-react/icons/Code";
import ShieldCheck from "reicon-react/icons/ShieldCheck";

const icons = [Settings, Layers, Code, ShieldCheck];

export function LessonArt({ index }: { index: number }) {
  if (index < 2) {
    return <div className={`lesson-art art-${index}`}><Image src={index === 0 ? "/illustrations/first-prompt.png" : "/illustrations/prompt-structure.png"} alt="" width={1254} height={1254} sizes="(max-width: 600px) 140px, 220px" /></div>;
  }
  const Icon = icons[index - 2] ?? Settings;
  return <div className={`lesson-art art-${index}`}><Icon size={64} strokeWidth={1.5} aria-hidden="true" /></div>;
}
