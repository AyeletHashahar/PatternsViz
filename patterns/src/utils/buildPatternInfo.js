// src/utils/buildPatternInfo.js
// בונה מילון לפי המפרט: intervals, relations, event, cutoffs
// מקור נתונים: pattern.json + states.csv

import { shortenIntervalName } from './intervalMapper.js';

// --- CSV parser קטן (תומך בגרשיים/פסיקים) ---
function splitCsvLine(line) {
  const re = /"([^"]*)"|[^,]+/g;
  const out = [];
  let m;
  while ((m = re.exec(line)) !== null) {
    out.push(m[1] != null ? m[1] : m[0]);
  }
  return out.map(s => String(s).trim());
}
function parseCsv(text) {
  const clean = text.replace(/^\uFEFF/, "");
  const lines = clean.split(/\r?\n/).filter(l => l.trim().length);
  if (!lines.length) return { headers: [], rows: [] };
  const headers = splitCsvLine(lines[0]).map(h => h.trim());
  const rows = lines.slice(1).map(l => {
    const cols = splitCsvLine(l);
    const rec = {};
    headers.forEach((h, i) => (rec[h] = (cols[i] ?? "").trim()));
    return rec;
  });
  return { headers, rows };
}

// --- טעינת קבצים (דרך fetch של הדפדפן) ---
async function loadPatternJson(url = "/patterns_td4c/pattern.json") {
  const res = await fetch(url, { cache: "no-cache" });
  if (!res.ok) throw new Error(`Failed to load ${url}`);
  return res.json();
}
async function loadStatesCsv(url = "/src/assets/states.csv") {
  const res = await fetch(url, { cache: "no-cache" });
  if (!res.ok) throw new Error(`Failed to load ${url}`);
  const text = await res.text();
  return parseCsv(text);
}

// --- מיפוי יחסים ברירת מחדל: מספר -> קוד אלן (b,m,o,f,c,s,=) ---
// החליפי לפי ה-RELATION_MAPPING שלך אם צריך
export const DEFAULT_RELATION_MAP = {
  0: "b",  // before
  1: "m",  // meets
  2: "o",  // overlaps
  3: "f",  // finishes
  4: "c",  // contains
  5: "s",  // starts
  6: "e",  // equal
};

function toNumberOrNull(x) {
  if (x == null || x === "") return null;
  const n = Number(x);
  return Number.isNaN(n) ? null : n;
}

/**
 * בונה את המילון לפטרן בודד
 * @param {Object} opts
 * @param {number} opts.patternId
 * @param {string} opts.eventName            - שם האירוע (יופיע גם ב-legend)
 * @param {string} [opts.patternJsonUrl]     - ברירת מחדל: /patterns/pattern.json
 * @param {string} [opts.statesCsvUrl]       - ברירת מחדל: /src/assets/states.csv
 * @param {Object} [opts.relationMap]        - map: number -> code (אם לא – יש DEFAULT_RELATION_MAP)
 */
export async function buildPatternInfo({
  patternId,
  eventName,
  patternJsonUrl = "/patterns_EW_and_gradient/pattern.json",
  statesCsvUrl   = "/src/assets/states.csv",
  relationMap    = DEFAULT_RELATION_MAP,
}) {
  // 1) טוענים pattern.json
  const patterns = await loadPatternJson(patternJsonUrl);
  const arr = patterns[String(patternId)] || patterns[patternId];
  if (!arr) throw new Error(`pattern_id ${patternId} not found in pattern.json`);

  // arr = [state_ids, labels, tail_vals, pattern_name, vertical_support, horizontal_support, mean_duration]
  const stateIds = Array.isArray(arr[0]) ? arr[0] : [];
  const labels   = Array.isArray(arr[1]) ? arr[1] : [];
  const tailVals = Array.isArray(arr[2]) ? arr[2] : []; // מספרים כמחרוזות
  const patternName = String(arr[3] || ""); // שם הדפוס החדש
  const verticalSupport = arr[4] !== undefined ? Number(arr[4]) : null; // Vertical Support statistics
  const horizontalSupport = arr[5] !== undefined ? Number(arr[5]) : null; // Mean Horizontal Support statistics
  const meanDuration = arr[6] !== undefined ? Number(arr[6]) : null; // Mean Mean Duration statistics

  // 2) קוד לכל אינטרוול - שימוש בשמות מקוצרים במקום I1, I2, etc.
  const codeMap = {};
  stateIds.forEach((_, i) => { 
    const shortenedName = shortenIntervalName(labels[i]);
    codeMap[labels[i]] = shortenedName;
  });
  codeMap[eventName] = "event";

  // 3) states.csv → חיתוכים + לייבלים
  const { headers, rows } = await loadStatesCsv(statesCsvUrl);

  // מזהי כותרות (case-insensitive)
  const norm = h => h.replace(/\s+/g, "").toLowerCase();
  const hmap = Object.fromEntries(headers.map(h => [norm(h), h]));

  const keyStateID = hmap["stateid"] ?? "StateID";
  const keyLabel   = hmap["label"]   ?? "Label";
  const keyBinID   = hmap["binid"]   ?? "BinID";
  const keyBinLow  = hmap["binlow"]  ?? "BinLow";
  const keyBinHigh = hmap["binhigh"] ?? "BinHigh";
  const keyMethodName = hmap["methodname"] ?? "MethodName";

  // 4) בניית intervals + cutoffs_table
  const intervals = [];
  const cutoffsTable = [];

  for (let i = 0; i < stateIds.length; i++) {
    const sid = Number(stateIds[i]);
    const lbl = String(labels[i]);

    const slice = rows.filter(r => Number(r[keyStateID]) === sid).map(r => ({
      [keyStateID]: Number(r[keyStateID]),
      [keyLabel]:   String(r[keyLabel]),
      [keyBinID]:   String(r[keyBinID]),
      [keyBinLow]:  toNumberOrNull(r[keyBinLow]),
      [keyBinHigh]: toNumberOrNull(r[keyBinHigh]),
      [keyMethodName]: String(r[keyMethodName]),
    }));

    const code = codeMap[lbl];
    intervals.push({
      label:    lbl,
      state_id: sid,
      code,
      cutoffs:  slice,            // כמו בפייתון: to_dict(orient="records")
    });

    const first = slice[0] || {};
    cutoffsTable.push({
      code,
      low:  first[keyBinLow]  ?? null,
      high: first[keyBinHigh] ?? null,
      methodName: first[keyMethodName] ?? "",
    });
  }

  // 5) relations – לפי tail_vals והמיפוי המספרי→קוד, בסדר הזוגות (i<j)
  const listRel = tailVals.map(t => relationMap[Number(t)]);
  const relations = {};
  let k = 0;
  for (let j = 1; j < stateIds.length; j++) {
    for (let i = 0; i < j; i++) {
      relations[`${i}-${j}`] = listRel[k++];
    }
  }

  // 6) המילון הסופי (רק השדות שביקשת)
  return {
    intervals,
    relations,
    event: { name: eventName, code: "event" },
    cutoffs: cutoffsTable,
    patternName, // שם הדפוס החדש
    verticalSupport, // Vertical Support statistics
    horizontalSupport, // Mean Horizontal Support statistics
    meanDuration, // Mean Mean Duration statistics
  };
}

// --- Build all patterns at once (loads pattern.json & states.csv once) ---
export async function buildAllPatternsInfo({
  eventName,
  patternJsonUrl = "/patterns_td4c/pattern.json",
  statesCsvUrl   = "/src/assets/states.csv",
  relationMap    = DEFAULT_RELATION_MAP,
  maxPatterns    = Infinity, // אפשר להגביל אם רוצים
} = {}) {
  // נטען פעם אחת
  const patterns = await (await fetch(patternJsonUrl, { cache: "no-cache" })).json();

  // ה-CSV (נשתמש באותם עזרי פרסינג של הקובץ)
  const csvText = await (await fetch(statesCsvUrl, { cache: "no-cache" })).text();
  const clean = csvText.replace(/^\uFEFF/, "");
  const lines = clean.split(/\r?\n/).filter(l => l.trim().length);
  const headers = (lines[0]?.match(/"([^"]*)"|[^,]+/g) || []).map(x => x.replace(/^"(.*)"$/s, "$1").trim());
  const rows = lines.slice(1).map(l => {
    const cols = (l.match(/"([^"]*)"|[^,]+/g) || []).map(x => x.replace(/^"(.*)"$/s, "$1").trim());
    const rec = {}; headers.forEach((h, i) => rec[h] = (cols[i] ?? "").trim()); return rec;
  });

  const norm = h => h.replace(/\s+/g, "").toLowerCase();
  const hmap = Object.fromEntries(headers.map(h => [norm(h), h]));
  const keyStateID = hmap["stateid"] ?? "StateID";
  const keyLabel   = hmap["label"]   ?? "Label";
  const keyBinID   = hmap["binid"]   ?? "BinID";
  const keyBinLow  = hmap["binlow"]  ?? "BinLow";
  const keyBinHigh = hmap["binhigh"] ?? "BinHigh";
  const keyMethodName = hmap["methodname"] ?? "MethodName";

  const toNumberOrNull = (x) => { if (x == null || x === "") return null; const n = Number(x); return Number.isNaN(n) ? null : n; };

  const entries = Object.entries(patterns)
    .sort(([a], [b]) => Number(a) - Number(b))
    .slice(0, isFinite(maxPatterns) ? maxPatterns : undefined);

  const all = [];
  for (const [pidStr, arr] of entries) {
    const patternId = Number(pidStr);
    const stateIds  = Array.isArray(arr?.[0]) ? arr[0] : [];
    const labels    = Array.isArray(arr?.[1]) ? arr[1] : [];
    const tailVals  = Array.isArray(arr?.[2]) ? arr[2] : [];
    const patternName = String(arr?.[3] || ""); // שם הדפוס החדש
    const verticalSupport = arr?.[4] !== undefined ? Number(arr[4]) : null; // Vertical Support statistics
    const horizontalSupport = arr?.[5] !== undefined ? Number(arr[5]) : null; // Mean Horizontal Support statistics
    const meanDuration = arr?.[6] !== undefined ? Number(arr[6]) : null; // Mean Mean Duration statistics

    // code map - שימוש בשמות מקוצרים במקום I1, I2, etc.
    const codeMap = {};
    stateIds.forEach((_, i) => {
      const shortenedName = shortenIntervalName(labels[i]);
      codeMap[labels[i]] = shortenedName;
    });
    codeMap[eventName] = "event";

    // intervals + cutoffs table
    const intervals = [];
    const cutoffs = [];
    for (let i = 0; i < stateIds.length; i++) {
      const sid = Number(stateIds[i]);
      const lbl = String(labels[i]);
      const slice = rows
        .filter(r => Number(r[keyStateID]) === sid)
        .map(r => ({
          [keyStateID]: Number(r[keyStateID]),
          [keyLabel]:   String(r[keyLabel]),
          [keyBinID]:   String(r[keyBinID]),
          [keyBinLow]:  toNumberOrNull(r[keyBinLow]),
          [keyBinHigh]: toNumberOrNull(r[keyBinHigh]),
          [keyMethodName]: String(r[keyMethodName]),
        }));
      const code = codeMap[lbl];
      intervals.push({ label: lbl, state_id: sid, code, cutoffs: slice });
      const first = slice[0] || {};
      cutoffs.push({ code, low: first[keyBinLow] ?? null, high: first[keyBinHigh] ?? null, methodName: first[keyMethodName] ?? "" });
    }

    // relations לפי tail_vals (i<j)
    const relations = {};
    let k = 0;
    const listRel = tailVals.map(t => relationMap[Number(t)]);
    for (let j = 1; j < stateIds.length; j++) {
      for (let i = 0; i < j; i++) relations[`${i}-${j}`] = listRel[k++] ?? "";
    }

    all.push({
      pattern_id: patternId,
      intervals,
      relations,
      event: { name: eventName, code: "event" },
      cutoffs,
      patternName, // שם הדפוס החדש
      verticalSupport, // Vertical Support statistics
      horizontalSupport, // Mean Horizontal Support statistics
      meanDuration, // Mean Mean Duration statistics
    });
  }

  return all;
}

