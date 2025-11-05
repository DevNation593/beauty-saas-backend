export function asRecord(obj: unknown): Record<string, unknown> {
  return obj && typeof obj === 'object' ? (obj as Record<string, unknown>) : {};
}

export function getString(
  obj: Record<string, unknown>,
  key: string,
): string | undefined {
  const v = obj[key];
  return typeof v === 'string' ? v : undefined;
}

export function getNumber(
  obj: Record<string, unknown>,
  key: string,
): number | undefined {
  const v = obj[key];
  return typeof v === 'number' ? v : undefined;
}

export function getDateFromUnknown(value: unknown): Date | undefined {
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(String(value));
    return isNaN(d.getTime()) ? undefined : d;
  }
  return undefined;
}

export function getArray<T = unknown>(
  obj: Record<string, unknown>,
  key: string,
): T[] {
  const v = obj[key];
  return Array.isArray(v) ? (v as T[]) : [];
}

export function getIdFromUnknown(obj: unknown): string | undefined {
  const r = asRecord(obj);
  const id = r['id'];
  return typeof id === 'string' ? id : undefined;
}
