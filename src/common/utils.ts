// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseJson(text: string): any | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
