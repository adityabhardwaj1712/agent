"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
      const res = await fetch("http://localhost:8000/api/v1/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await res.json();

      if (res.ok) {
        // Redirect to login
        router.push("/login");
      } else {
        setError(data.detail?.[0]?.msg || data.detail || "Registration failed.");
      }
    } catch (err) {
      setError("Connection error. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-[#07090F]">
      <div className="bg-[#161D2E] p-8 rounded-xl border border-[#2A3356] w-[380px] shadow-2xl animate-slide-up">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-4 shadow-lg shadow-purple-500/20">
            <span className="text-white font-bold text-xl">A</span>
          </div>
          <h2 className="text-2xl font-bold text-white">Create Account</h2>
          <p className="text-sm text-gray-400 mt-1">Join the AgentCloud network</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-3 rounded-lg mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full p-3 bg-[#0f1226] border border-[#2A3356] rounded-lg text-white focus:border-purple-500 focus:outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full p-3 bg-[#0f1226] border border-[#2A3356] rounded-lg text-white focus:border-purple-500 focus:outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-3 bg-[#0f1226] border border-[#2A3356] rounded-lg text-white focus:border-purple-500 focus:outline-none transition"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-purple-600/20 transition transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
          >
            {loading ? "Creating..." : "Sign Up"}
          </button>
        </form>

        <p className="text-gray-500 text-sm mt-6 text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-purple-400 hover:text-purple-300 font-semibold underline underline-offset-4">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
