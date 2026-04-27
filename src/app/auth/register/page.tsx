"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const data = new FormData(e.currentTarget);
    const password = data.get("password") as string;
    const confirm = data.get("confirm_password") as string;

    if (password !== confirm) { setError("Passwords do not match"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (!/[A-Z]/.test(password)) { setError("Password must contain at least one uppercase letter"); return; }
    if (!/[0-9]/.test(password)) { setError("Password must contain at least one number"); return; }

    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.get("name"),
        email: data.get("email"),
        password,
        contact: data.get("contact"),
      }),
    });

    setLoading(false);
    const json = await res.json();
    if (!res.ok) { setError(json.error || "Registration failed"); return; }
    router.push("/auth/login?registered=1");
  }

  return (
    <div className="container">
      <div className="row" style={{ marginTop: "3rem", marginBottom: "3rem" }}>
        <div className="col-12" style={{ maxWidth: 550, margin: "0 auto" }}>
          <div className="card">
            <div className="card-header text-center">
              <h2 className="card-title"><i className="fas fa-user-plus" /> Create Account</h2>
              <p>Join us today — it&apos;s free!</p>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger">
                  <i className="fas fa-exclamation-circle" /> {error}
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label"><i className="fas fa-user" /> Full Name *</label>
                  <input type="text" name="name" className="form-control" placeholder="Enter your full name" required />
                </div>
                <div className="form-group">
                  <label className="form-label"><i className="fas fa-envelope" /> Email Address *</label>
                  <input type="email" name="email" className="form-control" placeholder="Enter your email" required />
                </div>
                <div className="form-group">
                  <label className="form-label"><i className="fas fa-phone" /> Contact Number</label>
                  <input type="tel" name="contact" className="form-control" placeholder="Enter your phone number" />
                </div>
                <div className="form-group">
                  <label className="form-label"><i className="fas fa-lock" /> Password *</label>
                  <input type="password" name="password" className="form-control" placeholder="Min 8 chars, uppercase, number" required />
                </div>
                <div className="form-group">
                  <label className="form-label"><i className="fas fa-lock" /> Confirm Password *</label>
                  <input type="password" name="confirm_password" className="form-control" placeholder="Confirm your password" required />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
                  {loading ? <><i className="fas fa-spinner fa-spin" /> Creating account...</> : <><i className="fas fa-user-plus" /> Create Account</>}
                </button>
              </form>
              <div style={{ textAlign: "center", marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "1px solid var(--light-bg)" }}>
                <p>Already have an account?{" "}
                  <Link href="/auth/login" style={{ color: "var(--secondary-color)", fontWeight: 600 }}>Login</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
