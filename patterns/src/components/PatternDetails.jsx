import { useMemo } from "react";
import React from "react";
import { shortenIntervalName } from "../utils/intervalMapper.js";

/* ======= Typography ======= */
const FONT_SIZE_TABLE = 15;
const FONT_SIZE_TABLE_HEADER = 16.5;

/* ======= Section wrapper (זהה לסגנון הקודם) ======= */
const Section = React.forwardRef(function Section(
  { title, children, style = {}, className = "", fullHeight = false },
  ref
) {
  const base = {
    border: "1px solid #d0d0d0",
    borderRadius: 8,
    padding: 16,
    background: "#fafafa",
    width: "100%",
    ...(fullHeight && { height: "100%", display: "flex", flexDirection: "column" }),
  };
  return (
    <div ref={ref} style={{ ...base, ...style }} className={className}>
      {title && <h3 style={{ margin: "0 0 12px 0", fontWeight: 600 }}>{title}</h3>}
      {children}
    </div>
  );
});

/* ======= Legend: code ↔ label ======= */
const IntervalLegend = ({ pattern }) => {
  if (!pattern || !Array.isArray(pattern.intervals)) return null;
  return (
    <div className="overflow-x-auto">
      <table
        className="border-collapse"
        style={{
          fontSize: FONT_SIZE_TABLE,
          minWidth: "400px",
        }}
      >
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-3 py-2 text-left font-semibold" style={{ fontSize: FONT_SIZE_TABLE_HEADER }}>
              Code
            </th>
            <th className="border border-gray-300 px-3 py-2 text-left font-semibold" style={{ fontSize: FONT_SIZE_TABLE_HEADER }}>
              Interval
            </th>
            <th className="border border-gray-300 px-3 py-2 text-left font-semibold" style={{ fontSize: FONT_SIZE_TABLE_HEADER }}>
              Method Name
            </th>
          </tr>
        </thead>
        <tbody>
          {pattern.intervals.map((intv, idx) => {
            // Get the methodName from the first cutoff entry for this interval
            const firstCutoff = intv.cutoffs?.[0];
            const methodName = firstCutoff?.MethodName || "";
            
            return (
              <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="border border-gray-300 px-3 py-2 font-mono font-semibold text-blue-600">
                  {intv.code}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-gray-700">
                  {intv.label}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-gray-700">
                  {methodName || "—"}
                </td>
              </tr>
            );
          })}
          <tr className="bg-red-50">
            <td className="border border-gray-300 px-3 py-2 font-mono font-bold text-red-600">
              {pattern.event.code}
            </td>
            <td className="border border-gray-300 px-3 py-2 font-bold text-red-600">
              AKI
            </td>
            <td className="border border-gray-300 px-3 py-2 font-bold text-gray-500">
              —
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

/* ======= SVG: אילוסטרציית אינטרוולים עם שמירת יחסי Allen ======= */
const renderDiagram = (pattern) => {
  if (!pattern) return { svg: null };
  const barH = 26, gap = 12, W = 90, startX = 10, pad = 20;

  let bars = pattern.intervals.map((_, i) => ({ idx: i, x1: startX, x2: startX + W }));
  const rels = pattern.relations || {};

  let changed;
  const MAX_ITERS = 100;
  let iter = 0;
  do {
    changed = false;
    Object.entries(rels).forEach(([key, code]) => {
      const [iA, iB] = key.split("-").map(Number);
      const A = bars[iA], B = bars[iB];
      const prev = { A1: A.x1, A2: A.x2, B1: B.x1, B2: B.x2 };

      switch (code) {
        case "b": { if (A.x2 + pad > B.x1) { const d = A.x2 + pad - B.x1; B.x1 += d; B.x2 += d; } break; }
        case "m": { B.x1 = A.x2; B.x2 = B.x1 + W; break; }
        case "o": { if (A.x1 >= B.x1) A.x1 = B.x1 - pad; if (B.x1 <= A.x1 + pad) { B.x1 = A.x1 + pad; B.x2 = B.x1 + W; } if (A.x2 >= B.x2 - pad) { A.x2 = B.x2 - pad; } break; }
        case "f": { B.x2 = A.x2; B.x1 = B.x2 - W; if (B.x1 <= A.x1) B.x1 = A.x1 + pad; break; }
        case "c": { if (B.x1 - pad < A.x1) A.x1 = B.x1 - pad; if (B.x2 + pad > A.x2) A.x2 = B.x2 + pad; break; }
        case "s": { A.x1 = B.x1; A.x2 = A.x1 + W; if (A.x2 + pad > B.x2) B.x2 = A.x2 + pad; break; }
        case "e": { B.x1 = A.x1; B.x2 = A.x2; break; }
        default: break;
      }

      if (A.x1 !== prev.A1 || A.x2 !== prev.A2 || B.x1 !== prev.B1 || B.x2 !== prev.B2) changed = true;
    });
    iter += 1;
    if (iter >= MAX_ITERS) break;
  } while (changed);

  const minX = Math.min(...bars.map((b) => b.x1));
  if (minX < startX) {
    const d = startX - minX;
    bars = bars.map((b) => ({ ...b, x1: b.x1 + d, x2: b.x2 + d }));
  }

  const totalH = (bars.length + 1) * (barH + gap) + 45;
  const lastEnd = Math.max(...bars.map((b) => b.x2));
  const eventX = lastEnd + 20;
  const svgW = eventX + 120;

  const svg = (
    <svg width={svgW} height={totalH}>
      {bars.map((b, i) => (
        <g key={i}>
          <rect x={b.x1} y={i * (barH + gap)} width={b.x2 - b.x1} height={barH} rx="3" fill="#56779A" />
          <text x={(b.x1 + b.x2) / 2} y={i * (barH + gap) + barH / 2 + 4} textAnchor="middle" fill="#fff" fontSize="14">
            {pattern.intervals[i].code}
          </text>
        </g>
      ))}
      <g>
        <rect x={eventX} y={bars.length * (barH + gap)} width="50" height={barH} rx="3" fill="#8B0000" />
        <text x={eventX + 25} y={bars.length * (barH + gap) + barH / 2 + 4} textAnchor="middle" fill="#fff" fontSize="14">
          {pattern.event.name}
        </text>
      </g>
      <g>
        <line x1={startX - 10} y1={totalH - 40} x2={eventX + 50} y2={totalH - 40} stroke="#000" strokeWidth="2" />
        <polygon points={`${eventX + 50},${totalH - 45} ${eventX + 60},${totalH - 40} ${eventX + 50},${totalH - 35}`} fill="#000" />
        <text x={eventX + 67} y={totalH - 35} fontSize="14" fontWeight="bold">Time</text>
      </g>
    </svg>
  );
  return { svg };
};

/* ======= SVG: מטריצת קשרים (Lower Triangle) ======= */
const renderRelationMatrix = (pattern) => {
  if (!pattern || !Array.isArray(pattern.intervals)) return null;
  const intervals = pattern.intervals;
  const codes = intervals.map((iv) => iv.code);
  const colLabels = codes;
  const rowLabels = [...codes.slice(1), pattern.event.code];

  const numCols = colLabels.length,
    numRows = rowLabels.length;
  const cellSize = 40,
    fontSize = 14,
    pad = 50;

  const rels = pattern.relations || {};
  const getRelationCode = (i, j) => {
    if (i === rowLabels.length - 1) return "b"; // יחסי event – כמו במקור
    const key = `${j}-${i + 1}`;
    return rels[key] ?? "";
  };

  const width = pad + numRows * cellSize;
  const height = pad + numCols * cellSize;

  return (
    <svg width={width} height={height} style={{ display: "block", margin: "0px auto 0" }}>
      {rowLabels.map((label, i) => (
        <g
          key={`top-${i}`}
          transform={`translate(${pad + i * cellSize + cellSize - 20}, ${pad - 15})`}
        >
          <text transform="rotate(45)" textAnchor="end" dominantBaseline="middle" fontSize={fontSize}>
            {label}
          </text>
        </g>
      ))}
      {colLabels.map((label, j) => (
        <text
          key={`side-${j}`}
          x={pad / 2 + 15}
          y={pad + j * cellSize + cellSize / 2}
          textAnchor="end"
          fontSize={fontSize}
          dominantBaseline="middle"
        >
          {label}
        </text>
      ))}
      {colLabels.map((_, j) =>
        rowLabels.map((_, i) => {
          if (i + 1 <= j) return null;
          const relCode = getRelationCode(i, j);
          return (
            <g key={`${i}-${j}`}>
              <rect
                x={pad + i * cellSize}
                y={pad + j * cellSize}
                width={cellSize}
                height={cellSize}
                fill="#f5f5f5"
                stroke="#ccc"
              />
              <text
                x={pad + i * cellSize + cellSize / 2}
                y={pad + j * cellSize + cellSize / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={fontSize}
                fill="#333"
              >
                {relCode}
              </text>
            </g>
          );
        })
      )}
    </svg>
  );
};

/* ======= Main (רק 3 סקשנים: אילוסטרציה+לג’נד+מטריצה, ואז cutoffs) ======= */
export default function PatternDetails({ pattern }) {
  if (!pattern) return null;

  const { svg } = useMemo(() => renderDiagram(pattern), [pattern]);

  return (
    <div className="flex flex-col items-center gap-6">
      <table className="mx-auto border-separate" style={{ borderSpacing: "16px 16px", width: "100%" }}>
        <colgroup>
          <col style={{ width: "50%" }} />
          <col style={{ width: "50%" }} />
        </colgroup>
        <tbody>
          {/* Row 0: Illustration + Legend + Relation Matrix */}
          <tr>
            <td colSpan={2} className="p-0">
              <Section fullHeight>
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                  {svg}
                </div>

                <table className="w-full border-separate" style={{ borderSpacing: "16px 16px" }}>
                  <colgroup>
                    <col style={{ width: "50%" }} />
                    <col style={{ width: "50%" }} />
                  </colgroup>
                  <tbody>
                    <tr>
                      <td className="p-0">
                        <IntervalLegend pattern={pattern} />
                      </td>
                      <td className="p-0">{renderRelationMatrix(pattern)}</td>
                    </tr>
                  </tbody>
                </table>
              </Section>
            </td>
          </tr>

          {/* Row 1: Cut-offs */}
          <tr>
            <td colSpan={2} className="p-0">
              <Section title="Cut-offs" fullHeight>
                <div className="overflow-x-auto">
                  <table
                    className="w-full mx-auto border-collapse"
                    style={{
                      fontSize: FONT_SIZE_TABLE,
                      minWidth: "600px",
                    }}
                  >
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-4 py-3 text-left font-semibold" style={{ fontSize: FONT_SIZE_TABLE_HEADER }}>
                          State ID
                        </th>
                        <th className="border border-gray-300 px-4 py-3 text-left font-semibold" style={{ fontSize: FONT_SIZE_TABLE_HEADER }}>
                          Method Name
                        </th>
                        <th className="border border-gray-300 px-4 py-3 text-center font-semibold" style={{ fontSize: FONT_SIZE_TABLE_HEADER }}>
                          Lower Cutoff
                        </th>
                        <th className="border border-gray-300 px-4 py-3 text-center font-semibold" style={{ fontSize: FONT_SIZE_TABLE_HEADER }}>
                          Upper Cutoff
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(pattern.cutoffs ?? []).map(({ code, methodName, low, high }, index) => (
                        <tr key={code} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="border border-gray-300 px-4 py-3 font-mono font-semibold text-blue-600">
                            {code}
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-gray-700">
                            {methodName || "—"}
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-center font-mono">
                            {low == null ? "−∞" : low}
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-center font-mono">
                            {high == null ? "∞" : high}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
