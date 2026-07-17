/**
 * Merchant string cleaning for reports.
 *
 * Bank statement descriptions arrive as raw strings with amounts, fee
 * suffixes and channel prefixes baked in, e.g.
 *   "Samke-22,000.00 Fee: Payshap Sent R7.50"
 *   "DALITSO GROUP-15,000.00 ELECT..."
 *   "FNB App Payment To Mama Coka Imizamo"
 * The report should show the counterparty, not the plumbing.
 */

/** Channel/verb prefixes that precede the actual counterparty name. */
const PREFIXES: RegExp[] = [
  /^(fnb|capitec|absa|nedbank|standard bank|tyme(bank)?|discovery bank)\b[\s:,-]*/i,
  /^(app|online|internet|cellphone|mobile)\s+(banking\s+)?/i,
  /^(payment|paym?t|pmt)\s+(to|from)\b[\s:,-]*/i,
  /^(pay\s+)?(payshap|shap)\s+(payment\s+)?(to|from|sent|rcvd|received)?\b[\s:,-]*/i,
  /^(pos|card)\s+(purchase|payment)\b[\s:,-]*/i,
  /^(debit\s+order|debit\s+ord|magtape\s+(debit|credit)|eft\s+(debit|credit)|immediate\s+trf|internet\s+trf|realtime\s+(payment|credit))\b[\s:,-]*/i,
  /^(send\s+money|cash\s+send|e-?wallet)\b[\s:,-]*/i,
  /^(to|from)\s+/i,
];

/** Trailing noise: fee suffixes, channel codes, references, card numbers. */
const SUFFIXES: RegExp[] = [
  /\bfee[:\s].*$/i,
  /\belect(ronic)?\b.*$/i,
  /\b(ref(erence)?( no)?\.?|reference)[:\s#]*\S*.*$/i,
  /\bcard\s*(no\.?|number)?\s*[x*\d]{4,}.*$/i,
  /\b\d{6,}\b.*$/,
];

/** Embedded amounts: "-22,000.00", "R7.50", "15 000.00". */
const AMOUNTS = /-?\s?R?\s?\d{1,3}([ ,]\d{3})*([.,]\d{2})\b/g;

function titleCase(s: string): string {
  return s.replace(/\b([a-z])([a-z']*)/gi, (_m, a: string, b: string) => a.toUpperCase() + b.toLowerCase());
}

/**
 * Clean a raw transaction description into a display-ready merchant name.
 * Returns "Unlabelled" when nothing usable remains.
 */
export function cleanMerchantName(raw: string | null | undefined, max = 34): string {
  let s = (raw ?? "").trim();
  if (!s || s === "(no description)") return "Unlabelled";

  s = s.replace(AMOUNTS, " ");
  for (const rx of SUFFIXES) s = s.replace(rx, " ");
  for (let pass = 0; pass < 3; pass++) {
    for (const rx of PREFIXES) s = s.replace(rx, "");
  }
  s = s.replace(/[|_]+/g, " ");
  s = s.replace(/\s*[-–—:,]+\s*$/g, "");
  s = s.replace(/^\s*[-–—:,]+\s*/g, "");
  s = s.replace(/\s+/g, " ").trim();

  if (!s || /^[\W\d\s]*$/.test(s)) return "Unlabelled";
  s = titleCase(s);
  return s.length > max ? `${s.slice(0, max).trimEnd()}…` : s;
}

/**
 * Grouping key for a raw description: cleaned + lowercased so that
 * "FNB App Payment To Mama Coka" and "mama coka-500.00" merge.
 */
export function merchantKey(raw: string | null | undefined): string {
  return cleanMerchantName(raw, 200).toLowerCase();
}
