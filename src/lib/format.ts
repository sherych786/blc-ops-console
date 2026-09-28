export function money(n: number | null | undefined): string {
  const v = Number(n || 0);
  return `£${v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function jobRef(): string {
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  const stamp = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  return `BLC-${stamp}-${rand}`;
}
