"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** The prototype's sticky appbar: logo + name, 3-way view switch, theme. */
export function AppBar({ signOut }: { signOut: () => Promise<void> }) {
  const path = usePathname();
  const view = path.startsWith("/preview/chauffeur") ? "chauffeur" : path.startsWith("/preview/driver") ? "driver" : "console";

  function toggleTheme() {
    const root = document.documentElement;
    const cur = root.getAttribute("data-theme");
    const dark = cur ? cur === "dark" : matchMedia("(prefers-color-scheme:dark)").matches;
    const next = dark ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem("blcTheme", next);
    } catch {}
  }

  return (
    <div className="appbar">
      <Link href="/dashboard" className="brand" style={{ textDecoration: "none" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="logo-img" src="/blc-logo.png" alt="Bespoke London Chauffeurs" />
        <div>
          <b>Bespoke London Chauffeurs</b>
          <span>Operations Console</span>
        </div>
      </Link>
      <div className="seg">
        <Link href="/dashboard" className={view === "console" ? "on" : ""}>Operations</Link>
        <Link href="/preview/chauffeur" className={view === "chauffeur" ? "on" : ""}>Chauffeur link</Link>
        <Link href="/preview/driver" className={view === "driver" ? "on" : ""}>Driver update</Link>
      </div>
      <button className="icobtn" title="Toggle theme" aria-label="Toggle theme" onClick={toggleTheme}>
        ◐
      </button>
      <form action={signOut}>
        <button className="icobtn" type="submit" title="Sign out" aria-label="Sign out">
          ⎋
        </button>
      </form>
    </div>
  );
}
