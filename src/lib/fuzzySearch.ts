/**
 * Fuzzy Search Engine for the Fundi Finance Course Directory
 *
 * Zero-dependency, client-side fuzzy search with:
 * - Optimised Levenshtein distance (single-row DP, early exit)
 * - Lightweight English stemmer for prefix/suffix matching
 * - Weighted field scoring (title > concept tags > description)
 * - "Did you mean?" fallback when results are empty
 */

import type { Course } from "@/data/content";
import type { Concept } from "@/data/concepts";

// ─── Types ───────────────────────────────────────────────────────────────────

export type IndexEntry = {
  courseId: string;
  title: string;
  description: string;
  titleTokens: string[];
  tagTokens: string[];
  descTokens: string[];
};

export type FuzzySearchResult = {
  courseId: string;
  score: number;
  /** Which field contributed the highest-scoring match */
  matchedField: "title" | "tags" | "description";
};

// ─── Levenshtein Distance ────────────────────────────────────────────────────
// Single-row DP (O(min(m,n)) space) with early-exit when distance > maxDist.

export function levenshtein(a: string, b: string, maxDist?: number): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  // Keep the shorter string in `b` for the single-row optimisation
  if (a.length < b.length) {
    [a, b] = [b, a];
  }

  const bLen = b.length;
  const row = new Uint16Array(bLen + 1);

  // Initialise row: [0, 1, 2, ..., bLen]
  for (let j = 0; j <= bLen; j++) row[j] = j;

  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    let rowMin = row[0]; // Track minimum value in this row for early exit

    for (let j = 1; j <= bLen; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const val = Math.min(
        row[j] + 1,       // deletion
        row[j - 1] + 1,   // insertion
        prev + cost        // substitution
      );
      prev = row[j];
      row[j] = val;
      if (val < rowMin) rowMin = val;
    }

    // Early exit: if every value in this row exceeds maxDist, we can't improve
    if (maxDist !== undefined && rowMin > maxDist) return maxDist + 1;
  }

  return row[bLen];
}

// ─── Lightweight Stemmer ─────────────────────────────────────────────────────
// Strips common English suffixes so "investing" / "investment" → "invest"

const SUFFIX_RULES: [RegExp, string][] = [
  [/ies$/i, "y"],
  [/tion$/i, "t"],     // e.g. "protection" → "protect"
  [/ment$/i, ""],      // e.g. "investment" → "invest"
  [/ness$/i, ""],      // e.g. "awareness" → "aware"
  [/able$/i, ""],      // e.g. "insurable" → "insur"
  [/ible$/i, ""],      // e.g. "deductible" → "deduct"
  [/ous$/i, ""],       // e.g. "dangerous" → "danger"
  [/ive$/i, ""],       // e.g. "progressive" → "progress"
  [/ful$/i, ""],       // e.g. "careful" → "care"
  [/less$/i, ""],      // e.g. "careless" → "care"
  [/ing$/i, ""],       // e.g. "investing" → "invest"
  [/ting$/i, "t"],     // e.g. "budgeting" → "budget" (applied after -ing)
  [/ed$/i, ""],        // e.g. "insured" → "insur"
  [/(?<=[a-z])er$/i, ""],  // e.g. "lender" → "lend"  (requires preceding letter)
  [/([a-z])\1est$/i, ""],  // e.g. "biggest" → "bigg" (only doubled-consonant superlatives)
  [/ly$/i, ""],        // e.g. "monthly" → "month"
  [/s$/i, ""],         // e.g. "taxes" → "taxe" (further cleaning via min length)
];

export function simpleStem(word: string): string {
  let w = word.toLowerCase();
  if (w.length <= 3) return w; // Too short to stem

  for (const [pattern, replacement] of SUFFIX_RULES) {
    const result = w.replace(pattern, replacement);
    // Only accept the stem if it's at least 3 characters
    if (result !== w && result.length >= 3) {
      w = result;
      break; // Apply only the first matching rule
    }
  }

  return w;
}

// ─── Tokeniser ───────────────────────────────────────────────────────────────

function tokenise(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")  // strip punctuation except hyphens
    .split(/[\s-]+/)
    .filter(w => w.length > 0);
}

function stemTokenise(text: string): string[] {
  return tokenise(text).map(simpleStem);
}

// ─── Index Builder ───────────────────────────────────────────────────────────

export function buildSearchIndex(
  courses: Course[],
  concepts: Concept[]
): IndexEntry[] {
  // Pre-compute concept tags per course ID
  const conceptsByCourse = new Map<string, string[]>();
  for (const concept of concepts) {
    for (const courseId of concept.courses) {
      const existing = conceptsByCourse.get(courseId) ?? [];
      // Add both the concept name and its category as tags
      existing.push(concept.name, concept.category);
      conceptsByCourse.set(courseId, existing);
    }
  }

  return courses.map(course => {
    const tags = conceptsByCourse.get(course.id) ?? [];
    // Deduplicate tag text before tokenising
    const uniqueTags = [...new Set(tags)].join(" ");

    return {
      courseId: course.id,
      title: course.title,
      description: course.description,
      titleTokens: stemTokenise(course.title),
      tagTokens: stemTokenise(uniqueTags),
      descTokens: stemTokenise(course.description),
    };
  });
}

// ─── Field Weights ───────────────────────────────────────────────────────────

const FIELD_WEIGHT = {
  title: 3,
  tags: 2,
  description: 1,
} as const;

type FieldName = keyof typeof FIELD_WEIGHT;

// ─── Token Matching ──────────────────────────────────────────────────────────

/**
 * Score a single query token against a list of target tokens.
 * Returns the best score for this token across all targets (0..1).
 */
function scoreTokenAgainstField(
  queryToken: string,
  fieldTokens: string[],
  maxDist: number
): number {
  let bestScore = 0;

  for (const target of fieldTokens) {
    // 1. Exact match → full score
    if (target === queryToken) return 1;

    // 2. Prefix match (query is prefix of target, or target is prefix of query)
    if (target.startsWith(queryToken) || queryToken.startsWith(target)) {
      // Score based on overlap ratio
      const overlap = Math.min(queryToken.length, target.length);
      const maxLen = Math.max(queryToken.length, target.length);
      const prefixScore = 0.85 * (overlap / maxLen);
      if (prefixScore > bestScore) bestScore = prefixScore;
      continue; // No need to compute Levenshtein if prefix matched
    }

    // 3. Fuzzy match via Levenshtein
    const dist = levenshtein(queryToken, target, maxDist);
    if (dist <= maxDist) {
      // Decay score by distance: dist=1 → 0.6, dist=2 → 0.35
      const fuzzyScore = dist === 1 ? 0.6 : 0.35;
      if (fuzzyScore > bestScore) bestScore = fuzzyScore;
    }
  }

  return bestScore;
}

// ─── Main Search ─────────────────────────────────────────────────────────────

export function fuzzySearch(
  query: string,
  index: IndexEntry[]
): FuzzySearchResult[] {
  const queryTokens = stemTokenise(query);
  if (queryTokens.length === 0) return [];

  // Compute max edit distance for each query token
  const queryMaxDists = queryTokens.map(t => (t.length > 5 ? 2 : 1));

  const results: FuzzySearchResult[] = [];

  for (const entry of index) {
    let totalScore = 0;
    let bestField: FieldName = "description";
    let bestFieldScore = 0;

    // For each query token, find the best matching field
    for (let qi = 0; qi < queryTokens.length; qi++) {
      const qToken = queryTokens[qi];
      const maxDist = queryMaxDists[qi];

      const fields: [FieldName, string[]][] = [
        ["title", entry.titleTokens],
        ["tags", entry.tagTokens],
        ["description", entry.descTokens],
      ];

      let tokenBestScore = 0;

      for (const [fieldName, fieldTokens] of fields) {
        const raw = scoreTokenAgainstField(qToken, fieldTokens, maxDist);
        const weighted = raw * FIELD_WEIGHT[fieldName];
        if (weighted > tokenBestScore) {
          tokenBestScore = weighted;
        }
        // Track which field contributed the top score across all query tokens
        if (weighted > bestFieldScore) {
          bestFieldScore = weighted;
          bestField = fieldName;
        }
      }

      totalScore += tokenBestScore;
    }

    // Normalise: average across query tokens
    const normalisedScore = totalScore / queryTokens.length;

    // Minimum threshold — discard noise
    if (normalisedScore > 0.3) {
      results.push({
        courseId: entry.courseId,
        score: normalisedScore,
        matchedField: bestField,
      });
    }
  }

  // Sort descending by score
  results.sort((a, b) => b.score - a.score);

  return results;
}

// ─── "Did You Mean?" Suggestion ──────────────────────────────────────────────

export function getSuggestion(
  query: string,
  index: IndexEntry[]
): string | null {
  const queryTokens = tokenise(query); // Use raw tokens, not stemmed
  if (queryTokens.length === 0) return null;

  // Collect all unique raw tokens from the index vocabulary
  const vocab = new Set<string>();
  for (const entry of index) {
    for (const t of tokenise(entry.title)) vocab.add(t);
    for (const t of tokenise(entry.description)) vocab.add(t);
    // Also include raw concept tag tokens
    for (const t of tokenise(
      [...new Set([...entry.tagTokens])].join(" ")
    )) {
      vocab.add(t);
    }
  }

  const vocabArr = Array.from(vocab);
  const corrected: string[] = [];
  let anyChange = false;

  for (const qToken of queryTokens) {
    // If the token exists exactly, keep it
    if (vocab.has(qToken)) {
      corrected.push(qToken);
      continue;
    }

    // Find closest match within edit distance 3
    let bestWord = qToken;
    let bestDist = 4; // > max threshold

    for (const candidate of vocabArr) {
      // Quick length filter: distance can't be less than length difference
      if (Math.abs(candidate.length - qToken.length) >= bestDist) continue;

      const dist = levenshtein(qToken, candidate, bestDist - 1);
      if (dist < bestDist) {
        bestDist = dist;
        bestWord = candidate;
        if (dist === 1) break; // Good enough
      }
    }

    if (bestWord !== qToken) anyChange = true;
    corrected.push(bestWord);
  }

  return anyChange ? corrected.join(" ") : null;
}
