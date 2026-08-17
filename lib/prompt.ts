export function fillPrompt(template: string, values: Record<string, string>) {
  return template.replace(/{{([\w-]+)}}/g, (_, key: string) => values[key]?.trim() || `{{${key}}}`);
}

export function extractVariables(template: string) {
  return [...new Set([...template.matchAll(/{{([\w-]+)}}/g)].map((match) => match[1]))];
}
