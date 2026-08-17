export function inspectJson(text: string, requiredFields: string[] = []) {
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    return { valid: true, missing: requiredFields.filter((key) => !(key in parsed)) };
  } catch {
    return { valid: false, missing: [] as string[] };
  }
}
