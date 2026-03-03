export function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

export function isInt(v: unknown): v is number {
  return typeof v === "number" && Number.isInteger(v);
}

export function isCurrency3(v: unknown): v is string {
  return typeof v === "string" && /^[A-Z]{3}$/.test(v);
}
