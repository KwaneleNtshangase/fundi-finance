# Bank statement test fixtures

## Synthetic samples (committed)

Files like `fnb-sample.csv` are **hand-built** to match each bank's known CSV header layout. They are used by unit tests only and contain no real account numbers or personal data.

| File | Bank | Status |
|------|------|--------|
| `fnb-sample.csv` | FNB | Synthetic — needs real anonymised validation |
| `standard-bank-sample.csv` | Standard Bank | Synthetic — needs real anonymised validation |
| `capitec-sample.csv` | Capitec | Synthetic — needs real anonymised validation |
| `nedbank-sample.csv` | Nedbank | Synthetic — needs real anonymised validation |
| `absa-sample.csv` | Absa | Synthetic — needs real anonymised validation |

## Before marking a bank parser "done"

1. Obtain one **real anonymised export** from that bank (strip account numbers, names, and any other PII).
2. Add it locally as `*-real-anonymised.csv` for manual QA — **do not commit** real identity or account data to git.
3. Run the parser against it; fix header/amount/date edge cases until output reconciles.
4. Update the status column above only after that pass.

## Git policy

- Never commit account numbers, ID numbers, full names, or unredacted statement PDFs.
- Synthetic fixtures only in this directory.
