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
      <header style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#2d3748" }}>
          Pattern #{pattern.pattern_id}
        </h2>
        <span style={{ color: "#718096" }}>{pattern.event?.name}</span>
        {pattern.patternName && (
          <span style={{ 
            color: "#4a5568", 
            fontSize: "14px", 
            fontFamily: "monospace",
            backgroundColor: "#f7fafc",
            padding: "4px 8px",
            borderRadius: "4px",
            border: "1px solid #e2e8f0"
          }}>
            {pattern.patternName}
          </span>
        )}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {pattern.verticalSupport !== null && pattern.verticalSupport !== undefined && (
            <span style={{ 
              color: "#059669", 
              fontSize: "13px", 
              fontWeight: "600",
              backgroundColor: "#ecfdf5",
              padding: "3px 6px",
              borderRadius: "4px",
              border: "1px solid #a7f3d0"
            }}>
              VS: {pattern.verticalSupport}
            </span>
          )}
          {pattern.horizontalSupport !== null && pattern.horizontalSupport !== undefined && (
            <span style={{ 
              color: "#dc2626", 
              fontSize: "13px", 
              fontWeight: "600",
              backgroundColor: "#fef2f2",
              padding: "3px 6px",
              borderRadius: "4px",
              border: "1px solid #fecaca"
            }}>
              HS: {pattern.horizontalSupport.toFixed(2)}
            </span>
          )}
          {pattern.meanDuration !== null && pattern.meanDuration !== undefined && (
            <span style={{ 
              color: "#7c3aed", 
              fontSize: "13px", 
              fontWeight: "600",
              backgroundColor: "#f3f4f6",
              padding: "3px 6px",
              borderRadius: "4px",
              border: "1px solid #d1d5db"
            }}>
              MMD: {pattern.meanDuration.toFixed(2)}
            </span>
          )}
        </div>
      </header>

      <PatternDetails pattern={pattern} />
    </section>
  );
}
