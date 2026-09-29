"use client";
// Browser-side exports — same approach and filenames as the prototype
// (SheetJS for .xlsx, html2canvas + jsPDF for PNG/PDF). Libraries are
// loaded on demand so they never weigh down normal page loads.
// html2canvas-pro is used instead of html2canvas because it understands
// modern CSS colour functions (color-mix) used by the design system.

export function saveBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export async function exportXlsx(rows: Record<string, unknown>[], sheet: string, filename: string) {
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheet);
  const out = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  saveBlob(filename, new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
}

async function canvasOf(node: HTMLElement, bg: string) {
  const { default: html2canvas } = await import("html2canvas-pro");
  return html2canvas(node, { scale: 2, backgroundColor: bg, useCORS: true });
}

/** Rasterise a DOM node and save as a single-page A4 PDF (10mm margins). */
export async function exportPdf(node: HTMLElement, filename: string, bg = "#ffffff") {
  const canvas = await canvasOf(node, bg);
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF("p", "mm", "a4");
  const iw = 190;
  const ih = (canvas.height * iw) / canvas.width;
  pdf.addImage(canvas.toDataURL("image/png"), "PNG", 10, 10, iw, ih);
  saveBlob(filename, pdf.output("blob"));
}

export async function exportPng(node: HTMLElement, filename: string, bg: string) {
  const canvas = await canvasOf(node, bg);
  await new Promise<void>((res) =>
    canvas.toBlob((b) => {
      if (b) saveBlob(filename, b);
      res();
    }, "image/png")
  );
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {}
    ta.remove();
    return ok;
  }
}
