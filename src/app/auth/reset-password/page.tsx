"use client";

import { useState } from "react";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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

  return (
    <div className="container">
      <div className="row" style={{ marginTop: "3rem" }}>
        <div className="col-12" style={{ maxWidth: 500, margin: "0 auto" }}>
          <div className="card">
            <div className="card-header text-center">
              <h2 className="card-title"><i className="fas fa-key" /> Reset Password</h2>
              <p>Enter your email to receive reset instructions</p>
            </div>
            <div className="card-body">
              {sent ? (
                <div className="alert alert-success">
                  <i className="fas fa-check-circle" /> If an account exists for that email, reset instructions have been sent.
                </div>
              ) : (
                <>
                  {error && <div className="alert alert-danger"><i className="fas fa-exclamation-circle" /> {error}</div>}
                  <form onSubmit={handleSubmit}>
                    <div className="form-group">
                      <label className="form-label"><i className="fas fa-envelope" /> Email Address</label>
                      <input type="email" name="email" className="form-control" placeholder="Enter your email" required />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
                      {loading ? "Sending..." : <><i className="fas fa-paper-plane" /> Send Reset Link</>}
                    </button>
                  </form>
                </>
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
