export function ComingSoon({ title, note }: { title: string; note?: string }) {
  return (
    <div>
      <h1 className="text-lg font-bold mb-4">{title}</h1>
      <div className="card p-6 text-sm text-[var(--grey)]">
        This module isn&apos;t ported from the prototype yet.{" "}
        {note || "It follows the same pattern as Jobs — see ROADMAP.md for the plan."}
      </div>
    </div>
  );
}
