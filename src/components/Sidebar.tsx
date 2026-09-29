"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Leaf = { href: string; label: string; icon?: string; count?: keyof Counts };
type Group = { group: string; icon: string; items: Leaf[] };
export type Counts = { drivers: number; invoices: number; employees: number; slips: number };

// Exact order, labels and glyphs from the prototype's NAV array.
const NAV: (Leaf | Group)[] = [
  { href: "/dashboard", label: "Dashboard", icon: "▤" },
  { href: "/jobs/new", label: "New job", icon: "＋" },
  { href: "/jobs", label: "Jobs overview", icon: "▦" },
  {
    group: "Office",
    icon: "▣",
    items: [
      { href: "/office/companies", label: "Companies network" },
      { href: "/office/fleet", label: "Fleet" },
      { href: "/office/chauffeurs", label: "Chauffeurs", count: "drivers" },
    ],
  },
  {
    group: "Invoices",
    icon: "£",
    items: [
      { href: "/invoices/new", label: "Create invoice" },
      { href: "/invoices", label: "Invoice history", count: "invoices" },
    ],
  },
  {
    group: "BLC Drivers",
    icon: "◇",
    items: [
      { href: "/drivers/employees", label: "Employees", count: "employees" },
      { href: "/drivers/shifts", label: "Jobs review" },
      { href: "/drivers/salary-slips", label: "Salary slips", count: "slips" },
    ],
  },
];

export function Sidebar({ counts, email }: { counts: Counts; email: string }) {
  const path = usePathname();
  const [open, setOpen] = useState<Set<string>>(new Set());

  // Like showSec(): the group holding the current page opens itself.
  useEffect(() => {
    NAV.forEach((n) => {
      if ("group" in n && n.items.some((it) => it.href === path)) {
        setOpen((o) => (o.has(n.group) ? o : new Set(o).add(n.group)));
      }
    });
  }, [path]);

  const toggle = (g: string) =>
    setOpen((o) => {
      const s = new Set(o);
      if (s.has(g)) s.delete(g);
      else s.add(g);
      return s;
    });

  return (
    <aside className="side">
      {NAV.map((n) =>
        "group" in n ? (
          <div key={n.group} className={`nav-acc${open.has(n.group) ? " open" : ""}`}>
            <button className="nav-parent" onClick={() => toggle(n.group)} aria-expanded={open.has(n.group)}>
              <span className="ni">{n.icon}</span> {n.group}
              <span className="chev">▶</span>
            </button>
            <div className="nav-children">
              {n.items.map((it) => (
                <Link key={it.href} href={it.href} className={`navlink sub${path === it.href ? " on" : ""}`}>
                  {it.label}
                  {it.count && <span className="count">{counts[it.count]}</span>}
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <Link key={n.href} href={n.href} className={`navlink${path === n.href ? " on" : ""}`}>
            <span className="ni">{n.icon}</span> {n.label}
          </Link>
        )
      )}
      <div className="side-sep" />
      <div className="side-foot">
        <div>
          <span className="dot" />
          Live database connected
        </div>
        <div style={{ marginTop: 4, overflow: "hidden", textOverflow: "ellipsis" }}>{email}</div>
      </div>
    </aside>
  );
}
