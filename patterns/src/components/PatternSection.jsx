// src/components/PatternSection.jsx
import React from "react";
import PatternDetails from "./PatternDetails";

export default function PatternSection({ pattern }) {
  if (!pattern) return null;
  return (
    <section
      style={{
        background: "#fff",
        borderRadius: 12,
        border: "1px solid #e3e3e3",
        boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
        padding: 16,
      }}
    >
      <header style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 8 }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#2d3748" }}>
          Pattern #{pattern.pattern_id}
        </h2>
        <span style={{ color: "#718096" }}>{pattern.event?.name}</span>
      </header>

      <PatternDetails pattern={pattern} />
    </section>
  );
}
