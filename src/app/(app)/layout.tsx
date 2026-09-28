import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/Sidebar";
import { signOut } from "./actions";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="h-14 border-b border-[var(--line)] flex items-center justify-between px-6">
          <div className="text-sm text-[var(--grey)]">{user.email}</div>
          <form action={signOut}>
            <button
              type="submit"
              className="text-sm text-[var(--grey)] hover:text-[var(--ink)]"
            >
              Sign out
            </button>
          </form>
        </header>
        <main className="flex-1 p-6 bg-[var(--surface)]">{children}</main>
      </div>
    </div>
  );
}
