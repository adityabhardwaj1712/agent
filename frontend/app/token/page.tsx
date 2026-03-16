"use client";

import { useEffect, useState } from "react";

export default function TokenPage() {
  const [token, setToken] = useState("");

  useEffect(() => {
    setToken(window.localStorage.getItem("agentcloud_token") || "");
  }, []);

  function save() {
    window.localStorage.setItem("agentcloud_token", token.trim());
    alert("Saved token to localStorage");
  }

  function clear() {
    window.localStorage.removeItem("agentcloud_token");
    setToken("");
  }

  return (
    <main>
      <h1 style={{ margin: 0, fontSize: 22 }}>Auth token</h1>
      <p style={{ marginTop: 8, opacity: 0.75 }}>
        Paste your JWT token here. The UI will automatically send it as{" "}
        <code>Authorization: Bearer ...</code>.
      </p>

      <textarea
        value={token}
        onChange={(e) => setToken(e.target.value)}
        rows={6}
        style={{ width: "100%", marginTop: 12, padding: 10, borderRadius: 10 }}
        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      />

      <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
        <button
          onClick={save}
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.18)",
            background: "rgba(59,130,246,0.22)",
            color: "#e5e7eb",
          }}
        >
          Save
        </button>
        <button
          onClick={clear}
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.18)",
            background: "rgba(255,255,255,0.06)",
            color: "#e5e7eb",
          }}
        >
          Clear
        </button>
      </div>
    </main>
  );
}

