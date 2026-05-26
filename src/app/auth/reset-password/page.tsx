"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get("token");

  const [sent, setSent] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Step 1 — request reset email
  async function handleRequest(e: { preventDefault(): void; currentTarget: HTMLFormElement }) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const data = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: data.get("email") }),
    });
    setLoading(false);
    if (res.ok) { setSent(true); } else { setError("Unable to process request. Please try again."); }
  }

  // Step 2 — set new password using token
  async function handleConfirm(e: { preventDefault(): void; currentTarget: HTMLFormElement }) {
    e.preventDefault();
    setError("");
    const data = new FormData(e.currentTarget);
    const password = data.get("password") as string;
    const confirm = data.get("confirm") as string;
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    setLoading(false);
    if (res.ok) {
      setDone(true);
    } else {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "Reset failed. The link may have expired.");
    }
  }

  return (
    <div className="container">
      <div className="row" style={{ marginTop: "3rem" }}>
        <div className="col-12" style={{ maxWidth: 500, margin: "0 auto" }}>
          <div className="card">
            <div className="card-header text-center">
              <h2 className="card-title"><i className="fas fa-key" /> {token ? "Set New Password" : "Reset Password"}</h2>
              <p>{token ? "Enter your new password below." : "Enter your email to receive reset instructions."}</p>
            </div>
            <div className="card-body">
              {error && <div className="alert alert-danger"><i className="fas fa-exclamation-circle" /> {error}</div>}

              {/* Token flow — set new password */}
              {token && !done && (
                <form onSubmit={handleConfirm}>
                  <div className="form-group">
                    <label className="form-label"><i className="fas fa-lock" /> New Password</label>
                    <input type="password" name="password" className="form-control" placeholder="At least 6 characters" required minLength={6} />
                  </div>
                  <div className="form-group">
                    <label className="form-label"><i className="fas fa-lock" /> Confirm Password</label>
                    <input type="password" name="confirm" className="form-control" placeholder="Repeat new password" required />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
                    {loading ? "Saving..." : <><i className="fas fa-check" /> Set New Password</>}
                  </button>
                </form>
              )}

              {token && done && (
                <div className="alert alert-success">
                  <i className="fas fa-check-circle" /> Your password has been updated successfully.
                  <div style={{ marginTop: "1rem" }}>
                    <Link href="/auth/login" className="btn btn-primary" style={{ width: "100%" }}>
                      <i className="fas fa-sign-in-alt" /> Login Now
                    </Link>
                  </div>
                </div>
              )}

              {/* No token — request reset email */}
              {!token && !sent && (
                <form onSubmit={handleRequest}>
                  <div className="form-group">
                    <label className="form-label"><i className="fas fa-envelope" /> Email Address</label>
                    <input type="email" name="email" className="form-control" placeholder="Enter your email" required />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
                    {loading ? "Sending..." : <><i className="fas fa-paper-plane" /> Send Reset Link</>}
                  </button>
                </form>
              )}

              {!token && sent && (
                <div className="alert alert-success">
                  <i className="fas fa-check-circle" /> If an account exists for that email, reset instructions have been sent. Please check your inbox (and spam folder).
                </div>
              )}

              <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
                <Link href="/auth/login" style={{ color: "var(--accent-color)" }}>
                  <i className="fas fa-arrow-left" /> Back to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
