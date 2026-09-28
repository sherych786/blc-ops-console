"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLeaf = { href: string; label: string };
type NavGroup = { label: string; children: NavLeaf[] };
type NavItem = NavLeaf | NavGroup;

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/jobs", label: "Jobs Overview" },
  {
    label: "Office",
    children: [
      { href: "/office/companies", label: "Companies" },
      { href: "/office/fleet", label: "Fleet" },
      { href: "/office/chauffeurs", label: "Chauffeurs" },
    ],
  },
  { href: "/invoices", label: "Invoices" },
  {
    label: "BLC Drivers",
    children: [
      { href: "/drivers/employees", label: "Employees" },
      { href: "/drivers/shifts", label: "Daily Updates" },
      { href: "/drivers/salary-slips", label: "Salary Slips" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="w-60 shrink-0 border-r border-[var(--line)] bg-[var(--paper)] p-4 flex flex-col gap-1">
      <div className="font-bold text-sm mb-4 px-2">BLC Operations</div>
      {NAV.map((item) =>
        "children" in item ? (
          <div key={item.label} className="mb-1">
            <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--grey)]">
              {item.label}
            </div>
            {item.children.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className={`block px-2 py-1.5 rounded-[var(--radius-control)] text-sm ${
                  pathname === c.href
                    ? "bg-[var(--surface)] font-medium"
                    : "hover:bg-[var(--surface)]"
                }`}
              >
                {c.label}
              </Link>
            ))}
          </div>
        ) : (
          <Link
            key={item.href}
            href={item.href}
            className={`block px-2 py-1.5 rounded-[var(--radius-control)] text-sm ${
              pathname === item.href
                ? "bg-[var(--surface)] font-medium"
                : "hover:bg-[var(--surface)]"
            }`}
          >
            {item.label}
          </Link>
        )
      )}
    </nav>
  );
}
