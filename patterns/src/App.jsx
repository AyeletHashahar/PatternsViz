// src/App.jsx
import React, { useEffect, useState, useRef } from "react";
import PatternSection from "./components/PatternSection";
import { buildAllPatternsInfo, DEFAULT_RELATION_MAP } from "./utils/buildPatternInfo";

const PAGE_SIZE = 10;            // עד 10 דפוסים לעמוד
const EVENT_NAME = "AKI";        // שנה לפי הצורך

export default function App() {
  const [patterns, setPatterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("id"); // "id", "vs", "hs", "mmd"
  const [sortDirection, setSortDirection] = useState("asc"); // "asc", "desc"
  const listRef = useRef(null);

  useEffect(() => {
    let abort = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const all = await buildAllPatternsInfo({
          eventName: EVENT_NAME,
          relationMap: DEFAULT_RELATION_MAP,
          // patternJsonUrl / statesCsvUrl אם הנתיבים שונים – אפשר להעביר כאן
        });
        if (!abort) {
          setPatterns(all);
          setPage(1); // מתחילים מעמוד ראשון
        }
      } catch (e) {
        if (!abort) setErr(e.message || "Failed loading patterns");
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => { abort = true; };
  }, []);

  // Sort patterns based on current sort settings
  const sortedPatterns = React.useMemo(() => {
    const sorted = [...patterns].sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case "vs":
          aVal = a.verticalSupport ?? 0;
          bVal = b.verticalSupport ?? 0;
          break;
        case "hs":
          aVal = a.horizontalSupport ?? 0;
          bVal = b.horizontalSupport ?? 0;
          break;
        case "mmd":
          aVal = a.meanDuration ?? 0;
          bVal = b.meanDuration ?? 0;
          break;
        case "id":
        default:
          aVal = a.pattern_id;
          bVal = b.pattern_id;
          break;
      }
      
      if (sortDirection === "desc") {
        return bVal - aVal;
      } else {
        return aVal - bVal;
      }
    });
    
    return sorted;
  }, [patterns, sortBy, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedPatterns.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const pageItems = sortedPatterns.slice(start, end);

  const goToPage = (p) => {
    const clamped = Math.min(Math.max(1, p), totalPages);
    setPage(clamped);
    // מגלגל לראש אזור הרשימה
    requestAnimationFrame(() => {
      if (listRef.current) listRef.current.scrollTo({ top: 0, behavior: "smooth" });
      window.scrollTo({ top: 0, behavior: "smooth" }); // גם חלון, ליתר ביטחון
    });
  };

  const handleSortChange = (newSortBy) => {
    if (newSortBy === sortBy) {
      // Toggle direction if same sort field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortDirection("asc");
    }
    setPage(1); // Reset to first page when sorting changes
  };

  return (
    <div
      style={{
        height: "100vh",                 // מסך מלא
        display: "flex",
        flexDirection: "column",
        background: "#f6f7fb",
        fontFamily: "Inter, system-ui, Arial"
      }}
    >
      {/* Header */}
      <header style={{padding: "16px 24px", flexShrink: 0, background: "#fff", borderBottom: "1px solid #e5e7eb"}}>
        <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16}}>
          <div>
            <h1 style={{margin: 0}}>All Patterns</h1>
            <p style={{margin: "6px 0 0 0", color: "#6b7280"}}>
              מציג עד {PAGE_SIZE} דפוסים בעמוד מתוך <b>{patterns.length}</b> דפוסים.
            </p>
          </div>
          
          {/* Sort Controls */}
          <div style={{display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap"}}>
            <label style={{color: "#6b7280", fontSize: "14px", fontWeight: "500"}}>
              Sort by:
            </label>
            <div style={{display: "flex", gap: 8}}>
              {[
                {key: "id", label: "ID"},
                {key: "vs", label: "VS"},
                {key: "hs", label: "HS"},
                {key: "mmd", label: "MMD"}
              ].map(({key, label}) => (
                <button
                  key={key}
                  onClick={() => handleSortChange(key)}
                  style={{
                    padding: "6px 12px",
                    border: `2px solid ${sortBy === key ? "#3b82f6" : "#e5e7eb"}`,
                    borderRadius: "6px",
                    backgroundColor: sortBy === key ? "#eff6ff" : "#fff",
                    color: sortBy === key ? "#1d4ed8" : "#374151",
                    fontSize: "14px",
                    fontWeight: sortBy === key ? "600" : "500",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    gap: 4
                  }}
                >
                  {label}
                  {sortBy === key && (
                    <span style={{fontSize: "12px"}}>
                      {sortDirection === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>


      {/* אזור הרשימה – גליל */}
      <main
          ref={listRef}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "0 24px 16px 24px",
          }}
      >
        {loading && <p style={{color: "#6c86a7"}}>Loading…</p>}
        {err && <p style={{color: "#b91c1c"}}>{err}</p>}

        <div style={{ display: "grid", gap: 20 }}>
          {pageItems.map((p) => (
            <PatternSection key={p.pattern_id} pattern={p} />
          ))}
          {!loading && !err && pageItems.length === 0 && (
            <p style={{ color: "#6b7280" }}>אין דפוסים להצגה בעמוד זה.</p>
          )}
        </div>
      </main>

      {/* פאג'ינציה – נדבקת לתחתית */}
      <footer
        style={{
          position: "sticky",
          bottom: 0,
          background: "#fff",
          borderTop: "1px solid #e5e7eb",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          zIndex: 1,
        }}
      >
        <div style={{ color: "#6b7280" }}>
          Page <b>{page}</b> of <b>{totalPages}</b>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => goToPage(1)}
            disabled={page === 1}
            style={{ padding: "6px 10px" }}
          >
            « First
          </button>
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page === 1}
            style={{ padding: "6px 10px" }}
          >
            ‹ Prev
          </button>

          <button
            onClick={() => goToPage(page + 1)}
            disabled={page === totalPages}
            style={{ padding: "6px 10px" }}
          >
            Next ›
          </button>
          <button
            onClick={() => goToPage(totalPages)}
            disabled={page === totalPages}
            style={{ padding: "6px 10px" }}
          >
            Last »
          </button>
        </div>
      </footer>
    </div>
  );
}
