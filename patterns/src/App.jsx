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

  const totalPages = Math.max(1, Math.ceil(patterns.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const pageItems = patterns.slice(start, end);

  const goToPage = (p) => {
    const clamped = Math.min(Math.max(1, p), totalPages);
    setPage(clamped);
    // מגלגל לראש אזור הרשימה
    requestAnimationFrame(() => {
      if (listRef.current) listRef.current.scrollTo({ top: 0, behavior: "smooth" });
      window.scrollTo({ top: 0, behavior: "smooth" }); // גם חלון, ליתר ביטחון
    });
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
        <h1 style={{margin: 0}}>All Patterns</h1>
        <p style={{margin: "6px 0 0 0", color: "#6b7280"}}>
          מציג עד {PAGE_SIZE} דפוסים בעמוד מתוך <b>{patterns.length}</b> דפוסים.
        </p>
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
