# notho.co.za — DNS, email, and the order to do it in

The domain now sits in the Truehost account that also holds the hosting
(`kwanele.ntshangase@liblink.co.za`). Everything below happens in that account.

One zone has to serve two different providers at once:

| Records | Point at | Serving |
|---|---|---|
| `A` @ and `CNAME` www | **Vercel** | the app |
| `MX`, mail `CNAME`/`A` | **Truehost** | mailboxes |
| `TXT` SPF, DKIM | one merged SPF + Resend's DKIM | deliverability |

Getting the split wrong in either direction takes down the site or the mail.

---

## The trap, before you start

**Adding `notho.co.za` as a cPanel addon domain will overwrite the A record.**

cPanel assumes it is hosting the website, so on creating the addon domain it
writes an `A` record pointing at the hosting server. That is the exact record
Vercel needs. Do it in the wrong order and `notho.co.za` resolves to an empty
cPanel folder instead of the app.

So: add the addon domain **first**, then fix the A record back to Vercel. Never
the other way round, or you will fix it and then immediately clobber it.

---

## Order of operations

### 1. Read Vercel's values — do not copy them from anywhere else

Vercel → project → Settings → Domains → the `notho.co.za` row →
**View DNS configuration**.

Vercel's CNAME target is **per-project** (it looks like
`d1d4fc829fe7bc7c.vercel-dns-017.com`, not the old generic
`cname.vercel-dns.com`), and the apex A record value can differ too. Copy what
that panel shows. A stale value copied from a blog post is the most likely
reason a domain sits on *Invalid Configuration*.

Both `notho.co.za` and `www.notho.co.za` are currently **Invalid
Configuration**, which simply means no DNS is pointing at Vercel yet.

### 2. Add the addon domain in cPanel

cPanel → Domains → Create A New Domain → `notho.co.za`.

This creates the mail routing you need. It also writes an A record you are about
to correct.

### 3. Fix the A and CNAME back to Vercel

cPanel → Zone Editor → `notho.co.za`:

- `A` on `@` → the value from step 1. **Edit the record cPanel just created, do
  not add a second one.** Two A records on the apex will round-robin and the site
  will work roughly half the time — which is far more confusing to debug than it
  being down.
- `CNAME` on `www` → Vercel's per-project target from step 1.

Leave `MX` pointing at Truehost.

### 4. Confirm Vercel goes green

Back on Vercel's Domains page, hit **Refresh** on both rows. `.co.za` usually
propagates in minutes, but allow up to an hour. Both rows should lose the red
*Invalid Configuration* badge.

### 5. Create the mailboxes

cPanel → Email Accounts → Create → `hello@notho.co.za`.

Worth also creating `support@` and `privacy@` — the privacy policy commits to a
deletion-request address, so it needs to be one that actually receives mail.

### 6. Verify the domain in Resend

The app sends all transactional mail through Resend, which is separate from your
cPanel mailboxes. cPanel mail is for reading and replying; Resend is what the app
sends *through*.

Resend → Domains → Add Domain → `notho.co.za`. It will give you DKIM and SPF
records. Add them in the cPanel Zone Editor.

### 7. Merge the SPF records — do not add a second one

This is the one that fails silently.

cPanel already created an SPF record for `notho.co.za` when you added the addon
domain. Resend will ask for one too. **A domain may only have one SPF record.**
Two records means neither validates, and mail starts landing in spam with no
error anywhere — everything looks fine until you notice nobody is getting
welcome emails.

Combine them into a single `TXT` on `@`. cPanel's looks roughly like:

```
v=spf1 +a +mx +ip4:<hosting-ip> ~all
```

Take the `include:` that Resend gives you and fold it in before the `~all`:

```
v=spf1 +a +mx +ip4:<hosting-ip> include:<resend-value> ~all
```

Only one `v=spf1` record on the zone when you are done. Verify with:

```bash
dig +short TXT notho.co.za | grep spf
```

Exactly one line should come back.

---

## Only after all of the above

Do **not** switch the app over to the new domain until every step above is green.
The switchover itself is a separate change, documented in
`docs/REBRAND-NOTHO.md` under "Migration order". The short version:

1. SPF, DKIM, DMARC verified on the new domain first.
2. Add the new domain to the CSP allowlist **alongside** the old one, deploy,
   confirm no console violations.
3. Only then switch `FROM` and `APP_URL` in the code.
4. Keep `fundiapp.co.za` alive and redirecting for at least 12 months — it is
   baked into already-sent emails and already-shared social posts.

Until step 3 ships, `hello@fundiapp.co.za` stays the sending address. That is
deliberate. Changing the name and the sending domain in the same week is what
actually trips spam filters.

---

## Meta

Separately, in the Meta app dashboard (App settings → Basic), add
`notho.co.za` to **App domains** — but keep `fundiapp.co.za` there too until the
switchover is done. Removing it early breaks Facebook login on the live site.
