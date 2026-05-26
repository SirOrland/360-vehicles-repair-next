"use client";

import { useState, useEffect, useRef } from "react";
import { signIn } from "next-auth/react";

export default function VerifyOtpPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const stored = sessionStorage.getItem("pendingOtpEmail");
    if (!stored) { window.location.href = "/auth/login"; return; }
    setEmail(stored);
    inputs.current[0]?.focus();
  }, []);

  function handleDigit(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) inputs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) {
      setOtp(text.split(""));
      inputs.current[5]?.focus();
    }
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) { setError("Please enter the full 6-digit code."); return; }
    setError("");
    setLoading(true);

    // Step 1: verify OTP
    const verifyRes = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp: code }),
    });

    if (!verifyRes.ok) {
      const json = await verifyRes.json().catch(() => ({}));
      setError(json.error ?? "Verification failed.");
      setLoading(false);
      return;
    }

    const { verifiedToken } = await verifyRes.json();

    // Step 2: create NextAuth session
    const res = await signIn("credentials", {
      email,
      verifiedToken,
      redirect: false,
    });

    if (res?.error) {
      setError("Session creation failed. Please login again.");
      setLoading(false);
      return;
    }

    sessionStorage.removeItem("pendingOtpEmail");

    // Fetch session to get role
    try {
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      const role = session?.user?.role;
      window.location.href =
        role === "Admin" ? "/admin/dashboard"
        : role === "Mechanic" ? "/mechanic/dashboard"
        : "/customer/dashboard";
    } catch {
      window.location.href = "/";
    }
  }

  function handleResend() {
    sessionStorage.removeItem("pendingOtpEmail");
    window.location.href = "/auth/login";
  }

  return (
    <div className="container">
      <div className="row" style={{ marginTop: "3rem" }}>
        <div className="col-12" style={{ maxWidth: 480, margin: "0 auto" }}>
          <div className="card">
            <div className="card-header text-center">
              <h2 className="card-title"><i className="fas fa-shield-alt" /> Two-Factor Verification</h2>
              <p>
                A 6-digit code was sent to<br />
                <strong>{email}</strong>
              </p>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger">
                  <i className="fas fa-exclamation-circle" /> {error}
                </div>
              )}


              <form onSubmit={handleSubmit}>
                <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", marginBottom: "1.5rem" }}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => { inputs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleDigit(i, e.target.value)}
                      onKeyDown={e => handleKeyDown(i, e)}
                      onPaste={handlePaste}
                      style={{
                        width: 48, height: 56, textAlign: "center", fontSize: "1.5rem",
                        fontWeight: 700, border: "2px solid var(--light-bg)",
                        borderRadius: 6, outline: "none",
                        borderColor: digit ? "var(--primary-color, #e63946)" : "var(--light-bg)",
                      }}
                    />
                  ))}
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
                  {loading
                    ? <><i className="fas fa-spinner fa-spin" /> Verifying...</>
                    : <><i className="fas fa-check-circle" /> Verify &amp; Login</>}
                </button>
              </form>

              <div style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "0.875rem", color: "var(--light-text)" }}>
                Didn&apos;t receive it?{" "}
                <button
                  onClick={handleResend}
                  style={{ background: "none", border: "none", color: "var(--accent-color)", cursor: "pointer", fontWeight: 600, padding: 0 }}>
                  Go back to login
                </button>
              </div>

              <div style={{ textAlign: "center", marginTop: "1rem" }}>
                <a href="/auth/login" style={{ color: "var(--light-text)", fontSize: "0.85rem" }}>
                  <i className="fas fa-arrow-left" /> Back to Login
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
