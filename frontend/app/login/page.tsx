"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    try {
      // Use FormData as expected by OAuth2PasswordRequestForm
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const res = await fetch("http://localhost:8000/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      const data = await res.json();

      if (res.ok && data.access_token) {
        localStorage.setItem("token", data.access_token);
        // Redirect to dashboard
        window.location.href = "/";
      } else {
        setError(data.detail || "Login failed. Please check your credentials.");
      }
    } catch (err) {
      setError("Connection error. Is the backend running?");
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-[#07090F]">
      <div className="bg-[#161D2E] p-8 rounded-xl border border-[#2A3356] w-[380px] shadow-2xl animate-slide-up">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
            <span className="text-white font-bold text-xl">A</span>
          </div>
          <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
          <p className="text-sm text-gray-400 mt-1">Access your orchestration hub</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-3 rounded-lg mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full p-3 bg-[#0f1226] border border-[#2A3356] rounded-lg text-white focus:border-blue-500 focus:outline-none transition"
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
              className="w-full p-3 bg-[#0f1226] border border-[#2A3356] rounded-lg text-white focus:border-blue-500 focus:outline-none transition"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-600/20 transition transform hover:-translate-y-0.5"
          >
            Login
          </button>
        </form>

        <p className="text-gray-500 text-sm mt-6 text-center">
          Don't have an account?{" "}
          <Link href="/signup" className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-4">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
