"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { copyText } from "@/lib/export";

type ToastFn = (msg: string) => void;
const Ctx = createContext<ToastFn>(() => {});

/** The prototype's #toast: a pill at the bottom, auto-hides after 2.1s. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = useState("");
  const [show, setShow] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast = useCallback((m: string) => {
    setMsg(m);
    setShow(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setShow(false), 2100);
  }, []);

  return (
    <Ctx.Provider value={toast}>
      {children}
      <div className={`toast${show ? " show" : ""}`} role="status" aria-live="polite">
        {msg}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);

/** Copy helper with the prototype's "<label> copied" toast. */
export function useCopy() {
  const toast = useToast();
  return async (text: string, label = "Copied") => {
    const ok = await copyText(text);
    toast(ok ? `${label} copied` : "Press Ctrl or Cmd C");
  };
}
