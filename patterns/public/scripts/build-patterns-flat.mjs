// public/scripts/build-patterns-flat.mjs
import { promises as fs } from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const args = {
    dir: "./public/patterns",              // איפה ה-PKL
    out: "./public/patterns/pattern.json", // קובץ יצוא
    states: "./src/assets/states.csv",     // מיקום ה-states.csv
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dir" && argv[i + 1]) args.dir = argv[++i];
    else if (a === "--out" && argv[i + 1]) args.out = argv[++i];
    else if (a === "--states" && argv[i + 1]) args.states = argv[++i];
  }
  return args;
}

async function listFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries.filter(e => e.isFile()).map(e => e.name);
}

async function ensureDirForFile(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

function splitCsvLineRespectingQuotes(line) {
  return line.match(/(?:"([^"]*)"|[^,])+/g)?.map(cell =>
    cell.replace(/^"(.*)"$/s, "$1").trim()
  ) ?? [];
}

function parseCsvSmart(text) {
  const clean = text.replace(/^\uFEFF/, "");
  const lines = clean.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return { headers: [], rows: [] };
  const headers = splitCsvLineRespectingQuotes(lines[0]).map(h => h.trim());
  const rows = lines.slice(1).map(l => {
    const cols = splitCsvLineRespectingQuotes(l);
    const rec = {};
    headers.forEach((h, i) => (rec[h] = (cols[i] ?? "").trim()));
    return rec;
  });
  return { headers, rows };
}

// מיפוי: StateID -> "Label.BinID"
async function loadStateMapping(statesCsvPath) {
  const csvText = await fs.readFile(statesCsvPath, "utf8");
  const { headers, rows } = parseCsvSmart(csvText);
  const norm = h => h.replace(/\s+/g, "").toLowerCase();
  const hmap = Object.fromEntries(headers.map(h => [norm(h), h]));
  const keyStateID = hmap["stateid"] ?? "StateID";
  const keyLabel   = hmap["label"]   ?? "Label";
  const keyBinID   = hmap["binid"]   ?? "BinID";

  const mapping = {};
  for (const row of rows) {
    const sid = Number(row[keyStateID]);
    if (Number.isNaN(sid)) continue;
    const label = String(row[keyLabel] ?? "").trim();
    const binID = String(row[keyBinID] ?? "").trim();
    mapping[sid] = `${label}.${binID}`;
  }
  return mapping;
}

// פענוח שם .pkl → { stateIds, tailVals }
function parseModelFilenameFlat(fname) {
  const base = fname.replace(/\.pkl$/i, "");
  const rawTokens = base.split(/[_\-,]+/).filter(Boolean); // ["2","1","999","0"] ...
  const tokens = rawTokens.slice(1); // <-- חשוב: זורקים את הטוקן הראשון

  const idx = tokens.indexOf("999");
  let stateIds = [], tailVals = [];

  if (idx === -1) {
    stateIds = tokens.map(t => Number(t)).filter(n => !Number.isNaN(n));
  } else {
    stateIds = tokens.slice(0, idx).map(t => Number(t)).filter(n => !Number.isNaN(n));
    tailVals = tokens.slice(idx + 1); // מחרוזות
  }
  return { stateIds, tailVals };
}


async function main() {
  const { dir, out, states } = parseArgs(process.argv);

  try { await fs.access(dir); }
  catch { console.error(`Folder not found: ${dir}`); process.exit(1); }

  let stateMap = {};
  try {
    stateMap = await loadStateMapping(states);
  } catch (e) {
    console.error(`Failed to load states.csv from ${states}: ${e.message}`);
    process.exit(1);
  }

  const files = (await listFiles(dir))
    .filter(f => f.toLowerCase().endsWith(".pkl"))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));

  const patterns = {}; // pattern_id: [state_ids, labels, tail_vals]
  let pid = 0;

  for (const fname of files) {
    const { stateIds, tailVals } = parseModelFilenameFlat(fname);
    if (!stateIds.length) continue;
    const labels = stateIds.map(sid => stateMap[sid] ?? String(sid));
    patterns[pid] = [stateIds, labels, tailVals];
    pid += 1;
  }

  await ensureDirForFile(out);
  await fs.writeFile(out, JSON.stringify(patterns, null, 2) + "\n", "utf8");
  console.log(`Wrote ${out} (${Object.keys(patterns).length} patterns)`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
