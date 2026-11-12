"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null);
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    let active = true;
    const client = createClient();
    setSupabase(client);
    const { data: { subscription } } = client.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      if (!active) return;
      setHasSession(Boolean(session));
      setReady(true);
    });
    void client.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      setHasSession(Boolean(data.session));
      if (sessionError) setError(sessionError.message);
      setReady(true);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password !== confirmation) {
      setError("The passwords do not match.");
      return;
    }
    if (!supabase || !hasSession) {
      setError("This reset link is invalid or has expired. Request a new link to continue.");
      return;
    }
    setBusy(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setComplete(true);
      await supabase.auth.signOut();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We could not update your password. Request a new reset link and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="account-auth-shell">
      <section className="account-auth-card">
        <span className="overline">ACCOUNT SECURITY</span>
        <h1>Choose a new password</h1>
        {!ready ? <p>Checking your secure reset link…</p> : complete ? (
          <>
            <div className="auth-message" role="status">Your password has been updated. Sign in with your new password.</div>
            <Link className="auth-submit account-auth-signin" href="/">Return to sign in</Link>
          </>
        ) : !hasSession ? (
          <>
            <p>This reset link is invalid or has expired. Request a new link to protect your account.</p>
            <Link className="auth-submit account-auth-signin" href="/forgot-password">Request a new reset link</Link>
          </>
        ) : (
          <>
            <p>Use a strong password that you do not use for another account.</p>
            <form onSubmit={submit}>
              <label htmlFor="new-password">New password</label>
              <input id="new-password" type="password" autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required />
              <label htmlFor="confirm-password">Confirm new password</label>
              <input id="confirm-password" type="password" autoComplete="new-password" minLength={8} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required />
              {error && <div className="auth-error" role="alert">{error}</div>}
              <button className="auth-submit" type="submit" disabled={busy}>{busy ? "Updating…" : "Update password"}</button>
            </form>
          </>
        )}
        {error && !hasSession && <div className="auth-error" role="alert">{error}</div>}
        {!complete && <Link className="account-auth-back" href="/">Back to sign in</Link>}
      </section>
    </main>
  );
}
