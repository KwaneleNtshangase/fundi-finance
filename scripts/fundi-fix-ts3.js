/**
 * fundi-fix-ts3.js — Fix route useState initializer type error
 *
 * TypeScript can't infer { name: Route["name"] } as a valid Route union member.
 * Fix: cast the return value as Route explicitly.
 */
const fs = require("fs");
const path = require("path");

const PAGE = path.join(__dirname, "../src/app/page.tsx");
let src = fs.readFileSync(PAGE, "utf8");

const OLD = `  const [route, setRoute] = useState<Route>(() => {
    if (typeof window === "undefined") return { name: "learn" };
    const saved = localStorage.getItem("fundi-last-route");
    // Restore simple routes only (not mid-lesson or mid-course — those need extra state)
    const simpleRoutes = ["learn", "calculator", "profile", "leaderboard", "settings"];
    if (saved && simpleRoutes.includes(saved)) return { name: saved as Route["name"] };
    return { name: "learn" };
  });`;

const NEW = `  const [route, setRoute] = useState<Route>(() => {
    if (typeof window === "undefined") return { name: "learn" } as Route;
    const saved = localStorage.getItem("fundi-last-route");
    const simpleRoutes = ["learn", "calculator", "profile", "leaderboard", "settings"];
    if (saved && simpleRoutes.includes(saved)) return { name: saved } as Route;
    return { name: "learn" } as Route;
  });`;

if (!src.includes(OLD)) {
  console.error("❌ Marker not found");
  process.exit(1);
}

src = src.replace(OLD, NEW);
fs.writeFileSync(PAGE, src);
console.log("✅ Fixed route initializer type — added 'as Route' casts");
console.log("Now run: npm run build");
