# Notho rebrand — what shipped, what's left

Branch `rebrand/notho`. Fundi Finance is now Notho; the coach mascot is now Cosmo.

---

## Deliberately left alone

Three categories were **not** renamed, each for a concrete reason.

### 1. The domain and everything bound to it

`fundiapp.co.za` is still live and still the mail sender. Renaming these before
the domain moves breaks things immediately rather than eventually:

| Location | Value | Breaks if changed early |
|---|---|---|
| `src/lib/emails/lifecycle.ts` | `hello@fundiapp.co.za` | Outbound mail: SPF/DKIM are aligned to this domain |
| `supabase/functions/send-email/index.ts` | `hello@fundiapp.co.za` | Same |
| `src/app/api/admin/broadcast/route.ts` | `hello@fundiapp.co.za` | Same |
| `next.config.ts` | CSP `script-src`, `connect-src`, `form-action` | Browser blocks your own domain |
| `public/fundi-bimi.svg` | filename | BIMI DNS record points at this exact path |
| `src/lib/viewHelpers.ts`, `pageViews.types.ts` | share-text URLs | Dead links in shared posts |

**Migration order when the new domain is ready** — do not reorder 1 and 2:

1. Stand the new domain up and verify SPF, DKIM and DMARC **before** touching code.
2. Add the new domain to the CSP allowlist alongside the old one. Deploy. Confirm no console CSP violations.
3. Switch `FROM` and `APP_URL` to the new domain.
4. Re-issue the BIMI record. If you hold a VMC, the SVG must still match the
   certified mark, so re-check the certificate before replacing `fundi-bimi.svg`.
5. 301 the old domain. Keep it alive at least 12 months: it is embedded in
   already-sent emails and already-shared social posts.
6. Only then remove the old domain from the CSP.

Social handles still to move (from the pre-launch checklist): `@fundiapp`,
`@fundifinancea`.

### 2. Finance vocabulary

`funding` contains the substring `fundi`. A naive case-insensitive replace turns
`funding` into `nothong` and `refunding` into `renothong`, across a personal
finance app. Every rule in `scripts/rebrand-notho.py` is word-boundary anchored,
and the script asserts a before/after census of `fund`, `funds`, `funded`,
`funding`, `refund`, `refunds`, `fundamentals` on every file it writes. It
refuses to save a file where those counts move.

Current counts in `src/`: fund 373, funds 119, funding 26, funded 19, refund 50,
refunds 11, fundamentals 14 — unchanged from before the rebrand.

### 3. Two judgement calls left as they were

- **`"Mfundi"`** in `supabase/functions/send-email/index.ts` (lines 275, 335) is
  a fallback display name. It is the isiZulu word for *learner*, not the brand.
  Left in place. Worth noting it contradicts `lifecycle.ts`, which documents
  that we never fall back to a generic label — that inconsistency predates this
  work.
- **`fundi_user`** in `supabase/migrations/20260417090000_...sql` is an applied
  migration. Editing applied migrations is a bad habit, and rewriting it would
  not change data that already exists. **There may be live usernames in
  production starting with `fundi_user_`** — that is a data question, not a code
  one. Check with:
  ```sql
  select count(*) from profiles where username like 'fundi%';
  ```

---

## Colour

Sampled from `nothoicon.png`, contrast measured against `#FFFFFF`, not estimated.

| Token | Value | Ratio | Use |
|---|---|---|---|
| `--brand-teal` | `#01A0AA` | 3.18:1 | Graphics and fills. **Never text on white.** |
| `--color-primary` | `#007A85` | 5.09:1 | Body text, buttons with white labels. AA. |
| `--color-primary-hover` | `#005F68` | 7.40:1 | Hover |
| `--brand-gold` | `#EFB343` | 1.88:1 | Decorative only. Fails even the 3:1 UI threshold. |
| `--brand-navy` | `#0D368D` | 10.88:1 | Headings, and text on gold (5.80:1) |
| dark mode `--color-primary` | `#20D3CF` | 11.28:1 on black | Was `#3FB68B` at 8.28:1, so dark mode got *more* legible |

Gold cannot carry meaning on its own on a light surface. Where a gold surface
needs a label, use navy on it.

**Kept green on purpose:** success states (`#22C55E`, `#16A34A`, `#10B981`,
`#DCFCE7`), the `text-green-800` dark-mode remap, and `#34A853` — which is the
Google logo inside the sign-in button and must not be recoloured.

### Pre-existing issue, not introduced here

`--color-danger: #E03C31` gives **4.32:1** with white text — below the 4.5:1 AA
threshold. It was failing before this work and is untouched. `#D6342A` would fix
it at 4.61:1 if you want it.

Also pre-existing and left alone: the back-compat aliases in `globals.css` are
scrambled — `--success-green` maps to the gold token and `--lesson-yellow` maps
to the red one. Renaming them is a separate change with its own blast radius.

---

## Assets

The `brand/` directory contains a **different mark** from the logo supplied for
this rebrand — three separate strokes rather than the teal ribbon forming an N.
It was left untouched and nothing references it. Everything in `public/` is
generated from `nothoicon.png` and `nothologo.png`.

`nothologo.png` has a near-white wordmark (`#F0F0F0`), so it is invisible on
white. `public/notho-logo.png` is a generated light-background variant with the
wordmark recoloured to navy; `notho-logo-on-dark.png` is the original.

Icon slots previously pointed at the wide lockup, so browsers and iOS were
centre-cropping it down to a sliver of the mark. They now point at square icons.

| File | Role |
|---|---|
| `notho-icon.png` | 512 square, transparent |
| `notho-icon-192/512.png` | PWA maskable, padded, white ground |
| `apple-touch-icon.png` | 180 square, opaque |
| `favicon.ico` | 16/32/48/64 |
| `notho-logo.png` | Wide lockup, navy wordmark — sidebar, OG |
| `Notho_logo.png`, `Logo.png` | Wide lockup on white — email, PDF report |

---

## Still outstanding

### Mascot artwork

`public/characters/cosmo-*.png` still carry **FUNDI** painted into the uniform in
four places. These are raster illustrations, not text layers. Automated removal
was attempted and reverted: it chewed the glyph edges, left the word still
legible, and damaged the collar and skirt pleats.

See `docs/COSMO-ILLUSTRATOR-BRIEF.md` for the handover.

### Verification not possible in this environment

`next build` and `vitest` both terminate with `Bus error (core dumped)` in the
sandbox — including on `main`, before any of these changes. So it is
environmental, not a regression. What did pass:

- `tsc --noEmit` clean — every import resolves, every renamed identifier exists
- `eslint` clean on the touched files
- All 8 string asset references resolve to files that exist on disk (this is the
  one class of breakage a compiler cannot catch after renaming images)

**Run `npm run build` locally before deploying.**

---

## Re-running the rename

`scripts/rebrand-notho.py --dry` previews, `--apply` writes. It is idempotent and
safe to re-run. Keep it: it documents the exact mapping, and its invariant check
is the reason the finance vocabulary survived.
