import { useState, useEffect, useCallback } from "react";
import { FaRegQuestionCircle } from "react-icons/fa";
import PatternDetails from "./PatternDetails";
import { buildPatternInfo, DEFAULT_RELATION_MAP } from "../utils/buildPatternInfo";

// סגנון scroll זהה למקור
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar { width: 10px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.00); border-radius: 30px; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: #6c86a7; border-radius: 30px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #5a7490; border-radius: 30px; }
  .custom-scrollbar { scrollbar-width: thin; scrollbar-color: #7F7F7F rgba(0,0,0,0.03); }
`;

export default function PatternModal({
  patternId,
  eventName = "AKI",
  triggerLabel,
}) {
  const [open, setOpen] = useState(false);
  const [pattern, setPattern] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

    const loadPattern = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const dict = await buildPatternInfo({
        patternId: Number(patternId),
        eventName,
        relationMap: DEFAULT_RELATION_MAP,
      });
      setPattern({ pattern_id: Number(patternId), ...dict });
    } catch (e) {
      console.error(e);
      setErr("Failed to load pattern");
    } finally {
      setLoading(false);
    }
  }, [patternId, eventName]);

  const handleOpen = async () => {
    setOpen(true);
  };

  // בכל שינוי של patternId/eventName כשהמודל פתוח — נטען מחדש
  useEffect(() => {
    if (open) {
      loadPattern();
    } else {
      // כשסוגרים, ננקה כדי למנוע הדבקות סטייט ישן
      setPattern(null);
      setErr(null);
    }
  }, [open, loadPattern]);

  return (
    <>
      <span
        onClick={handleOpen}
        className="pattern-trigger"
        style={{ display: "inline-flex", alignItems: "center", marginTop: "0.8px", marginLeft: "3.8px", cursor: "pointer" }}
      >
        {triggerLabel ?? <FaRegQuestionCircle style={{ fontSize: "1.0rem", color: "#ff4444" }} />}
      </span>

      {open && (
        <>
          <style>{scrollbarStyles}</style>
          <div
            className="modal-overlay"
            style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
            onClick={() => setOpen(false)}
          >
            <div
              className="modal-content pattern-modal"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "70vw",
                height: "80vh",
                position: "relative",
                borderRadius: 16,
                boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.2)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <button
                onClick={() => setOpen(false)}
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  background: "transparent",
                  border: "none",
                  fontSize: 26,
                  lineHeight: 1,
                  cursor: "pointer",
                  zIndex: 10,
                }}
                title="Close"
                aria-label="Close"
              >
                &times;
              </button>

              {/* Header */}
              <div style={{ padding: "30px 30px 0 30px", flexShrink: 0 }}>
                <h2
                  style={{
                    fontSize: "32px",
                    margin: "0 0 8px 0",
                    fontWeight: 700,
                    color: "#2d3748",
                    letterSpacing: "0.5px",
                    textAlign: "center",
                  }}
                >
                  {`Pattern ${Number(patternId)}`}
                </h2>
                <div
                  style={{
                    width: 140,
                    height: 2,
                    background: "#6c86a7",
                    margin: "0 auto 20px auto",
                    borderRadius: 2,
                  }}
                />
              </div>

              {/* Scrollable content */}
              <div
                className="custom-scrollbar"
                style={{
                  flex: 1,
                  overflow: "auto",
                  padding: "0 30px 20px 30px",
                  margin: "0 0 8px 8px",
                  borderRadius: 16,
                }}
              >
                {loading && (
                  <div
                    style={{
                      background: "rgba(0, 0, 0, 0.03)",
                      borderRadius: 16,
                      padding: 24,
                      margin: "0 auto",
                      maxWidth: 590,
                      textAlign: "center",
                    }}
                  >
                    <p style={{ fontSize: 18, margin: 0, lineHeight: 1.6, color: "#6c86a7" }}>Loading…</p>
                  </div>
                )}

                {err && (
                  <div
                    style={{
                      background: "rgba(220, 53, 69, 0.1)",
                      borderRadius: 16,
                      padding: 24,
                      margin: "0 auto",
                      maxWidth: 590,
                    }}
                  >
                    <p style={{ color: "#dc3545", fontSize: 18, margin: 0, lineHeight: 1.6 }}>{err}</p>
                  </div>
                )}

                {pattern && (
                  <div
                    style={{
                      background: "#FFFFFF",
                      borderRadius: 8,
                      padding: 8,
                      border: "1px solid #d0d0d0",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                    }}
                  >
                    <PatternDetails pattern={pattern} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
