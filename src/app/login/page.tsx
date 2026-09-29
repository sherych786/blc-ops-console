"use client";

import { useActionState } from "react";
import { signIn } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, null);

  return (
    <div className="login-wrap">
      <form action={formAction} className="card login-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="logo-img" src="/blc-logo.png" alt="Bespoke London Chauffeurs" />
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <div className="eyebrow">Operations Console</div>
          <h1 className="serif" style={{ fontSize: 22 }}>Sign in</h1>
          <p style={{ margin: "5px 0 0", color: "var(--text-2)", fontSize: 13 }}>Use your BLC staff account.</p>
        </div>
        <div className="fg" style={{ marginBottom: 12 }}>
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" defaultValue={state?.email} key={state?.email} />
        </div>
        <div className="fg" style={{ marginBottom: 16 }}>
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" required autoComplete="current-password" />
        </div>
        {state?.error && <p className="err" style={{ margin: "0 0 12px" }}>{state.error}</p>}
        <button type="submit" disabled={pending} className="btn primary" style={{ width: "100%", justifyContent: "center" }}>
          {pending ? "Signing in…" : "Sign in"}
        </button>
        <p className="hint" style={{ marginTop: 16, textAlign: "center" }}>
          Staff accounts are created by an admin in Supabase. There is no public sign-up.
        </p>
      </form>
    </div>
  );
}
