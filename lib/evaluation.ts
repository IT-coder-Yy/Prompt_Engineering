export function inspectJson(text: string, requiredFields: string[] = []) {
  try {
    const parsed: unknown = JSON.parse(text);
    const object = parsed !== null && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    return { valid: true, missing: requiredFields.filter((key) => !Object.hasOwn(object, key)) };
  } catch {
    return { valid: false, missing: [] as string[] };
  }
}
