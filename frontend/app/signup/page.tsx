"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "../lib/api";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      await apiFetch("/auth/register", {
        method: "POST",
        json: { email, password, name },
      });

      // Redirect to login after successful registry
      router.push("/login?signup_success=1");
    } catch (err: any) {
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ms" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div className="ms-card" style={{ width: 400, padding: 0 }}>
        <div className="ms-card-hd" style={{ justifyContent: 'center', padding: '32px 24px 16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div className="ms-logo-mark" style={{ width: 48, height: 48, fontSize: 20, background: 'linear-gradient(135deg, var(--s-purple), #8b5cf6)' }}>A</div>
            <div className="ms-topbar-title" style={{ fontSize: 24 }}>Create Account</div>
            <div style={{ fontSize: 12, color: 'var(--s-t3)', textAlign: 'center' }}>Join the AgentCloud orchestration network</div>
          </div>
        </div>

        <div className="ms-card-body" style={{ padding: 32 }}>
          {error && (
            <div className="ms-badge ms-b-r" style={{ width: '100%', justifyContent: 'center', marginBottom: 20, padding: 10 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="fg">
              <label className="fl">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="fi"
                required
              />
            </div>

            <div className="fg">
              <label className="fl">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="fi"
                required
              />
            </div>

            <div className="fg">
              <label className="fl">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="fi"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="ms-btn ms-btn-b"
              style={{ width: '100%', marginTop: 8 }}
            >
              {loading ? "Creating Account..." : "Register Identity"}
            </button>
          </form>

          <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: 'var(--s-t3)' }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: 'var(--s-purple)', fontWeight: 600, textDecoration: 'none' }}>
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
