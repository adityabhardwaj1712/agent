"use client";

import React, { useState } from "react";
import Link from "next/link";
import { apiFetch, setToken } from "../lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const data = await apiFetch<any>("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      if (data.access_token) {
        setToken(data.access_token);
        window.location.href = "/";
      }
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ms" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div className="ms-card" style={{ width: 380, padding: 0 }}>
        <div className="ms-card-hd" style={{ justifyContent: 'center', padding: '32px 24px 16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div className="ms-logo-mark" style={{ width: 48, height: 48, fontSize: 20 }}>A</div>
            <div className="ms-topbar-title" style={{ fontSize: 24 }}>Welcome Back</div>
            <div style={{ fontSize: 12, color: 'var(--s-t3)', textAlign: 'center' }}>Access your orchestration hub</div>
          </div>
        </div>

        <div className="ms-card-body" style={{ padding: 32 }}>
          {error && (
            <div className="ms-badge ms-b-r" style={{ width: '100%', justifyContent: 'center', marginBottom: 20, padding: 10 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
              className="ms-btn ms-btn-p"
              style={{ width: '100%', marginTop: 8 }}
            >
              {loading ? "Authenticating..." : "Login to Workspace"}
            </button>
          </form>

          <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: 'var(--s-t3)' }}>
            Don't have an account?{" "}
            <Link href="/signup" style={{ color: 'var(--s-blue)', fontWeight: 600, textDecoration: 'none' }}>
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
