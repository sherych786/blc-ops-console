import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppBar } from "@/components/AppBar";
import { signOut } from "./actions";

/** Everything behind login: auth gate + the prototype's appbar. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <>
      <AppBar signOut={signOut} />
      {children}
    </>
  );
}
