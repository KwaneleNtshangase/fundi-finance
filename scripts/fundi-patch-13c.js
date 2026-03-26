#!/usr/bin/env node
// fundi-patch-13c.js — find the exact course filter and wire fuzzyMatch

const fs = require("fs");
let changes = 0;

function patch(file, desc, search, replace) {
  let content = fs.readFileSync(file, "utf8");
  if (!content.includes(search)) { console.log(`⚠️  NOT FOUND: ${desc}`); return false; }
  fs.writeFileSync(file, content.replace(search, replace), "utf8");
  console.log(`✅  ${desc}`);
  changes++;
  return true;
}

const P = "src/app/page.tsx";
const content = fs.readFileSync(P, "utf8");

// ── Step 1: Find all lines with 'filter' and 'search' near LearnView ──────────
const lines = content.split('\n');
console.log("ℹ️  Scanning for filter patterns...\n");

lines.forEach((line, i) => {
  if ((line.includes('filter') || line.includes('filtered')) && 
      (line.includes('search') || line.includes('course') || line.includes('title'))) {
    console.log(`  Line ${i + 1}: ${line.trim()}`);
  }
});

console.log("\n─────────────────────────────────────────\n");

// ── Step 2: Try to find the filtered courses variable ─────────────────────────
// Look for common patterns used to filter courses
const tryPatterns = [
  // After search state, courses are filtered
  {
    desc: "wire fuzzyMatch — courses.filter with search",
    search: `courses.filter(c => c.title.toLowerCase().includes(search.toLowerCase()))`,
    replace: `courses.filter(c => fuzzyMatch(c.title, search) || fuzzyMatch(c.description ?? "", search))`
  },
  {
    desc: "wire fuzzyMatch — CONTENT_DATA.courses filter",
    search: `CONTENT_DATA.courses.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()))`,
    replace: `CONTENT_DATA.courses.filter((c) => fuzzyMatch(c.title, search) || fuzzyMatch(c.description ?? "", search))`
  },
  {
    desc: "wire fuzzyMatch — courses filter multi-line v1",
    search: `.filter(c =>
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.description?.toLowerCase().includes(search.toLowerCase())
      )`,
    replace: `.filter(c =>
        fuzzyMatch(c.title, search) ||
        fuzzyMatch(c.description ?? "", search)
      )`
  },
  {
    desc: "wire fuzzyMatch — courses filter multi-line v2 (2 spaces)",
    search: `.filter(c =>
          c.title.toLowerCase().includes(search.toLowerCase()) ||
          c.description?.toLowerCase().includes(search.toLowerCase())
        )`,
    replace: `.filter(c =>
          fuzzyMatch(c.title, search) ||
          fuzzyMatch(c.description ?? "", search)
        )`
  },
  {
    desc: "wire fuzzyMatch — inline ternary search filter",
    search: `: CONTENT_DATA.courses.filter(c => c.title.toLowerCase().includes(search.toLowerCase()))`,
    replace: `: CONTENT_DATA.courses.filter(c => fuzzyMatch(c.title, search) || fuzzyMatch(c.description ?? "", search))`
  },
];

let applied = false;
for (const p of tryPatterns) {
  if (patch(P, p.desc, p.search, p.replace)) {
    applied = true;
    break;
  }
}

if (!applied) {
  // Show context around the search state to find the filter
  const searchStateIdx = lines.findIndex(l => l.includes("useState") && l.includes('search') && l.includes('""'));
  if (searchStateIdx >= 0) {
    console.log(`ℹ️  Search state at line ${searchStateIdx + 1}. Showing surrounding context:`);
    const start = Math.max(0, searchStateIdx);
    const end = Math.min(lines.length, searchStateIdx + 60);
    lines.slice(start, end).forEach((l, i) => {
      if (l.includes('filter') || l.includes('filtered') || l.includes('search') || l.includes('course')) {
        console.log(`  ${start + i + 1}: ${l}`);
      }
    });
  }

  // Last resort: inject a filtered variable right after the search state
  const searchState = `  const [search, setSearch] = useState("");`;
  if (content.includes(searchState)) {
    const refreshed = fs.readFileSync(P, "utf8");
    // Check if fuzzyMatch-based filtered var already exists
    if (!refreshed.includes('fuzzyMatch(c.title')) {
      patch(P,
        "inject filtered courses using fuzzyMatch after search state",
        `  const [search, setSearch] = useState("");`,
        `  const [search, setSearch] = useState("");
  // Fuzzy-filtered courses
  const filteredCourses = search.trim()
    ? CONTENT_DATA.courses.filter(c =>
        fuzzyMatch(c.title, search) || fuzzyMatch(c.description ?? "", search)
      )
    : CONTENT_DATA.courses;`
      );

      // Now replace any reference to CONTENT_DATA.courses in the render that should use filteredCourses
      // Look for .map on courses near the search area (in LearnView JSX)
      patch(P,
        "use filteredCourses in render instead of CONTENT_DATA.courses",
        `{CONTENT_DATA.courses.map((course, courseIndex) => (`,
        `{(search.trim() ? filteredCourses : CONTENT_DATA.courses).map((course, courseIndex) => (`
      );
    }
  }
}

console.log(`\n${changes} changes applied.`);
if (changes === 0) {
  console.log("\nℹ️  The search filter uses a pattern not covered above.");
  console.log("    Please run: grep -n 'filter\\|filtered\\|search' src/app/page.tsx | grep -i 'course\\|title' | head -20");
  console.log("    Paste the output and I'll write a targeted fix.");
} else {
  console.log("Now run: npm run build && npx vercel --prod");
}
