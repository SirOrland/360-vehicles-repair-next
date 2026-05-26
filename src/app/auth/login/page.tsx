"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const params = useSearchParams();
  const [error, setError] = useState(
    params.get("timeout") ? "Your session has expired. Please login again." : ""
  );
  const [success] = useState(
    params.get("registered") ? "Registration successful! Please login with your credentials." : ""
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: { preventDefault(): void; currentTarget: HTMLFormElement }) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const data = new FormData(e.currentTarget);
    const email = data.get("email") as string;
    const password = data.get("password") as string;

    const res = await fetch("/api/auth/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "Login failed. Please try again.");
      setLoading(false);
      return;
    }

    // Store email for the OTP page (sessionStorage cleared on tab close)
    sessionStorage.setItem("pendingOtpEmail", email);
    window.location.href = "/auth/verify-otp";
  }

  return (
    <div className="container">
      <div className="row" style={{ marginTop: "3rem" }}>
        <div className="col-12" style={{ maxWidth: 500, margin: "0 auto" }}>
          <div className="card">
            <div className="card-header text-center">
              <h2 className="card-title"><i className="fas fa-sign-in-alt" /> Login</h2>
              <p>Welcome back! Please login to your account.</p>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger">
                  <i className="fas fa-exclamation-circle" /> {error}
                </div>
              )}
              {success && (
                <div className="alert alert-success">
                  <i className="fas fa-check-circle" /> {success}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label"><i className="fas fa-envelope" /> Email Address</label>
                  <input type="email" name="email" className="form-control" placeholder="Enter your email" required />
                </div>
                <div className="form-group">
                  <label className="form-label"><i className="fas fa-lock" /> Password</label>
                  <input type="password" name="password" className="form-control" placeholder="Enter your password" required />
                </div>
                <div className="form-group" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <input type="checkbox" name="remember" /> Remember me
                  </label>
                  <Link href="/auth/reset-password" style={{ color: "var(--accent-color)" }}>Forgot Password?</Link>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
                  {loading
                    ? <><i className="fas fa-spinner fa-spin" /> Sending code...</>
                    : <><i className="fas fa-sign-in-alt" /> Continue</>}
                </button>
              </form>

              <div style={{ textAlign: "center", marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "1px solid var(--light-bg)" }}>
                <p>Don&apos;t have an account?{" "}
                  <Link href="/auth/register" style={{ color: "var(--secondary-color)", fontWeight: 600 }}>Sign Up</Link>
                </p>
              </div>

              <div style={{ marginTop: "1.5rem", padding: "1rem", backgroundColor: "var(--light-bg)", borderRadius: 5 }}>
                <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--light-text)" }}>
                  <strong>Demo Credentials:</strong><br />
                  Admin: admin@360vehicles.com / admin123<br />
                  Customer: Register a new account
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
