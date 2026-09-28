"use client";

import { useActionState } from "react";
import { signIn } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--surface)] px-4">
      <div className="card w-full max-w-sm p-8">
        <h1 className="text-lg font-bold mb-1">BLC Operations Console</h1>
        <p className="text-sm text-[var(--grey)] mb-6">
          Sign in with your BLC staff account.
        </p>

        <form action={formAction} className="flex flex-col gap-3">
          <div>
            <label className="text-sm font-medium block mb-1" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="control w-full border border-[var(--line)] px-3 py-2 text-sm bg-[var(--paper)]"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="control w-full border border-[var(--line)] px-3 py-2 text-sm bg-[var(--paper)]"
            />
          </div>

          {state?.error && (
            <p className="text-sm text-[var(--red)]">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="control mt-2 bg-[var(--accent)] text-white font-medium py-2 text-sm disabled:opacity-60"
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="text-xs text-[var(--grey)] mt-6">
          Staff accounts are created in Supabase (Authentication → Users) by
          an admin — there is no public sign-up.
        </p>
      </div>
    </div>
  );
}
