"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) throw resetError;
      setMessage("If an Osusu account exists for that email address, a password-reset link will be sent. Please check your inbox and spam folder.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We could not request a password reset. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="account-auth-shell">
      <section className="account-auth-card">
        <span className="overline">ACCOUNT RECOVERY</span>
        <h1>Reset your password</h1>
        <p>Enter the email address associated with your Osusu account. We’ll send a secure reset link if an account matches.</p>
        <form onSubmit={submit}>
          <label htmlFor="recovery-email">Email address</label>
          <input id="recovery-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required />
          {error && <div className="auth-error" role="alert">{error}</div>}
          {message && <div className="auth-message" role="status">{message}</div>}
          <button className="auth-submit" type="submit" disabled={busy}>{busy ? "Sending…" : "Send reset link"}</button>
        </form>
        <Link className="account-auth-back" href="/">Back to sign in</Link>
      </section>
    </main>
  );
}
