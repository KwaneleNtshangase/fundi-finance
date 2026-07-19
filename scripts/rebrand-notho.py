#!/usr/bin/env python3
"""
Fundi Finance -> Notho rebrand.

Safety model
------------
Two classes of string must survive untouched:

1. Finance vocabulary. "funding" literally contains "fundi", so a naive
   s/fundi/notho/i turns "funding" into "nothong" and "refunding" into
   "renothong". Every rule below is word-boundary anchored, which makes
   fund / funds / funded / funding / refund / fundamentals unmatchable.

2. Live domain surface. fundiapp.co.za is still the production domain and
   mail sender, and fundi-bimi.svg is referenced by a DNS BIMI record.
   These are masked before replacement and restored afterwards, so they
   are byte-identical when the script finishes.

Run with --dry to preview, --apply to write.
"""
import os
import re
import sys
import json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SKIP_DIRS = {
    "node_modules", ".next", ".git", "test-results", "playwright-report",
    ".vercel", "brand", ".sixth", ".cursor",
}
SKIP_FILES = {"tsconfig.tsbuildinfo", "rebrand-notho.py"}
TEXT_EXT = {
    ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".css", ".scss", ".json",
    ".md", ".html", ".htm", ".sql", ".py", ".sh", ".yml", ".yaml", ".svg",
    ".txt", ".env", ".local",
}

# ---------------------------------------------------------------- protection
# Masked before any rule runs, restored verbatim at the end.
PROTECTED = [
    "fundiapp.co.za",     # production domain + mail sender, not migrating yet
    "fundi.co.za",        # secondary domain
    "fundi-bimi.svg",     # filename is bound to a DNS BIMI record
]

# ------------------------------------------------------------------- renames
# Order matters: mascot-specific rules run before the generic identifier rule,
# and the two-word brand runs before the one-word brand.
RULES = [
    # -- mascot: Fundi the coach becomes Cosmo -----------------------------
    (r"\bFundi Coach\b",                    "Coach Cosmo"),
    (r"\bFundiCoachChat\b",                 "CosmoCoachChat"),
    (r"\bFundiCoachCard\b",                 "CosmoCoachCard"),
    (r"\bFundiCharacter\b",                 "CosmoCharacter"),
    (r"\bFundiExpression\b",                "CosmoExpression"),
    (r"characters/fundi-",                  "characters/cosmo-"),
    (r"\bFundi (\$\{expression\})",         r"Cosmo \1"),
    (r"\bfundi-(default|thinking|sad|celebrating)\b", r"cosmo-\1"),

    # -- brand: two-word form ---------------------------------------------
    (r"\bFundi Finance\b",                  "Notho"),
    (r"\bFUNDI FINANCE\b",                  "NOTHO"),
    (r"\bFundi[_-]Finance\b",               "Notho"),
    (r"\bfundi[_-]finance\b",               "notho"),
    (r"\bFundi\s+Finance\b",                "Notho"),

    # -- code identifiers: FundiFoo -> NothoFoo ----------------------------
    (r"\buseFundi\b",                       "useNotho"),
    (r"\buseFundi([A-Z])",                  r"useNotho\1"),
    (r"\bFundi([A-Z])",                     r"Notho\1"),

    # -- remaining standalone word ----------------------------------------
    (r"\bFundi\b",                          "Notho"),
    (r"\bFUNDI\b",                          "NOTHO"),
    (r"\bfundi\b",                          "notho"),
    (r"\bfundi-(logo|reduced-motion)\b",    r"notho-\1"),
]

# Words that must never change. Asserted after every file transform.
FINANCE_WORDS = [
    "fund", "funds", "funded", "funding", "refund", "refunds", "refunded",
    "refunding", "fundamental", "fundamentals", "fundraising",
]


def mask(text):
    store = {}
    for i, token in enumerate(PROTECTED):
        ph = f"\x00PROT{i}\x00"
        if token in text:
            text = text.replace(token, ph)
            store[ph] = token
    return text, store


def unmask(text, store):
    for ph, token in store.items():
        text = text.replace(ph, token)
    return text


def transform(text):
    text, store = mask(text)
    for pattern, repl in RULES:
        text = re.sub(pattern, repl, text)
    return unmask(text, store)


def count_finance_words(text):
    """Census of protected vocabulary, used as a before/after invariant."""
    low = text.lower()
    return {w: len(re.findall(r"\b" + w + r"\b", low)) for w in FINANCE_WORDS}


def walk():
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for fn in filenames:
            if fn in SKIP_FILES:
                continue
            ext = os.path.splitext(fn)[1].lower()
            if ext not in TEXT_EXT and fn not in {".env.local"}:
                continue
            yield os.path.join(dirpath, fn)


def main():
    apply = "--apply" in sys.argv
    changed, total_subs, violations = [], 0, []

    for path in walk():
        try:
            with open(path, "r", encoding="utf-8") as fh:
                original = fh.read()
        except (UnicodeDecodeError, OSError):
            continue

        updated = transform(original)
        if updated == original:
            continue

        # Invariant: finance vocabulary must be numerically identical.
        before, after = count_finance_words(original), count_finance_words(updated)
        if before != after:
            diffs = {w: (before[w], after[w]) for w in before if before[w] != after[w]}
            violations.append((path, diffs))
            continue

        # Invariant: protected domain strings must survive intact.
        for token in PROTECTED:
            if original.count(token) != updated.count(token):
                violations.append((path, {token: (original.count(token),
                                                  updated.count(token))}))
                break
        else:
            subs = sum(
                1 for a, b in zip(original.split("\n"), updated.split("\n")) if a != b
            )
            total_subs += subs
            changed.append((os.path.relpath(path, ROOT), subs))
            if apply:
                with open(path, "w", encoding="utf-8") as fh:
                    fh.write(updated)

    mode = "APPLIED" if apply else "DRY RUN"
    print(f"[{mode}] {len(changed)} files, {total_subs} lines changed\n")
    for rel, n in sorted(changed, key=lambda x: -x[1])[:40]:
        print(f"  {n:4d}  {rel}")
    if len(changed) > 40:
        print(f"  ... and {len(changed) - 40} more")

    if violations:
        print(f"\n!! {len(violations)} FILES BLOCKED — invariant broken:")
        for path, diffs in violations:
            print(f"  {os.path.relpath(path, ROOT)}: {diffs}")
        sys.exit(1)
    print("\nInvariants held: finance vocabulary and domain strings unchanged.")


if __name__ == "__main__":
    main()
