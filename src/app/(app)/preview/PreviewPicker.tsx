"use client";

import { useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";
import { useToast } from "@/components/Toast";
import { resetJobFlow } from "../(console)/jobs/actions";

/** The prototype's .picker bar above the phone frame. */
export function PreviewPicker({
  label,
  param,
  value,
  options,
  resetJobId,
}: {
  label: string;
  param: string;
  value: string;
  options: { value: string; label: string }[];
  resetJobId?: string;
}) {
  const router = useRouter();
  const path = usePathname();
  const toast = useToast();
  const [pending, start] = useTransition();

  return (
    <div className="picker">
      <label htmlFor="pv">{label}</label>
      <select id="pv" className="field-mini" value={value} onChange={(e) => router.push(`${path}?${param}=${encodeURIComponent(e.target.value)}`)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {resetJobId && (
        <button
          className="btn sm ghost"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await resetJobFlow(resetJobId);
              toast(r.error || "Flow reset");
              router.refresh();
            })
          }
        >
          ↺ Reset flow
        </button>
      )}
    </div>
  );
}
