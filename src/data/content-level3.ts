// ═══════════════════════════════════════════════════════════════════════════
// FUNDI FINANCE — LEVEL 3 ADVANCED CONTENT
//
// Four new full courses at financial-advisor quality:
//   1. advanced-tax         — Capital gains, trust tax vehicles, offshore, dividend vs salary
//   2. estate-planning      — SA wills, estate duty, trusts, beneficiary strategy, liquidity
//   3. advanced-investing   — MPT, factor investing, offshore allocation, sequence-of-returns
//   4. business-finance-advanced — Pty Ltd vs trust, SBC, reading accounts, valuation, funding
//
// All figures reference 2024/25 SARS rules, the Wills Act 7 of 1953,
// the Estate Duty Act, Regulation 28, and JSE-specific data.
// ═══════════════════════════════════════════════════════════════════════════

import type { Course, LessonStep } from "./content";

// ─────────────────────────────────────────────────────────────────────────────
// COURSE 1: ADVANCED TAX PLANNING
// ─────────────────────────────────────────────────────────────────────────────

export const ADVANCED_TAX_COURSE: Course = {
  id: "advanced-tax",
  title: "Advanced Tax Planning",
  description:
    "Capital gains, trust structures, offshore income, and legal strategies that save high-income South Africans hundreds of thousands in tax",
  icon: "calculator",
  units: [
    {
      id: "unit-1",
      title: "Capital Gains Tax Mastery",
      description:
        "How CGT works in SA, the exclusions, and strategies to minimise your liability",
      lessons: [
        {
          id: "cgt-fundamentals",
          title: "Capital Gains Tax — The Full Picture",
          steps: [
            {
              type: "info",
              title: "What CGT Is and When You Pay It",
              content:
                "<p>Capital Gains Tax is not a separate tax in South Africa — it is a top-up to income tax. When you dispose of an asset (sell, gift, die, or emigrate), SARS includes a portion of the profit in your taxable income for that year.</p><p><strong>The inclusion rates for 2024/25:</strong></p><ul><li>Individuals: 40% of the gain is included in taxable income</li><li>Companies: 80% included</li><li>Trusts: 80% included (45% flat rate × 80% = effective 36%)</li></ul><p>An individual in the 45% bracket pays effectively 18% CGT (45% × 40%). Not 45%. This distinction matters.</p>",
            } satisfies LessonStep,
            {
              type: "info",
              title: "The Annual Exclusion and Primary Residence",
              content:
                "<p>SARS gives individuals two major CGT shields:</p><p><strong>Annual exclusion: R40 000</strong> — The first R40 000 of capital gains or losses is ignored every year. On death, this rises to R300 000.</p><p><strong>Primary residence exclusion: R2 million</strong> — Gain on selling your main home. If you sell for R3.5m and bought for R1.2m (gain = R2.3m), only R300 000 is taxable after the R2m exclusion. The property must have been your primary residence and used mainly for residential purposes.</p><p>Combined, a long-time homeowner in the 45% bracket on a R2.3m gain pays CGT on only R260 000 after both exclusions — effective tax of approximately R46 800, not R207 000 on the full gain.</p>",
            } satisfies LessonStep,
            {
              type: "mcq",
              question:
                "You buy shares for R200 000 and sell for R480 000 (gain = R280 000). You are in the 45% tax bracket. After the R40 000 annual exclusion, your CGT liability is approximately:",
              options: [
                "R126 000 (45% of the full R280 000)",
                "R43 200 (45% × 40% × R240 000)",
                "R50 400 (45% × 40% × R280 000)",
                "R18 000 (45% × 40% × R40 000)",
              ],
              correct: 1,
              feedback: {
                correct:
                  "R280 000 − R40 000 exclusion = R240 000. × 40% inclusion = R96 000 added to taxable income. × 45% = R43 200. The effective CGT rate is 18%, not 45%.",
                incorrect:
                  "Step 1: deduct R40 000 exclusion → R240 000. Step 2: × 40% inclusion rate → R96 000. Step 3: × 45% marginal rate → R43 200. The effective CGT rate for a top-bracket individual is always 18%.",
              },
            } satisfies LessonStep,
            {
              type: "info",
              title: "Base Cost and Record-Keeping",
              content:
                "<p>Base cost is what you paid for the asset (purchase price + broker fees + improvement costs for property). It sets the size of your gain.</p><p><strong>Pre-valuation date assets:</strong> If you owned assets before 1 October 2001 (CGT's introduction date), the base cost can be determined using the market value on that date — not the original purchase price. This often dramatically reduces gains on long-held shares or property.</p><p><strong>What SARS expects:</strong> Keep all contract notes (share trades), transfer duty receipts, improvement invoices, and estate agent agreements permanently. SARS can audit 5 years back but has no time limit for fraudulent returns. A shoebox with no records is a tax liability waiting to happen.</p>",
            } satisfies LessonStep,
            {
              type: "true-false",
              statement:
                "Gifting shares to a family member does not trigger CGT because no money changes hands.",
              correct: false,
              feedback: {
                correct:
                  "Incorrect assumption. SARS treats a gift as a disposal at market value on the date of the gift. The donor pays CGT on the deemed gain as if they had sold at market value.",
                incorrect:
                  "A gift is a deemed disposal. The donor pays CGT on any gain as if they had sold at market value. Only specific exclusions (spousal donations and small annual exclusions) limit this.",
              },
            } satisfies LessonStep,
            {
              type: "info",
              title: "CGT-Minimisation Strategies",
              content:
                "<p><strong>1. Harvesting losses:</strong> If you have unrealised losses in your portfolio, realise them in the same tax year as a large gain. Losses offset gains rand-for-rand before the inclusion rate applies.</p><p><strong>2. Spreading disposals across tax years:</strong> The annual exclusion is use-it-or-lose-it. If you plan to sell a large position, staggering sales over multiple years uses multiple R40 000 exclusions.</p><p><strong>3. TFSA wrapper:</strong> Assets inside a Tax-Free Savings Account have zero CGT, ever. Holding growth assets (equity ETFs) in your TFSA permanently eliminates CGT on those assets.</p><p><strong>4. Donation to PBO:</strong> Donating an appreciated asset directly to a Section 18A public benefit organisation is not subject to CGT and generates a tax deduction up to 10% of taxable income.</p>",
            } satisfies LessonStep,
            {
              type: "scenario",
              question:
                "Zanele has R500 000 in unrealised gains on JSE shares and R180 000 in unrealised losses on an underperforming ETF. She wants to unlock the gains this tax year. What is the most tax-efficient strategy?",
              options: [
                "Sell only the winning shares, pay CGT on R460 000 (after exclusion)",
                "Sell both the winners and losers in the same tax year — net gain R320 000, pay CGT on R280 000 after exclusion",
                "Gift the winners to her spouse to avoid CGT entirely",
                "Hold everything — CGT is only triggered when you need the money",
              ],
              correct: 1,
              feedback: {
                correct:
                  "Realising the R180 000 loss offsets the R500 000 gain → net gain R320 000. After R40 000 exclusion → R280 000 taxable. × 40% × 45% = R50 400 CGT. Without harvesting the loss, CGT would have been R82 800. Saving: R32 400.",
                incorrect:
                  "Selling the losing position in the same year offsets the gain rand-for-rand. Net gain R320 000 − R40 000 exclusion = R280 000 taxable, saving R32 400 vs selling winners alone.",
              },
            } satisfies LessonStep,
          ],
        },
        {
          id: "dividend-vs-salary",
          title: "Dividend vs Salary: How Business Owners Extract Wealth",
          steps: [
            {
              type: "info",
              title: "The Core Decision Every Pty Ltd Owner Faces",
              content:
                "<p>When your Pty Ltd makes a profit, you have three ways to get money out:</p><ol><li><strong>Salary:</strong> Taxed in your hands at marginal rates (up to 45%). Tax-deductible for the company. Creates UIF and pension obligations.</li><li><strong>Dividend:</strong> Paid from after-tax company profits. Company pays 27% corporate tax, then 20% Dividends Tax — effectively 41.6% total. No UIF, no pension obligation.</li><li><strong>Loan account:</strong> Draw money as a loan to yourself. Interest must be charged at repo rate (SARS Section 7C). Not a long-term solution.</li></ol><p>For a business owner in the 45% marginal bracket, a salary costing the company R100 000 delivers R55 000 in hand. A dividend: company earns R100 000, pays R27 000 tax → R73 000, then 20% DT → R58 400 in hand. Dividend wins by R3 400 per R100 000 at the top bracket.</p>",
            } satisfies LessonStep,
            {
              type: "mcq",
              question:
                "Your Pty Ltd has R200 000 pre-tax profit. If you pay it all as a salary (you are in the 45% bracket), you receive approximately:",
              options: [
                "R200 000 — salary is pre-tax for the company",
                "R110 000 — after 45% income tax",
                "R90 000 — after income tax and UIF",
                "R166 000 — the company saves 27% corporate tax on the salary",
              ],
              correct: 1,
              feedback: {
                correct:
                  "The salary is a company tax deduction so no corporate tax applies. But you pay income tax at 45% on the R200 000 → R110 000 net. (Medical aid credits and other deductions may increase this slightly.)",
                incorrect:
                  "Salary is fully deductible for the company (no 27% corporate tax). You pay income tax at your marginal rate. At 45%, R200 000 salary → R110 000 net.",
              },
            } satisfies LessonStep,
            {
              type: "info",
              title: "The Optimal Split: R480 000 Salary + Dividends",
              content:
                "<p>The most tax-efficient strategy for most owner-managed Pty Ltd businesses:</p><ol><li>Pay yourself a salary equal to roughly the top of the 31% bracket (approx R480 000/year in 2024/25). This maximises RA deductions and medical credits against a moderate rate.</li><li>Take additional profits as dividends (27% corporate tax + 20% DT = ~41.6% effective).</li><li>Maximise RA contributions from the salary — up to 27.5% deducted before income tax.</li></ol><p><strong>Example:</strong> Business makes R1.2m profit. Pay R480 000 salary, contribute R132 000 to RA (27.5%). Taxable salary = R348 000, tax ≈ R87 000. Remaining R720 000 profit: company pays R194 400 corporate tax, declares R525 600 dividend, you pay R105 120 DT. Total tax = R386 520 on R1.2m vs R540 000 if all taken as salary at 45%.</p>",
            } satisfies LessonStep,
            {
              type: "true-false",
              statement:
                "Dividends Tax (20%) is paid by the company on behalf of the shareholder and does not appear in the shareholder's personal tax return.",
              correct: true,
              feedback: {
                correct:
                  "Correct. Dividends Tax is a withholding tax. The company deducts it before paying you the dividend. You receive the net amount; it does not affect your personal income tax brackets.",
                incorrect:
                  "Dividends Tax is a withholding tax — the company deducts 20% before payment. The net dividend you receive is tax-free in your hands and does not affect your income tax calculation.",
              },
            } satisfies LessonStep,
            {
              type: "info",
              title: "Section 7C: The Loan Account Trap",
              content:
                "<p>Many business owners take money out as a 'loan' from their company to avoid both salary tax and dividends tax. SARS closed this loophole with Section 7C.</p><p><strong>Section 7C rules (from 2017):</strong> If your Pty Ltd or trust lends money to you (a connected person) at below the official interest rate (currently repo rate = 7.75%), the difference is a deemed donation. Donations Tax of 20% applies on amounts above R100 000 donated per year.</p><p>Example: Pty Ltd lends you R1 000 000 at 0% interest. Notional interest at 7.75% = R77 500. After R100 000 annual exclusion, nothing taxable this year. But the loan grows — by year 3, notional interest cumulates. SARS expects either the loan to be repaid or the notional interest declared.</p>",
            } satisfies LessonStep,
            {
              type: "scenario",
              question:
                "Thabo has a Pty Ltd making R800 000 net profit. He wants to maximise what he keeps after tax. His RA has space. Which approach delivers the highest after-tax income?",
              options: [
                "Take all R800 000 as salary — simplest approach",
                "Take R480 000 salary, maximise RA, take balance as dividends",
                "Take all as dividends — lowest apparent tax rate",
                "Leave all money in the company and pay himself only director fees",
              ],
              correct: 1,
              feedback: {
                correct:
                  "Salary + RA + dividends is almost always optimal. The salary provides RA deductibility (reducing income tax). The dividend strip is more efficient above the 45% bracket. Director fees are still salary for tax purposes.",
                incorrect:
                  "The optimal split: salary to use RA deductions (27.5%) in moderate tax brackets, then dividends for the balance. All-salary at 45% is the least efficient. All-dividends misses RA deductions. Director fees = salary for SARS.",
              },
            } satisfies LessonStep,
          ],
        },
        {
          id: "trust-tax-vehicle",
          title: "Trusts as Tax and Wealth-Protection Structures",
          steps: [
            {
              type: "info",
              title: "What a Trust Actually Is",
              content:
                "<p>A trust is not a company and not a person. It is a legal arrangement where a <strong>founder</strong> transfers assets to <strong>trustees</strong>, who hold and manage them for the benefit of <strong>beneficiaries</strong>. The trust owns the assets — not you personally.</p><p><strong>Two main types in SA:</strong></p><ul><li><strong>Inter vivos trust:</strong> Created during your lifetime. Used for asset protection, estate duty reduction, and family wealth continuity.</li><li><strong>Testamentary trust:</strong> Created by your will on your death. Commonly used to protect inheritances for minor children.</li></ul><p><strong>The key insight:</strong> Because the trust owns assets, not you, those assets are not part of your estate when you die — meaning no estate duty on them. This is the primary reason high-net-worth South Africans use trusts.</p>",
            } satisfies LessonStep,
            {
              type: "info",
              title: "Trust Tax Rates — The Catch",
              content:
                "<p>SARS taxes trusts punitively to prevent wealthy individuals from parking income in trusts at lower rates:</p><ul><li><strong>Income retained in trust:</strong> Taxed at a flat 45% — the same as the highest individual bracket</li><li><strong>Capital gains in trust:</strong> 80% inclusion rate × 45% = effective 36%</li><li><strong>Income vested (paid out) to beneficiaries:</strong> Taxed in the beneficiary's hands at their rate</li></ul><p><strong>The planning opportunity:</strong> If you have adult children or a spouse in lower tax brackets, vesting income from the trust to them is taxed at their rate (potentially 18% or 26%), not 45%. This is legal income-splitting and can save significant tax annually.</p>",
            } satisfies LessonStep,
            {
              type: "mcq",
              question:
                "A trust earns R300 000 rental income. It vests R150 000 to a beneficiary (in the 26% bracket) and retains R150 000. Approximate total tax paid:",
              options: [
                "R135 000 (45% of full R300 000)",
                "R106 500 (45% on retained + 26% on vested)",
                "R78 000 (26% on all R300 000)",
                "R0, trusts don't pay income tax",
              ],
              correct: 1,
              feedback: {
                correct:
                  "Retained R150 000 × 45% = R67 500. Vested R150 000 × 26% = R39 000. Total = R106 500. vs R135 000 if all retained. Saving: R28 500 — just by vesting to a lower-bracket beneficiary.",
                incorrect:
                  "Retained income is taxed at 45% (flat trust rate). Vested income is taxed at the beneficiary's rate. R150 000 × 45% + R150 000 × 26% = R67 500 + R39 000 = R106 500.",
              },
            } satisfies LessonStep,
            {
              type: "info",
              title: "Section 7C — Loans to Trusts",
              content:
                "<p>From 1 March 2017, SARS introduced Section 7C to prevent a widely-used scheme: individuals sold assets to their trust for a low purchase price on an interest-free loan account, effectively freezing the value in their estate.</p><p><strong>Section 7C says:</strong> Any loan from you (a connected person) to a trust at below the official interest rate triggers Donations Tax on the interest 'forgone'. At repo rate 7.75%, a R10 million interest-free loan generates R775 000 in notional donations per year. After the R100 000 annual exclusion, R675 000 is subject to 20% Donations Tax = R135 000/year.</p><p><strong>The impact:</strong> Many historic trust structures built before 2017 are now annual tax liabilities. Trustees and advisors need to either charge proper interest on loans, waive debt strategically, or restructure.</p>",
            } satisfies LessonStep,
            {
              type: "true-false",
              statement:
                "Assets held inside an inter vivos trust are included in the founder's estate for estate duty purposes.",
              correct: false,
              feedback: {
                correct:
                  "Assets properly transferred to a trust no longer form part of your personal estate — provided the transfer was done at market value and the trust is properly administered. This is the core estate duty benefit of inter vivos trusts.",
                incorrect:
                  "Once assets are properly transferred to a trust (at market value, properly recorded), they belong to the trust, not you. They fall outside your estate for estate duty purposes.",
              },
            } satisfies LessonStep,
            {
              type: "scenario",
              question:
                "Nomsa (58) has a R12 million property portfolio in her personal name. Her financial advisor suggests transferring it to an inter vivos trust now. What is the primary long-term benefit?",
              options: [
                "She pays zero CGT on the transfer immediately",
                "Future growth in property value occurs inside the trust, outside her estate — reducing estate duty on death",
                "Trust assets avoid all future income tax",
                "She can withdraw the money tax-free as a beneficiary",
              ],
              correct: 1,
              feedback: {
                correct:
                  "The transfer itself triggers CGT on any gain (at the time of sale to the trust). But future value growth occurs inside the trust. When Nomsa dies, the R12m + future growth is not in her estate. At 20% estate duty, transferring R12m now vs allowing it to grow to R25m in her estate saves R5m+ in future estate duty.",
                incorrect:
                  "The transfer triggers CGT (it's a deemed disposal). But future growth happens outside Nomsa's estate. The estate duty saving on death — potentially millions — is the purpose. Trust income is still taxable but at vested rates.",
              },
            } satisfies LessonStep,
          ],
        },
        {
          id: "foreign-income-tax",
          title: "Foreign Income, Offshore Investments, and SA Tax",
          steps: [
            {
              type: "info",
              title: "SA's Residence-Based Tax System",
              content:
                "<p>South Africa taxes residents on their <strong>worldwide income</strong> — not just income earned in SA. If you live in SA, your dividends from a US ETF, your rental income from a UK flat, and your freelance income from a Swiss client are all taxable by SARS.</p><p><strong>You are a SA tax resident if:</strong></p><ul><li>You are ordinarily resident in SA (your real home is here), OR</li><li>You were physically in SA for 91 days in the current year and 549 days in the past 5 years</li></ul><p>Many South Africans working abroad incorrectly believe they have stopped being tax residents simply by leaving. Formal tax emigration (changing your tax status to non-resident) is a separate legal process with significant implications.</p>",
            } satisfies LessonStep,
            {
              type: "info",
              title: "The Section 10(1)(o) Foreign Employment Exemption",
              content:
                "<p>If you work outside SA for a foreign employer for more than 183 days in a 12-month period (including at least 60 consecutive days), your foreign employment income is exempt from SA tax up to R1.25 million per year.</p><p><strong>Above R1.25 million:</strong> The excess is taxed in SA. You may credit foreign tax paid against your SA liability.</p><p><strong>Important 2020 amendment:</strong> Before 1 March 2020, all foreign employment income was fully exempt. SARS closed this loophole. Now only R1.25 million is exempt. Many South Africans working in the Gulf (where there is zero income tax) were significantly impacted.</p>",
            } satisfies LessonStep,
            {
              type: "mcq",
              question:
                "Sipho works in Dubai earning R3.2 million/year. He is a SA tax resident and meets the 183-day rule. How much is taxable in SA?",
              options: [
                "R0 — Dubai has no income tax",
                "R3.2 million — all foreign income is taxable",
                "R1.95 million (R3.2m − R1.25m exemption)",
                "R1.25 million (only the exempt portion is taxed)",
              ],
              correct: 2,
              feedback: {
                correct:
                  "R3.2m − R1.25m exemption = R1.95m taxable in SA. At the 45% bracket, SARS expects approximately R877 500. Dubai has no income tax to credit. Sipho must file a SA tax return.",
                incorrect:
                  "The exemption is R1.25 million. R3.2m − R1.25m = R1.95m subject to SA tax. The fact that Dubai has zero tax provides no benefit — you cannot credit zero against a SA liability.",
              },
            } satisfies LessonStep,
            {
              type: "info",
              title: "Tax Treaties and Double Taxation Relief",
              content:
                "<p>SA has tax treaties with 80+ countries to prevent the same income being taxed twice. The relief works in two ways:</p><p><strong>Exemption method:</strong> One country gives up its right to tax. Example: SA-UK treaty — SA residents earning UK rental income may pay UK tax and receive a SA exemption (less common).</p><p><strong>Credit method (more common):</strong> SA taxes the income but credits foreign tax paid. If the UK deducts 20% tax on R200 000 rental (R40 000), and your SA liability on that income is R90 000, you pay only R50 000 more to SARS.</p><p><strong>Dividend withholding tax:</strong> When your US ETF pays dividends, the US withholds 30% (15% under treaty if you file W-8BEN). This foreign withholding tax is credited against your SA income tax on those dividends. Your SA broker (EasyEquities, Ninety One) handles the W-8BEN form.</p>",
            } satisfies LessonStep,
            {
              type: "true-false",
              statement:
                "A South African who moves to the UK permanently and rents out their SA property no longer owes SARS tax on the rental income.",
              correct: false,
              feedback: {
                correct:
                  "SA non-residents still pay SA income tax on SA-sourced income (rental, business income, interest). Only your worldwide income liability ends when you formally cease SA tax residency. SA-source income remains taxable in SA regardless.",
                incorrect:
                  "Non-residents pay SA tax on SA-sourced income. Rental income from a SA property is taxable in SA even if you live abroad. Tax emigration removes your worldwide income obligation but not your SA-source income obligation.",
              },
            } satisfies LessonStep,
            {
              type: "info",
              title: "Formal Tax Emigration vs Ceasing Residency",
              content:
                "<p>Many South Africans who leave the country permanently still file as SA residents — creating ongoing tax obligations they are unaware of. Formally ceasing tax residency triggers:</p><ul><li><strong>Deemed disposal:</strong> SARS treats all your worldwide assets as sold on the day you leave. CGT is payable on all unrealised gains.</li><li><strong>Retirement fund exit tax:</strong> If you withdraw your pension or RA after formal emigration, a different tax table applies (lump sum tables, not normal income tax).</li><li><strong>Future SA income:</strong> You will pay non-resident tax on SA-source income at withholding rates (15% on interest, 20% dividends tax).</li></ul><p>Ceasing residency is often a net benefit for high-net-worth individuals with significant offshore assets, but must be planned carefully with a tax professional. The 'exit tax' on deemed disposal is payable regardless — but is a one-time cost vs ongoing worldwide income tax.</p>",
            } satisfies LessonStep,
          ],
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// COURSE 2: ESTATE PLANNING
// ─────────────────────────────────────────────────────────────────────────────

export const ESTATE_PLANNING_COURSE: Course = {
  id: "estate-planning",
  title: "Estate Planning",
  description:
    "SA wills, estate duty, trusts, life assurance in your estate, and how to pass wealth to the next generation without losing it to tax and legal delays",
  icon: "landmark",
  units: [
    {
      id: "unit-1",
      title: "Wills and Intestate Succession",
      description:
        "What happens when you die without a will — and how to ensure your assets go where you want them",
      lessons: [
        {
          id: "dying-intestate-disaster",
          title: "What Happens When You Die Without a Will",
          steps: [
            {
              type: "info",
              title: "70% of South Africans Have No Will",
              content:
                "<p>Dying without a valid will is called dying <strong>intestate</strong>. When this happens, the Intestate Succession Act 81 of 1987 distributes your estate — not your wishes.</p><p><strong>The intestate formula:</strong></p><ul><li>If you are married with children: spouse gets R250 000 or a child's share (whichever is greater). Children share the rest.</li><li>If you have children but no spouse: children share everything equally</li><li>If you have a spouse but no children: spouse gets everything</li><li>If you have neither: parents, then siblings, then further relatives</li></ul><p>Cohabiting partners (unmarried) receive <strong>nothing</strong> under intestate succession, regardless of how long they lived together or what was jointly purchased.</p>",
            } satisfies LessonStep,
            {
              type: "info",
              title: "The Real Cost of No Will",
              content:
                "<p>Beyond the distribution formula, dying without a will causes:</p><ul><li><strong>The Master's Office appoints an executor:</strong> Often a bank trust company charging 3.5% + VAT on the gross estate value. On a R3 million estate, that is R139 650 in fees — vs under R20 000 if you nominated your own executor and fee.</li><li><strong>Delays of 12–24+ months:</strong> Without a clear mandate, the winding-up process drags through the Master's Office.</li><li><strong>Family conflict:</strong> The formula ignores relationships, promises, and practical needs. Minor children's inheritance is managed by the Guardian's Fund — not your surviving spouse.</li><li><strong>Guardian's Fund trap:</strong> If your minor children inherit, the money goes into the Government Guardian's Fund, earning below-market interest, until they turn 18.</li></ul>",
            } satisfies LessonStep,
            {
              type: "true-false",
              statement:
                "If you die intestate and your partner of 15 years inherits nothing, they can challenge the Intestate Succession Act in court and usually win.",
              correct: false,
              feedback: {
                correct:
                  "The Intestate Succession Act does not recognise cohabiting partners. Constitutional challenges have had limited success — the Bwanya case (2022 Constitutional Court) extended some rights to life partners in specific circumstances, but this is not guaranteed. A properly drafted will is the only certain solution.",
                incorrect:
                  "Cohabiting partners have no automatic intestate rights. While the Constitutional Court has extended some protections (Bwanya v Master of the High Court, 2022), this is uncertain territory. Only a valid will guarantees your partner inherits.",
              },
            } satisfies LessonStep,
            {
              type: "info",
              title: "Valid Will Requirements (Wills Act 7 of 1953)",
              content:
                "<p>For a will to be valid in South Africa it must:</p><ul><li>Be in writing (handwritten or typed)</li><li>Be signed by the testator (you) at the end of the document and at the bottom of each page</li><li>Be signed in the presence of two competent witnesses, both present at the same time</li><li>Witnesses must sign in your presence and in the presence of each other</li><li>Witnesses must be 14+ years old and mentally competent</li><li><strong>Critical rule:</strong> A witness (or their spouse) cannot be a beneficiary under the will. If they are, the bequest to them is void — the rest of the will stands.</li></ul><p>You do not need a lawyer, notary, or commissioner of oaths to create a valid will. But professional drafting catches issues that can void or complicate a will years later.</p>",
            } satisfies LessonStep,
            {
              type: "mcq",
              question:
                "Siphamandla writes his own will leaving his car to his friend Thabo and his house to his sister Nomalanga. Thabo and Nomalanga witness the will and sign it. What is the legal consequence?",
              options: [
                "The will is completely void because beneficiaries witnessed it",
                "The will is valid but the bequests to Thabo and Nomalanga are void — they receive nothing",
                "The will is valid and fully enforceable",
                "Only Nomalanga's bequest is void as she is a blood relative",
              ],
              correct: 1,
              feedback: {
                correct:
                  "Under the Wills Act, a witness who is a beneficiary loses their bequest. The will itself remains valid. Siphamandla's estate would be distributed without the bequests to Thabo and Nomalanga — likely going intestate for those assets.",
                incorrect:
                  "The will remains valid, but the bequests to the witnesses are void. Both Thabo and Nomalanga receive nothing. The rest of the will stands. This is why you must never use beneficiaries as witnesses.",
              },
            } satisfies LessonStep,
            {
              type: "info",
              title: "Choosing an Executor — The Most Overlooked Decision",
              content:
                "<p>Your executor administers your estate after death: collects assets, pays debts, pays estate duty, and distributes to beneficiaries. This process can take 1–3 years.</p><p><strong>Options:</strong></p><ul><li><strong>Family member:</strong> Possible if they are competent. Must appoint an agent (attorney or bank trust) if the estate exceeds R250 000. Not practical for complex estates.</li><li><strong>Attorney or financial advisor:</strong> Negotiate fees upfront. Statutory maximum is 3.5% + VAT of gross estate value — but many accept less, especially if the estate is large and straightforward.</li><li><strong>Bank trust company:</strong> Reliable but impersonal, and typically charges the full 3.5%.</li></ul><p><strong>Practical action:</strong> Name your executor in your will and negotiate their fee in writing before you die. For a R5 million estate, the difference between 3.5% (R202 750) and 1% (R57 930) is R144 820 — preserved for your family.</p>",
            } satisfies LessonStep,
          ],
        },
        {
          id: "estate-duty-deep",
          title: "Estate Duty — The Tax on Dying Rich",
          steps: [
            {
              type: "info",
              title: "How Estate Duty Works in SA",
              content:
                "<p>Estate duty is a tax on the total value of your estate when you die. It is one of the most significant wealth transfer taxes South Africans face — and one of the least understood.</p><p><strong>2024/25 rates:</strong></p><ul><li>20% on dutiable estate up to R30 million</li><li>25% on dutiable estate above R30 million</li></ul><p><strong>The R3.5 million abatement:</strong> Every individual gets a R3.5 million deduction before estate duty applies. Your first R3.5 million passes estate-duty-free.</p><p><strong>Spousal rollover:</strong> Assets left to a surviving spouse are fully exempt from estate duty — the tax is deferred to when the surviving spouse dies. Unused abatement from the first death rolls over to the surviving spouse (portability of abatement).</p>",
            } satisfies LessonStep,
            {
              type: "fill-blank",
              title: "Estate Duty Calculation",
              prompt:
                "Nomathemba dies with a net estate of R8 000 000. She leaves R2 000 000 to her spouse and the rest to her children. Estate duty is calculated on R___ million (enter the number).",
              correct: 2.5,
              feedback: {
                correct:
                  "R8m − R2m (spousal bequest) = R6m dutiable. − R3.5m abatement = R2.5m subject to duty. Estate duty = R2.5m × 20% = R500 000.",
                incorrect:
                  "Step 1: R8m − R2m spousal exemption = R6m. Step 2: − R3.5m abatement = R2.5m dutiable. Estate duty = R2.5m × 20% = R500 000.",
              },
            } satisfies LessonStep,
            {
              type: "info",
              title: "What Is and Isn't in Your Estate",
              content:
                "<p><strong>Included in your estate (dutiable):</strong></p><ul><li>Property, vehicles, investments in your name</li><li>Business interests (shares in Pty Ltd, partnership interest)</li><li>Retirement funds — only the <em>after-tax</em> lump sum amount payable to your estate (not nominated beneficiaries)</li><li>Life insurance policies where the estate is the beneficiary</li></ul><p><strong>Excluded from your estate:</strong></p><ul><li>Retirement fund proceeds paid to <em>nominated beneficiaries</em> (not the estate) — these bypass estate duty entirely</li><li>Life policies payable to <em>nominated beneficiaries</em> (Section 3(3)(a) policies on which estate duty has already been accounted for)</li><li>Assets in a properly established inter vivos trust (owned by the trust, not you)</li></ul><p>Beneficiary nominations on your pension, provident fund, and RA are therefore estate planning tools, not just administrative forms.</p>",
            } satisfies LessonStep,
            {
              type: "mcq",
              question:
                "Thabo nominates his wife as beneficiary on his R4 million pension fund. When he dies, what estate duty is owed on this R4 million?",
              options: [
                "R800 000 (20% estate duty)",
                "R100 000 (estate duty on the amount above R3.5m abatement)",
                "R0 — retirement funds with nominated beneficiaries bypass the estate",
                "R0 — spouses are always fully exempt from estate duty",
              ],
              correct: 2,
              feedback: {
                correct:
                  "Pension/RA/provident funds with nominated beneficiaries are paid directly to the nominee by the fund — they do not form part of the dutiable estate. No estate duty is owed on R4 million if it goes directly to the nominated wife.",
                incorrect:
                  "Retirement fund proceeds paid to a nominated beneficiary bypass the estate entirely. They are paid by the fund administrator directly to the nominee. Zero estate duty, regardless of amount.",
              },
            } satisfies LessonStep,
            {
              type: "info",
              title: "The Liquidity Problem — How Estates Run Dry",
              content:
                "<p>Estate duty, executor fees, outstanding debt, and transfer costs must usually be paid within 12 months of death. The problem: most wealth is illiquid (property, retirement funds, business interests).</p><p><strong>Example:</strong> Zanele's estate: R6m property, R2m RA (to be taxed), R500k car, R300k investments. Net estate = R8.8m. Estate duty = approximately R1.06m. Executor fees (3.5%) = R308 000. Total liability: ~R1.37 million due in cash within 12 months.</p><p>Her liquid investments (R300k) are far short. The executor must either:</p><ul><li>Sell the property under time pressure (often below market value)</li><li>Accept a Section 35 SARS payment arrangement</li><li>Fund the shortfall via a Section 3(3)(a) estate-pegged life policy</li></ul>",
            } satisfies LessonStep,
            {
              type: "info",
              title: "Estate Duty Planning Strategies",
              content:
                "<p><strong>1. Inter vivos trust:</strong> Transfer appreciating assets into a trust now. Future growth falls outside your estate. The transfer triggers CGT now (one-time cost) but removes ongoing growth from estate duty calculations.</p><p><strong>2. Life assurance (Section 3(3)(a)):</strong> A life policy where the estate is the beneficiary is included in the dutiable estate but the insurer pays the duty. These policies are specifically designed to fund estate duty — premiums are effectively pre-paying your estate duty in installments.</p><p><strong>3. Spousal bequests to maximise portability:</strong> Structuring your will so the full estate goes to your spouse defers all duty to the second death — by which time abatements may have changed, or the surviving spouse's estate may be structured differently.</p><p><strong>4. Donations during lifetime:</strong> Gifts of up to R100 000/year are free from Donations Tax. Over 20 years, R2 million can be transferred outside your estate — saving R400 000 in estate duty.</p>",
            } satisfies LessonStep,
          ],
        },
        {
          id: "beneficiary-strategy",
          title: "Beneficiary Nominations — Your Most Powerful Estate Planning Tool",
          steps: [
            {
              type: "info",
              title: "Why Beneficiary Nominations Override Your Will",
              content:
                "<p>Your will controls your estate. But several major assets bypass your estate entirely if you have named beneficiaries — your will cannot override these nominations.</p><p><strong>Assets that pass via beneficiary nomination (not your will):</strong></p><ul><li>Pension, provident, and retirement annuity funds</li><li>Group life insurance through your employer</li><li>Individual life policies where you named a beneficiary</li></ul><p><strong>Why this matters:</strong> If your will says 'everything to my children equally' but your pension fund says 'ex-spouse', your ex-spouse gets the pension. Courts have confirmed this repeatedly. Beneficiary nominations must be reviewed at every major life event: marriage, divorce, birth of children, death of a nominee.</p>",
            } satisfies LessonStep,
            {
              type: "info",
              title: "Retirement Fund Nominations — Section 37C",
              content:
                "<p>Retirement funds (pension, provident, RA) are governed by the Pension Funds Act Section 37C. The trustee board of your fund <strong>must</strong> consider all financial dependants — not just your nominees.</p><p>If you nominate only your spouse but you have three minor children from a previous relationship who depend on you financially, the trustees may distribute part of the benefit to those children regardless of your nomination.</p><p><strong>Practical rule:</strong> Name all financial dependants as nominees in proportion to their dependency. Update nominations annually and after every life event. The fund administrator provides nomination forms — ask for them today.</p>",
            } satisfies LessonStep,
            {
              type: "mcq",
              question:
                "Sipho's pension fund nomination form (submitted 10 years ago) names his mother as sole beneficiary. He has since married and has two children. He dies unexpectedly. Who receives the pension?",
              options: [
                "His mother — the nomination is a legal contract",
                "His wife and children — his will overrides the old nomination",
                "The fund trustees decide, considering all dependants — likely split between wife, children, and possibly mother",
                "His estate — nominations older than 5 years automatically lapse",
              ],
              correct: 2,
              feedback: {
                correct:
                  "Section 37C gives trustees discretion to distribute equitably among all financial dependants. They will likely prioritise the wife and minor children over the mother. The nomination is guidance, not a binding contract for retirement funds.",
                incorrect:
                  "Section 37C requires trustees to identify all financial dependants. With a wife and two minor children, they are almost certainly considered dependants. The trustees will likely allocate the bulk to them, regardless of the 10-year-old nomination.",
              },
            } satisfies LessonStep,
            {
              type: "info",
              title: "Life Insurance Nominations vs Estate",
              content:
                "<p>Life insurance policies follow the Insurance Act, not the Pension Funds Act. Here, your nominated beneficiary has a binding contractual right — the insurer pays them directly, bypassing your estate.</p><p><strong>Estate-duty implications:</strong></p><ul><li>Policies with nominated beneficiaries: included in estate duty calculation BUT the estate duty liability can be reduced by the 'Section 3(3)(a) deduction'</li><li>In practice: the first R3.5 million of life insurance to the estate is duty-free (part of the general abatement)</li></ul><p><strong>Common mistake:</strong> Naming your estate as life policy beneficiary (instead of a person). This means the payout goes into your estate, becomes available to creditors, and takes 12–24 months to reach your family. Name a person, not 'my estate'.</p>",
            } satisfies LessonStep,
            {
              type: "true-false",
              statement:
                "You should review your beneficiary nominations at least every 5 years or after any major life change (marriage, divorce, birth, death of a nominee).",
              correct: true,
              feedback: {
                correct:
                  "Correct. Stale nominations are one of the most common estate planning failures. A nomination made before a divorce can direct your pension to your ex-spouse. Most fund administrators allow annual online updates. Treat this as an annual financial hygiene task.",
                incorrect:
                  "This is best practice, not optional. Stale nominations have caused devastating outcomes — assets to ex-spouses, funds to deceased nominees (going intestate), and minor children's inheritances managed by the state. Review annually.",
              },
            } satisfies LessonStep,
            {
              type: "scenario",
              question:
                "Lindiwe (42) has: R2.8m pension (nominated beneficiary: her mother), R1.5m life policy (no beneficiary named — goes to estate), R3m property (in her name, willed to her two children aged 10 and 14). She wants her children to receive everything. What is the single highest-impact change she should make?",
              options: [
                "Rewrite her will to include her pension explicitly",
                "Update the pension nomination to name her children directly",
                "Create an inter vivos trust and name it as life policy beneficiary",
                "Register the property in a trust to avoid estate duty",
              ],
              correct: 2,
              feedback: {
                correct:
                  "The pension nomination (R2.8m) naming her mother must be corrected. However, minor children cannot receive large sums directly — a testamentary trust in the will handles their inheritance. An inter vivos trust as life policy beneficiary (R1.5m) keeps the payout liquid, outside the estate, and managed by trustees for the children's benefit. This is the highest-impact structural change.",
                incorrect:
                  "The pension nomination update is critical but not sufficient alone. Minor children cannot directly receive large inheritances — they go to the Guardian's Fund. An inter vivos trust as the life policy beneficiary keeps R1.5m liquid and properly managed for the children. The full plan: update pension nomination + add testamentary trust in will + consider inter vivos trust.",
              },
            } satisfies LessonStep,
          ],
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// COURSE 3: ADVANCED INVESTING
// ─────────────────────────────────────────────────────────────────────────────

export const ADVANCED_INVESTING_COURSE: Course = {
  id: "advanced-investing",
  title: "Advanced Investing",
  description:
    "Modern portfolio theory, factor investing, offshore allocation, sequence-of-returns risk, and tax-efficient portfolio construction for serious South African investors",
  icon: "trending-up",
  units: [
    {
      id: "unit-1",
      title: "Portfolio Theory and Construction",
      description:
        "How to build a portfolio that maximises returns for a given level of risk",
      lessons: [
        {
          id: "modern-portfolio-theory",
          title: "Modern Portfolio Theory — Why Diversification Pays",
          steps: [
            {
              type: "info",
              title: "The Efficient Frontier",
              content:
                "<p>Harry Markowitz's 1952 Nobel Prize-winning insight: you can combine assets that individually are risky into a portfolio that is less risky than any single asset, while maintaining return. This is the free lunch of diversification.</p><p><strong>The key: correlation.</strong> When SA stocks fall, your US bonds may rise. When the JSE All Share drops 30%, global equity ETFs in rand terms may cushion the blow because global markets don't always move in lockstep with SA, and a weakening rand boosts offshore returns.</p><p><strong>The efficient frontier</strong> is the set of portfolios that offer the highest expected return for each level of risk (standard deviation). Portfolios below the frontier are inefficient — you are taking more risk than necessary for the return you earn.</p>",
            } satisfies LessonStep,
            {
              type: "info",
              title: "Asset Allocation Drives 90% of Returns",
              content:
                "<p>The landmark Brinson, Hood and Beebower study (1986, replicated multiple times) found that asset allocation — the split between equities, bonds, property, cash, and offshore — explains over 90% of long-term portfolio variability. Stock picking and market timing together explain less than 10%.</p><p><strong>Practical implication:</strong> The decision 'how much in SA equities vs global equities vs bonds vs cash?' matters far more than which specific fund or ETF you choose. Getting the allocation right, and keeping costs low within each allocation, is the core of long-term wealth building.</p><p><strong>SA-specific context:</strong> Many SA investors are heavily overweight SA assets (JSE All Share, SA property, SA bonds). SA represents less than 0.5% of global GDP. A 100% SA portfolio is a concentrated bet on one emerging market.</p>",
            } satisfies LessonStep,
            {
              type: "mcq",
              question:
                "A portfolio of only SA equities (JSE All Share) has historically earned approximately 12% per year but with high volatility. Adding 40% global bonds (historically ~5% return, low correlation to SA equities) creates a portfolio that:",
              options: [
                "Earns less and is more volatile — bonds drag returns down",
                "Earns the same but with lower volatility — bonds are a pure buffer",
                "Likely earns slightly less but with meaningfully lower volatility — improving the risk-adjusted return (Sharpe ratio)",
                "Earns more with lower volatility — bonds amplify equity returns",
              ],
              correct: 2,
              feedback: {
                correct:
                  "Adding low-correlation assets reduces volatility more than proportionally. The blended portfolio earns less in raw terms (weighted average of 12% and 5% ≈ 9.2%) but the volatility reduction improves the Sharpe ratio — more return per unit of risk. This is the core of portfolio theory.",
                incorrect:
                  "Adding low-correlation assets reduces volatility more than proportionally. The raw return falls (weighted average), but volatility falls even more. The risk-adjusted return (Sharpe ratio) improves. You take less risk per unit of expected return.",
              },
            } satisfies LessonStep,
            {
              type: "info",
              title: "Rebalancing: Buying Low, Selling High Automatically",
              content:
                "<p>If your target allocation is 60% equities / 40% bonds, and equities surge 30% while bonds return 5%, your portfolio drifts to roughly 65/35. Rebalancing back to 60/40 forces you to sell equities (which have risen) and buy bonds (which are relatively cheap). This is systematic buying low and selling high.</p><p><strong>Rebalancing discipline in SA:</strong></p><ul><li>Use annual or threshold-triggered rebalancing (e.g., when any asset class drifts more than 5% from target)</li><li>Within a TFSA, rebalancing is free — no CGT. In taxable accounts, rebalancing may trigger CGT. Prefer to rebalance using new contributions where possible.</li><li>Avoid over-rebalancing — transaction costs and CGT erode benefits of frequent rebalancing</li></ul>",
            } satisfies LessonStep,
            {
              type: "scenario",
              question:
                "Priya has a R500 000 portfolio: 60% JSE equity ETF (R300 000), 40% global bond ETF (R200 000). After a strong JSE year, it's now: JSE = R420 000, global bonds = R210 000. Total R630 000. Her target is 60/40. What should she do?",
              options: [
                "Do nothing — the JSE is outperforming, let it ride",
                "Sell JSE ETF down to R378 000, add R252 000 to bonds (60/40 of R630 000)",
                "Switch entirely to global bonds since JSE is overvalued",
                "Increase JSE allocation to 70% since it is outperforming",
              ],
              correct: 1,
              feedback: {
                correct:
                  "R630 000 × 60% = R378 000 target for JSE. Currently R420 000 — sell R42 000. R630 000 × 40% = R252 000 target for bonds. Currently R210 000 — buy R42 000. This is systematic rebalancing: selling what has risen, buying what has lagged.",
                incorrect:
                  "Target allocation: JSE = R630 000 × 60% = R378 000 (currently R420 000 — sell R42 000). Bonds = R252 000 (currently R210 000 — buy R42 000). Letting winners run un-rebalanced increases risk and abandons the strategic allocation.",
              },
            } satisfies LessonStep,
          ],
        },
        {
          id: "factor-investing-sa",
          title: "Factor Investing — The Evidence-Based Edge",
          steps: [
            {
              type: "info",
              title: "What Are Investment Factors?",
              content:
                "<p>Academic research (Fama-French, 1992 onward) identified specific characteristics — 'factors' — that have historically delivered higher returns than the broad market over long periods. These are not tips or predictions — they are systematic, rules-based tilts.</p><p><strong>The five factors with the strongest evidence:</strong></p><ul><li><strong>Value:</strong> Cheap stocks (low price-to-book, price-to-earnings) outperform expensive ones over long periods</li><li><strong>Size:</strong> Smaller companies have historically outperformed large caps</li><li><strong>Momentum:</strong> Stocks that have risen over the past 6–12 months tend to continue rising in the short term</li><li><strong>Quality:</strong> Profitable, low-debt companies with stable earnings outperform</li><li><strong>Low Volatility:</strong> Lower-risk stocks have outperformed higher-risk stocks — the opposite of what CAPM predicts</li></ul>",
            } satisfies LessonStep,
            {
              type: "info",
              title: "Factor Investing on the JSE",
              content:
                "<p>SA factor evidence broadly mirrors global findings:</p><p><strong>Value on the JSE:</strong> Resources stocks (Sasol, Anglo American, Exxaro) historically trade at lower P/E multiples and have delivered strong long-term returns when commodity cycles turn. A blended value tilt on the JSE has outperformed the SWIX by approximately 2–3% annually over 20-year periods.</p><p><strong>Quality on the JSE:</strong> Companies like Capitec, Clicks, and Sanlam demonstrate the quality factor — high ROE, consistent earnings growth, low leverage — and have significantly outperformed the index.</p><p><strong>Practical tools:</strong> Satrix launched a Quality ETF (STXQUA) and a Momentum ETF (STXMOM). Ashburton Investments offers a Global 1200 ETF with a quality screen. These give retail investors factor exposure without active management fees.</p>",
            } satisfies LessonStep,
            {
              type: "mcq",
              question:
                "A 'value' factor tilt in a portfolio means systematically overweighting:",
              options: [
                "Growth stocks with high future earnings expectations",
                "Stocks with low price-to-earnings and price-to-book ratios relative to peers",
                "Large-cap companies with the highest dividend yields",
                "Stocks that have risen the most in the past 12 months",
              ],
              correct: 1,
              feedback: {
                correct:
                  "The value factor targets stocks trading at low multiples of earnings, book value, or cash flow relative to the market. The academic rationale: cheap stocks may be out of favour or riskier in ways not captured by beta — investors are compensated for holding them.",
                incorrect:
                  "Value = buying cheap relative to fundamentals (low P/E, P/B, P/CF). High dividends alone don't define value. High recent performance is the momentum factor. High future expectations = growth. Value and growth are opposite ends of the spectrum.",
              },
            } satisfies LessonStep,
            {
              type: "info",
              title: "Factor Risk Premiums Are Not Free",
              content:
                "<p>Factor returns come with a catch: they can underperform for years. Value underperformed growth for the entire decade 2010–2020 before recovering strongly in 2021–2022. A disciplined investor who abandoned value in 2019 missed the recovery.</p><p><strong>Key disciplines for factor investing:</strong></p><ul><li>Use factors as long-term tilts (10+ year horizon), not short-term trades</li><li>Combine uncorrelated factors (value + momentum, quality + low vol) to smooth underperformance periods</li><li>Keep factor exposure cheap — Smart Beta ETFs give factor exposure at 0.2–0.5% fees vs 1.5–2.5% for active funds that claim factor tilts</li><li>Accept that any factor can underperform for 3–5 years without it 'being broken'</li></ul>",
            } satisfies LessonStep,
            {
              type: "true-false",
              statement:
                "Factor investing (smart beta) is a form of active fund management where a human decides which stocks to buy each day.",
              correct: false,
              feedback: {
                correct:
                  "Factor investing is rules-based and systematic — a computer applies the factor screen (e.g., lowest P/B decile) and holds the qualifying stocks. It is between passive (market cap index) and active (human stock picking). Fees are typically much lower than active management.",
                incorrect:
                  "Factor (smart beta) strategies are systematic and rules-based. The rules are set by humans initially, but stock selection is algorithmic. They are passive in execution — no daily human decisions. This is why fees (0.2–0.5%) are far lower than active funds.",
              },
            } satisfies LessonStep,
          ],
        },
        {
          id: "offshore-allocation-sa",
          title: "Offshore Allocation for South Africans",
          steps: [
            {
              type: "info",
              title: "Why You Must Have Offshore Exposure",
              content:
                "<p>The JSE All Share Index represents approximately 0.4% of global market capitalisation. South Africa has a population of 60 million vs a global population of 8 billion. SA GDP is roughly 0.4% of world GDP.</p><p>A 100% SA equity portfolio is one of the most concentrated, idiosyncratic bets any investor can make. You are exposed to:</p><ul><li>Load shedding disrupting corporate earnings</li><li>Political risk and policy uncertainty</li><li>Rand depreciation eroding purchasing power</li><li>A commodity-heavy index (mining ~20%) with low tech and healthcare exposure</li></ul><p>Global equities give you: US tech (Apple, Microsoft, Nvidia), European healthcare (Novartis, AstraZeneca), Asian growth, and — crucially — <strong>rand hedging</strong>. When the rand weakens, your offshore investments are worth more in rand terms.</p>",
            } satisfies LessonStep,
            {
              type: "info",
              title: "Regulation 28 — The Rules for Retirement Funds",
              content:
                "<p>If your RA or pension fund is governed by Regulation 28 (most local funds are), it limits offshore exposure:</p><ul><li>Maximum 45% offshore (increased from 30% in 2022)</li><li>Maximum 10% in Africa (excluding SA)</li><li>Maximum 25% in equities (listed and unlisted)</li></ul><p>This means your RA cannot be 100% offshore — it must hold at least 55% SA assets. This is a government policy decision to keep retirement savings partly funding SA infrastructure.</p><p><strong>Outside Regulation 28 (personal taxable investments and TFSA):</strong> No offshore limit. You can hold 100% global equity ETF in your TFSA if you choose. Many advisors recommend 50–75% offshore in the non-retirement portion of a SA investor's portfolio.</p>",
            } satisfies LessonStep,
            {
              type: "mcq",
              question:
                "You have R1 million in a TFSA. You want maximum rand-hedge exposure. Which is the single most compliant and effective approach?",
              options: [
                "100% Satrix ALSI (SA market cap index) — proven track record",
                "100% Satrix MSCI World (global equity ETF) — no Regulation 28 applies to TFSAs",
                "50/50 Satrix ALSI and Satrix MSCI World",
                "Fixed deposit in USD via a SA bank account",
              ],
              correct: 1,
              feedback: {
                correct:
                  "TFSAs are not bound by Regulation 28. 100% global equity ETF is legally permitted and gives full rand-hedge plus global diversification. No South African tax on growth. This is a perfectly legitimate strategy for long-term TFSA investors.",
                incorrect:
                  "Regulation 28 only applies to retirement funds (RA, pension, provident). TFSAs have no offshore limit. 100% Satrix MSCI World in a TFSA is legal, tax-efficient, and provides full rand-hedge plus exposure to global markets including US tech, European healthcare, and Asian growth.",
              },
            } satisfies LessonStep,
            {
              type: "info",
              title: "Practical Offshore Investment Tools for SA Investors",
              content:
                "<p><strong>Via SA platforms (easiest, rand-denominated):</strong></p><ul><li>Satrix MSCI World ETF (STXWDM) — global developed markets, ~0.35% fee</li><li>CoreShares S&P 500 ETF — US only, low cost</li><li>Ashburton Global 1200 ETF — 1200 global large-caps</li><li>1nvest S&P 500 ETF — very low cost, USD-priced on JSE</li></ul><p><strong>Via offshore platforms (direct foreign currency):</strong></p><ul><li>EasyEquities USD account — buy US ETFs (iShares, Vanguard) in dollars</li><li>SARB single discretionary allowance: R1 million/year offshore without tax clearance</li><li>Foreign investment allowance: R10 million/year with SARS tax clearance (green TCC)</li></ul><p>JSE-listed global ETFs and direct offshore platforms both provide genuine foreign currency exposure. JSE-listed ETFs are slightly simpler (no SWIFT transfers) but may have slightly higher fees.</p>",
            } satisfies LessonStep,
            {
              type: "scenario",
              question:
                "Bongani (35) has R3 million saved: R1.5m in an RA (Regulation 28 applies), R1m in a TFSA, R500k in a personal investment account. He wants maximum offshore diversification. What is the optimal allocation?",
              options: [
                "All three accounts: 100% SA equity (familiarity advantage)",
                "RA: 45% offshore (max allowed), TFSA: 100% global equity ETF, Personal: 75% global equity ETF",
                "RA: 30% offshore, TFSA: 50% global, Personal: 50% global",
                "Move everything to EasyEquities USD account",
              ],
              correct: 1,
              feedback: {
                correct:
                  "Within Regulation 28: max 45% offshore in the RA. The TFSA has no cap: 100% global equity is perfectly legal and tax-free. The personal account: 75%+ offshore is sensible given SA's idiosyncratic risk. This maximises rand hedging within legal limits. Overall portfolio is ~63% offshore.",
                incorrect:
                  "Optimise each account type within its rules: RA is capped at 45% offshore (Reg 28). TFSA has zero cap — 100% global is ideal. Personal account has no cap. The goal is maximising legal offshore exposure across the portfolio.",
              },
            } satisfies LessonStep,
          ],
        },
        {
          id: "sequence-of-returns",
          title: "Sequence-of-Returns Risk — The Retirement Killer",
          steps: [
            {
              type: "info",
              title: "Why Average Returns Lie in Retirement",
              content:
                "<p>Imagine two retirees, both with R5 million and a 10% average annual return over 20 years. Retiree A gets good returns early (25%, 20%) then bad later (−25%, −20%). Retiree B gets the exact reverse — bad early, good later.</p><p>They have identical average returns. But Retiree B, who faced large losses early while withdrawing living expenses, runs out of money 8 years before Retiree A.</p><p>This is <strong>sequence-of-returns risk</strong> — the order of returns matters enormously in retirement. A market crash in year 2 of retirement permanently depletes capital that would otherwise have compounded.</p>",
            } satisfies LessonStep,
            {
              type: "info",
              title: "The 4% Rule and Its SA-Specific Limits",
              content:
                "<p>The 4% safe withdrawal rate comes from US research (Trinity Study, 1998) on US markets over 30 years. In SA, the picture is more complex:</p><ul><li>Higher inflation: SA's long-run CPI averages 5–6% vs US 2–3%. The 4% rule needs inflation adjustment.</li><li>Higher bond yields: SA bonds yield more, which helps income portfolios</li><li>Currency volatility: Rand depreciation affects purchasing power for imported goods</li><li>JSE volatility: Higher than most developed markets</li></ul><p><strong>Practical SA guidance:</strong> Financial advisors suggest 3–3.5% initial withdrawal rate for SA retirees with a 30-year horizon, rising to 4–4.5% if the portfolio has significant offshore exposure (which acts as a natural inflation and rand-weakness hedge).</p>",
            } satisfies LessonStep,
            {
              type: "mcq",
              question:
                "A retiree with R6 million withdraws R240 000/year (4%). In year 1, the portfolio drops 30% to R4.2m before withdrawals. After the withdrawal, R3.96m remains. Why is this uniquely damaging vs a working investor with the same drawdown?",
              options: [
                "It isn't — a 30% loss is equally bad for everyone",
                "A retiree pays more tax on withdrawals in down years",
                "The withdrawal permanently removes capital that cannot benefit from the recovery — less base to compound from",
                "Retirees have shorter time horizons so losses don't matter as much",
              ],
              correct: 2,
              feedback: {
                correct:
                  "A working investor experiencing a 30% loss doesn't withdraw — they may even buy more at lower prices. The retiree must sell units at depressed prices to fund living expenses. Those sold units cannot participate in the recovery. This 'forced selling low' is the mechanism that makes early sequence losses so destructive.",
                incorrect:
                  "The retiree is forced to sell units at depressed prices to fund withdrawals. A working investor can wait for recovery without selling. The retiree's depleted capital base earns a smaller absolute return during recovery — permanently reducing the portfolio's longevity.",
              },
            } satisfies LessonStep,
            {
              type: "info",
              title: "Strategies to Manage Sequence Risk",
              content:
                "<p><strong>1. Cash buffer:</strong> Hold 1–2 years of living expenses in cash or money market. Draw from this during market downturns, giving equities time to recover without forced selling.</p><p><strong>2. Bucket strategy:</strong> Divide the portfolio into short-term (cash, 1–3 years), medium-term (bonds and income assets, 3–7 years), and long-term (equities, 7+ years) buckets. Replenish the short-term bucket from the medium-term when markets are up.</p><p><strong>3. Flexible withdrawals:</strong> Reduce withdrawals in bad years (spend less, draw less). Even a 10% reduction in withdrawals in a down year significantly extends portfolio longevity.</p><p><strong>4. Living annuity vs guaranteed annuity:</strong> A guaranteed annuity transfers sequence risk to the insurer in exchange for surrendering capital. A living annuity retains flexibility but exposes the retiree to sequence risk. Many advisors recommend a blend.</p>",
            } satisfies LessonStep,
            {
              type: "scenario",
              question:
                "Nomsa retires at 62 with R7 million in a living annuity (70% equities). In her first year, the JSE falls 28%. Her advisor suggests she has two options. Which is more likely to protect her portfolio longevity?",
              options: [
                "Switch to 100% equities to recover faster when markets bounce",
                "Reduce her withdrawal rate from 4.5% to 3.5% for 2 years and draw from the money-market portion, not equities",
                "Switch entirely to fixed-income assets to stop the volatility",
                "Withdraw the same amount — she needs the income",
              ],
              correct: 1,
              feedback: {
                correct:
                  "Reducing withdrawals during the downturn and funding living expenses from the cash/money-market buffer avoids forced equity selling at depressed prices. This is the single most effective lever to manage sequence-of-returns risk. The portfolio's equity portion recovers without being depleted by withdrawals.",
                incorrect:
                  "Reducing withdrawals and drawing from non-equity assets (money market buffer) is the core of sequence-risk management. This prevents forced selling at low prices. Switching to 100% equity increases volatility — the opposite of what's needed. All fixed income surrenders the growth needed to outlast a 25-year retirement.",
              },
            } satisfies LessonStep,
          ],
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// COURSE 4: ADVANCED BUSINESS FINANCE
// ─────────────────────────────────────────────────────────────────────────────

export const BUSINESS_FINANCE_ADVANCED_COURSE: Course = {
  id: "business-finance-advanced",
  title: "Business Finance: Advanced",
  description:
    "Company structures, reading financial statements, business valuation, funding rounds, and succession planning for South African business owners",
  icon: "briefcase",
  units: [
    {
      id: "unit-1",
      title: "Company Structures and Tax Optimisation",
      description:
        "Pty Ltd, sole prop, NPC, and trust — how to choose the right structure and minimise tax legally",
      lessons: [
        {
          id: "company-structures-sa",
          title: "Business Structures: Tax, Liability, and Control",
          steps: [
            {
              type: "info",
              title: "The Four Main Business Structures in SA",
              content:
                "<p><strong>1. Sole Proprietor:</strong> No separation between you and the business. All profits taxed as personal income (up to 45%). Unlimited personal liability. Zero setup cost. Works for freelancers under R1m turnover.</p><p><strong>2. Private Company (Pty Ltd):</strong> Separate legal entity. 27% corporate tax rate. Personal liability protection (limited). Requires CIPC registration. Ideal for businesses above R500k turnover.</p><p><strong>3. Personal Service Provider (PSP):</strong> A Pty Ltd where 80%+ of income comes from services to one or two clients. SARS taxes PSPs at the 28–45% rate (not the 27% corporate rate) — this is a trap many contractors fall into.</p><p><strong>4. Small Business Corporation (SBC):</strong> A Pty Ltd qualifying for reduced tax rates. Gross income under R20 million. No shareholder may hold shares in another company. Tax rate: 0% on first R95 750, then 7%–27% on tiers. For qualifying SMEs, this saves substantial tax.</p>",
            } satisfies LessonStep,
            {
              type: "info",
              title: "Small Business Corporation (SBC) Tax Rates 2024/25",
              content:
                "<p>If your Pty Ltd qualifies as an SBC (gross income ≤ R20 million, shareholders are natural persons who hold no other shares, not a PSP, and not an investment company), the tax rate table is:</p><table style='width:100%;border-collapse:collapse;font-size:0.9em'><tr><th style='text-align:left;padding:4px 8px;border-bottom:1px solid #ddd'>Taxable Income</th><th style='text-align:left;padding:4px 8px;border-bottom:1px solid #ddd'>Rate</th></tr><tr><td style='padding:4px 8px'>R0 – R95 750</td><td style='padding:4px 8px'>0%</td></tr><tr><td style='padding:4px 8px'>R95 751 – R365 000</td><td style='padding:4px 8px'>7% on amount above R95 750</td></tr><tr><td style='padding:4px 8px'>R365 001 – R550 000</td><td style='padding:4px 8px'>R18 848 + 21% on amount above R365 000</td></tr><tr><td style='padding:4px 8px'>Above R550 000</td><td style='padding:4px 8px'>R57 698 + 27% on amount above R550 000</td></tr></table><p>Example: SBC with R500 000 taxable income. Tax = R18 848 + 21% × (R500 000 − R365 000) = R18 848 + R28 350 = R47 198. Effective rate: 9.4%. A large company pays 27% = R135 000. Saving: R87 802 per year.</p>",
            } satisfies LessonStep,
            {
              type: "fill-blank",
              title: "SBC Tax Calculation",
              prompt:
                "Your qualifying SBC has taxable income of R300 000. Using SBC rates, tax = R___ (enter the rounded rand amount).",
              correct: 14268,
              feedback: {
                correct:
                  "R300 000 − R95 750 = R204 250 × 7% = R14 268. At the standard 27% corporate rate, tax would be R81 000. The SBC saves R66 732 on this profit level.",
                incorrect:
                  "R300 000 falls in the second SBC bracket (R95 751 – R365 000). Tax = (R300 000 − R95 750) × 7% = R204 250 × 7% = R14 268. Standard corporate tax would be R81 000 — SBC saves R66 732.",
              },
            } satisfies LessonStep,
            {
              type: "mcq",
              question:
                "Zanele is a freelance graphic designer earning R1.2 million from two clients (60% from one, 40% from another). She sets up a Pty Ltd. SARS is likely to classify this as:",
              options: [
                "A standard Pty Ltd at 27% corporate tax",
                "A Small Business Corporation at reduced rates",
                "A Personal Service Provider — taxed at individual income tax rates",
                "A non-profit company",
              ],
              correct: 2,
              feedback: {
                correct:
                  "A PSP is a company where the shareholder renders personal services, more than 80% of revenue comes from one/two clients, and services are rendered primarily by connected persons. Zanele's setup meets PSP criteria — SARS will tax the income at normal income tax rates (up to 45%), removing the 27% corporate tax advantage.",
                incorrect:
                  "Zanele's company is a Personal Service Provider. Criteria: personal services, predominantly from two clients, rendered by the shareholder. PSPs are taxed at normal income tax rates, not 27%. The corporate wrapper provides limited tax benefit for PSPs.",
              },
            } satisfies LessonStep,
            {
              type: "info",
              title: "Pty Ltd vs Trust: The Tax Comparison",
              content:
                "<p>Both are used for wealth protection and tax planning, but they work very differently:</p><table style='width:100%;border-collapse:collapse;font-size:0.9em'><tr><th style='padding:4px 8px;border-bottom:1px solid #ddd;text-align:left'>Feature</th><th style='padding:4px 8px;border-bottom:1px solid #ddd;text-align:left'>Pty Ltd</th><th style='padding:4px 8px;border-bottom:1px solid #ddd;text-align:left'>Inter Vivos Trust</th></tr><tr><td style='padding:4px 8px'>Income tax rate</td><td style='padding:4px 8px'>27% (SBC: 0–27%)</td><td style='padding:4px 8px'>45% flat if retained</td></tr><tr><td style='padding:4px 8px'>CGT inclusion</td><td style='padding:4px 8px'>80%</td><td style='padding:4px 8px'>80%</td></tr><tr><td style='padding:4px 8px'>Income splitting</td><td style='padding:4px 8px'>Via dividends</td><td style='padding:4px 8px'>Via vesting to beneficiaries</td></tr><tr><td style='padding:4px 8px'>Estate duty</td><td style='padding:4px 8px'>Shares included in estate</td><td style='padding:4px 8px'>Trust assets excluded from estate</td></tr><tr><td style='padding:4px 8px'>Best use</td><td style='padding:4px 8px'>Trading, operating businesses</td><td style='padding:4px 8px'>Holding assets, estate planning</td></tr></table><p><strong>Common advanced structure:</strong> Pty Ltd (operating company) earns income, declares dividends to a family trust (holding company). The trust vests income to lower-bracket beneficiaries. Estate duty avoided on trust assets. Operational simplicity of company retained.</p>",
            } satisfies LessonStep,
          ],
        },
        {
          id: "reading-financial-statements",
          title: "Reading Financial Statements Like a CFO",
          steps: [
            {
              type: "info",
              title: "The Three Financial Statements and What They Tell You",
              content:
                "<p>Every business produces three core financial statements:</p><p><strong>1. Income Statement (P&L):</strong> Shows revenue, costs, and profit over a period. Answers: 'Is the business making money?'</p><p><strong>2. Balance Sheet:</strong> Shows assets, liabilities, and equity at a point in time. Answers: 'What does the business own and owe?'</p><p><strong>3. Cash Flow Statement:</strong> Shows actual cash moving in and out. Answers: 'Does the business have cash to survive?' (A business can be profitable but cash-flow negative — this is how profitable companies go bankrupt.)</p>",
            } satisfies LessonStep,
            {
              type: "info",
              title: "The Most Important Ratios for SA Business Owners",
              content:
                "<p><strong>Gross Profit Margin:</strong> (Revenue − Cost of Goods Sold) ÷ Revenue. Measures how much you retain before overheads. A retail business at 25% GP margin is normal. A software business at 70%+ is normal. Compare to your industry benchmark.</p><p><strong>EBITDA Margin:</strong> Earnings Before Interest, Tax, Depreciation, and Amortisation ÷ Revenue. The cleanest measure of operational profitability. Used in business valuations (see next lesson).</p><p><strong>Current Ratio:</strong> Current Assets ÷ Current Liabilities. Above 1.5 = healthy. Below 1 = potential liquidity crisis — you may not be able to pay bills in 12 months.</p><p><strong>Debtor Days:</strong> (Debtors ÷ Revenue) × 365. How long customers take to pay. 30 days is standard; 90+ days is a cash flow problem. Every day of debtor days = revenue sitting uncollected.</p><p><strong>Net Profit Margin:</strong> Net profit ÷ Revenue. After all costs including tax. Most healthy SMEs: 8–20%.</p>",
            } satisfies LessonStep,
            {
              type: "mcq",
              question:
                "Thabo's distribution business: Revenue R5m, COGS R3.5m, Operating expenses R800k, Interest R100k, Tax R180k. Net Profit = R420k. EBITDA margin (assume depreciation R200k, no amortisation):",
              options: [
                "8.4% (net profit ÷ revenue)",
                "18% (R900k EBITDA ÷ R5m)",
                "14% (R700k operating profit ÷ R5m)",
                "20% (R1m gross profit ÷ R5m — wait, that's gross margin)",
              ],
              correct: 1,
              feedback: {
                correct:
                  "EBITDA = Net Profit + Interest + Tax + Depreciation = R420k + R100k + R180k + R200k = R900k. EBITDA margin = R900k ÷ R5m = 18%. This is a healthy EBITDA for a distribution business (industry average typically 8–15%).",
                incorrect:
                  "EBITDA = Net Profit + Interest + Tax + Depreciation = R420k + R100k + R180k + R200k = R900k. EBITDA margin = R900k ÷ R5m = 18%. EBITDA removes financing and accounting decisions to show pure operational profitability.",
              },
            } satisfies LessonStep,
            {
              type: "info",
              title: "Cash vs Profit — Why Profitable Businesses Fail",
              content:
                "<p>A business can be profitable but have no cash. This is the most common cause of SME failure in SA.</p><p><strong>Example:</strong> Priya's catering company bills R500 000 in March. Customers pay in 60 days (May). She pays wages, food, and rent now. The income statement shows R500 000 revenue. Her bank account shows −R200 000. She is profitable and cash-flow negative simultaneously.</p><p><strong>The cash conversion cycle:</strong> How long between paying for inputs and collecting from customers. Shorter = better. Strategies to shorten: require deposits, offer early-payment discounts, delay supplier payments within agreed terms, factor debtors (sell invoices to a financier at a discount).</p><p><strong>Rule:</strong> Never confuse your accounting profit with your bank balance. Run a weekly cash flow forecast for the next 13 weeks. If it turns negative, you need to act months before the crisis hits.</p>",
            } satisfies LessonStep,
            {
              type: "true-false",
              statement:
                "A business with a current ratio of 0.7 (current assets ÷ current liabilities) is in a financially healthy position.",
              correct: false,
              feedback: {
                correct:
                  "A current ratio below 1 means the business has less in current assets (cash, debtors, inventory) than it owes in the next 12 months (creditors, short-term loans, tax payable). It cannot cover its near-term obligations from existing assets — a liquidity risk that can lead to insolvency even if the business is profitable.",
                incorrect:
                  "A current ratio below 1 means current liabilities exceed current assets. The business cannot pay its short-term obligations from available assets. Below 1 requires immediate attention: collect debtors faster, negotiate extended creditor terms, or inject working capital.",
              },
            } satisfies LessonStep,
          ],
        },
        {
          id: "business-valuation",
          title: "How to Value a Business — and Why It Matters",
          steps: [
            {
              type: "info",
              title: "Why Every Business Owner Needs to Understand Valuation",
              content:
                "<p>Your business may be your largest asset. If you don't know what it's worth, you can't:</p><ul><li>Negotiate a fair price when selling</li><li>Buy out a partner at a fair value</li><li>Raise equity funding without being diluted unfairly</li><li>Do proper estate planning (the business must be valued for estate duty)</li><li>Set a realistic retirement target</li></ul><p>Most SA SME owners have an emotional attachment that inflates their estimate, and potential buyers use ignorance as a negotiating tool. Understanding valuation removes this information asymmetry.</p>",
            } satisfies LessonStep,
            {
              type: "info",
              title: "The Three Main Valuation Methods",
              content:
                "<p><strong>1. EBITDA Multiple (earnings-based):</strong> The most common for operating businesses. Value = EBITDA × industry multiple. SA SME multiples range from 2–5× EBITDA (vs 8–15× for listed companies). A profitable engineering firm with R2m EBITDA might sell for R6–8m (3–4× EBITDA). Factors increasing the multiple: recurring revenue, diversified customer base, management team not dependent on owner, strong growth trajectory.</p><p><strong>2. Discounted Cash Flow (DCF):</strong> Project future free cash flows, discount back at a risk-adjusted rate (WACC). More theoretically correct but highly sensitive to assumptions. Mainly used for larger businesses or by financial advisors during due diligence.</p><p><strong>3. Net Asset Value (NAV):</strong> Assets minus liabilities at market value. Used for asset-heavy businesses (property companies, mining, manufacturing). Often the floor value — a going concern should be worth more than its parts.</p>",
            } satisfies LessonStep,
            {
              type: "fill-blank",
              title: "EBITDA Multiple Valuation",
              prompt:
                "Your business has revenue of R8 million and a 15% EBITDA margin. Your industry trades at 4× EBITDA. The indicated valuation is R___ million. (Enter the number of millions.)",
              correct: 4.8,
              feedback: {
                correct:
                  "EBITDA = R8m × 15% = R1.2m. Valuation = R1.2m × 4 = R4.8m. This is the starting point for negotiation — actual price adjusts for debt, working capital, key person risk, and deal structure.",
                incorrect:
                  "EBITDA = Revenue × EBITDA margin = R8m × 15% = R1.2m. Valuation = EBITDA × multiple = R1.2m × 4 = R4.8m.",
              },
            } satisfies LessonStep,
            {
              type: "info",
              title: "What Kills a Business Valuation",
              content:
                "<p>Buyers will discount (lower) your asking price for these red flags, which are all correctable before a sale:</p><ul><li><strong>Key person dependency:</strong> If the owner IS the business (all relationships, all knowledge), the business is worth far less without them. Solution: document processes, introduce the management team to key clients, create a 12-month transition plan.</li><li><strong>Customer concentration:</strong> If 60%+ of revenue comes from one client, the buyer is buying a client relationship, not a business. Solution: diversify before selling.</li><li><strong>Unclean books:</strong> Personal expenses through the company, informal transactions, mixed accounts. Solution: 2–3 years of clean, audited or reviewed annual financial statements increase both value and buyer confidence.</li><li><strong>No contracts:</strong> Verbal agreements with key customers or suppliers. Buyers need contractual revenue. Solution: formalise all key relationships into written agreements.</li></ul>",
            } satisfies LessonStep,
            {
              type: "scenario",
              question:
                "Sipho has a cleaning business: R4m revenue, 20% EBITDA margin (R800k EBITDA), but 70% of revenue comes from one hospital contract. His advisor says the market multiple for cleaning businesses is 3.5×. A buyer offers R1.6m. Is this fair?",
              options: [
                "No, the fair value is R2.8m (R800k × 3.5) — the buyer is 43% below fair value",
                "The buyer's offer may be reasonable given customer concentration risk discounting the multiple to ~2×",
                "Yes, R1.6m is always fair for a R4m revenue business",
                "The valuation should be based on revenue (R4m), not EBITDA",
              ],
              correct: 1,
              feedback: {
                correct:
                  "Full multiple: R800k × 3.5 = R2.8m. But 70% revenue from one client is a severe concentration risk. If that client leaves, the business loses R2.8m revenue overnight. Buyers discount this heavily — a 2× multiple (R1.6m) is defensible. Sipho should diversify his client base to 3 years before selling to restore the full multiple.",
                incorrect:
                  "Base multiple: R800k × 3.5 = R2.8m. The buyer is applying ~2× due to customer concentration risk. 70% of revenue from one client means the business loses most of its value if that contract is not renewed. The discount is commercially rational. To recover the full multiple, Sipho must diversify before sale.",
              },
            } satisfies LessonStep,
          ],
        },
        {
          id: "business-funding",
          title: "Funding Your Business: Debt, Equity, and Government",
          steps: [
            {
              type: "info",
              title: "The Funding Spectrum for SA Businesses",
              content:
                "<p>From cheapest to most expensive in terms of cost and control:</p><ol><li><strong>Bootstrapping:</strong> Revenue funds growth. No dilution, no interest. Slow.</li><li><strong>Government grants and incentives:</strong> Free money, but slow, bureaucratic, and restrictive. Worth pursuing if your business qualifies.</li><li><strong>Debt (bank loans, asset finance):</strong> You pay interest but keep equity. Banks lend against assets or cash flow. SA SME lending rates: prime + 2–6%.</li><li><strong>Revenue-based financing:</strong> Funder takes a % of monthly revenue until repaid. Flexible for cash-flow businesses.</li><li><strong>Angel investors:</strong> Private individuals investing R500k–R5m for equity (10–25%). Bring expertise and networks.</li><li><strong>Venture capital:</strong> R5m–R100m+ for fast-growth businesses. Expect significant dilution (20–40%) and board control requirements.</li><li><strong>Private equity:</strong> Larger investments in established businesses, typically for majority control.</li></ol>",
            } satisfies LessonStep,
            {
              type: "info",
              title: "SA Government Funding You Should Know",
              content:
                "<p><strong>SEFA (Small Enterprise Finance Agency):</strong> Government-backed loans from R10 000 to R15 million. Cheaper than bank rates, designed for SMEs that don't qualify for commercial bank loans. Black-owned and women-owned businesses get priority.</p><p><strong>IDC (Industrial Development Corporation):</strong> R1m–R1 billion in loans and equity. Focus: manufacturing, agriculture, tourism, green economy. Longer terms, more flexible than banks.</p><p><strong>DTI Incentives (now DTIC):</strong> Manufacturing Development Incentive (MDI), Support Programme for Industrial Innovation (SPII), Aquaculture Development, Tourism Support Programme. Some are grants (non-repayable) for qualifying businesses.</p><p><strong>NDA (National Development Agency):</strong> Grants for NPOs and community-based organisations.</p><p><strong>Key insight:</strong> Most SA entrepreneurs never apply for government incentives. The process is bureaucratic but the money is non-dilutive (you don't give up equity). For capital-intensive businesses, a DTIC grant or IDC loan can be transformative.</p>",
            } satisfies LessonStep,
            {
              type: "mcq",
              question:
                "Zanele's tech startup has R2m recurring revenue, growing 80% per year, but needs R10m to scale her team and expand to East Africa. She approaches a venture capital firm. They offer R10m for 35% equity (valuing the company at ~R28.5m). Is this a good deal?",
              options: [
                "No — 35% is too much to give up for R10m",
                "Depends on the pre-money valuation and what the VC brings beyond money",
                "Yes — always take VC money if offered",
                "She should take bank debt instead to avoid any dilution",
              ],
              correct: 1,
              feedback: {
                correct:
                  "R10m for 35% implies pre-money valuation of R18.6m (post-money R28.6m). At 80% growth and R2m ARR, this is a ~9× revenue multiple — reasonable for high-growth African tech. But what matters as much as the price: Does the VC have East Africa networks? Experience scaling B2B SaaS? The right VC accelerates beyond what the money alone buys.",
                incorrect:
                  "The valuation math: R10m ÷ 35% = R28.6m post-money, R18.6m pre-money. At R2m ARR × 80% growth, ~9× revenue is reasonable. Whether it's a 'good deal' depends on: the VC's value-add (networks, expertise, follow-on capacity), not just the percentage. Bank debt is unsuitable for a pre-profit startup with no assets.",
              },
            } satisfies LessonStep,
            {
              type: "info",
              title: "The Shareholders Agreement — Non-Negotiable Before Taking Investment",
              content:
                "<p>A shareholders agreement governs the relationship between shareholders — what happens when someone wants to leave, dies, goes bankrupt, or you disagree fundamentally. Without one, the default Companies Act rules apply, and they are rarely what you want.</p><p><strong>Critical clauses every SA shareholders agreement needs:</strong></p><ul><li><strong>Tag-along:</strong> If a majority shareholder sells, minority shareholders can join the sale on the same terms</li><li><strong>Drag-along:</strong> Majority can force minority to sell if a buyer wants 100%</li><li><strong>Right of first refusal:</strong> Before a shareholder sells to an outsider, existing shareholders get first right to buy at the same price</li><li><strong>Deadlock resolution:</strong> When equal shareholders disagree on a fundamental decision — the mechanism to resolve it (buy-sell clause, mediation, arbitration)</li><li><strong>Buyout on death/disability:</strong> What happens to shares if a shareholder dies or becomes incapacitated? Fund this with life and disability insurance.</li></ul>",
            } satisfies LessonStep,
            {
              type: "scenario",
              question:
                "Thabo and Sipho each own 50% of a profitable Pty Ltd. Their shareholders agreement has no deadlock clause. They fundamentally disagree on whether to acquire a competitor — Thabo says yes, Sipho says no. What most likely happens?",
              options: [
                "The Companies Act resolves the deadlock automatically — the Directors' decision is final",
                "The company is paralysed — neither 50% shareholder can override the other. Court intervention or forced liquidation may follow",
                "Thabo, as the one proposing action, wins by default",
                "SARS is notified and appoints an administrator",
              ],
              correct: 1,
              feedback: {
                correct:
                  "Without a deadlock clause, a 50/50 company with disagreeing shareholders is paralysed. Neither can act without the other's agreement. This frequently leads to expensive litigation, forced buy-out applications in court (Section 163 Companies Act), or liquidation of a profitable business — destroying value built over years. A deadlock clause (e.g., a 'shotgun clause') would have prevented this.",
                incorrect:
                  "50/50 ownership with no deadlock mechanism = business paralysis. The Companies Act offers no automatic resolution — it requires court applications that take years and cost hundreds of thousands. A 'shotgun clause' in the shareholders agreement resolves this: one party names a price, the other either buys at that price or sells at it.",
              },
            } satisfies LessonStep,
          ],
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Export all four Level 3 courses
// ─────────────────────────────────────────────────────────────────────────────

export const LEVEL_3_COURSES: Course[] = [
  ADVANCED_TAX_COURSE,
  ESTATE_PLANNING_COURSE,
  ADVANCED_INVESTING_COURSE,
  BUSINESS_FINANCE_ADVANCED_COURSE,
];
