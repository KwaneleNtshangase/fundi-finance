import type { Course, Lesson } from "./content";
import {
  MONEY_BASICS_EXTRA,
  SALARY_EXTRA,
  BANKING_EXTRA,
  CREDIT_DEBT_EXTRA,
  EMERGENCY_RISK_EXTRA,
  INVESTING_EXTRA,
  SA_INVESTING_EXTRA,
  PROPERTY_EXTRA,
  TAXES_EXTRA,
  SCAMS_FRAUD_EXTRA,
  BIBLE_MONEY_EXTRA,
  PSYCHOLOGY_EXTRA,
  RETIREMENT_EXTRA,
  RAND_ECONOMY_EXTRA,
  CRYPTO_EXTRA,
  BUSINESS_FINANCE_EXTRA,
} from "./content-extra";

function pick(extra: Lesson[], id: string): Lesson {
  const l = extra.find((x) => x.id === id);
  if (!l) throw new Error(`mergeContentExtras: missing lesson id "${id}"`);
  return l;
}

function withId(lesson: Lesson, id: string, title?: string): Lesson {
  return { ...lesson, id, ...(title ? { title } : {}) };
}

export function mergeContentExtras(courses: Course[]): Course[] {
  return courses.map((c) => {
    switch (c.id) {
      case "money-basics":
        return mergeMoneyBasics(c);
      case "salary-payslip":
        return mergeSalary(c);
      case "banking-debit":
        return mergeBanking(c);
      case "credit-debt":
        return mergeCreditDebt(c);
      case "emergency-fund":
        return mergeEmergencyFund(c);
      case "insurance":
        return mergeInsurance(c);
      case "investing-basics":
        return mergeInvestingBasics(c);
      case "sa-investing":
        return mergeSaInvesting(c);
      case "property":
        return mergeProperty(c);
      case "taxes":
        return mergeTaxes(c);
      case "scams-fraud":
        return mergeScams(c);
      case "bible-money":
        return mergeBibleMoney(c);
      case "money-psychology":
        return mergePsychology(c);
      case "retirement":
        return mergeRetirement(c);
      case "rand-economy":
        return mergeRandEconomy(c);
      case "crypto-basics":
        return mergeCrypto(c);
      case "business-finance":
        return mergeBusinessFinance(c);
      default:
        return c;
    }
  });
}

function mergeMoneyBasics(c: Course): Course {
  const [u0, u1] = c.units;
  const track = pick(MONEY_BASICS_EXTRA, "lesson-tracking-spending");
  const impulse = pick(MONEY_BASICS_EXTRA, "lesson-impulse-buying");
  const rest = MONEY_BASICS_EXTRA.filter(
    (l) => !["lesson-tracking-spending", "lesson-impulse-buying"].includes(l.id)
  );
  return {
    ...c,
    units: [
      {
        ...u0,
        lessons: [
          ...u0.lessons.filter((l) => l.id !== "lesson-4"),
          withId(track, "lesson-4"),
          ...rest,
        ],
      },
      {
        ...u1,
        lessons: u1.lessons.map((l) =>
          l.id === "lesson-6" ? withId(impulse, "lesson-6") : l
        ),
      },
    ],
  };
}

function mergeSalary(c: Course): Course {
  const u0 = c.units[0];
  const uif = pick(SALARY_EXTRA, "lesson-uif-claim");
  const ret = pick(SALARY_EXTRA, "lesson-retirement-on-payslip");
  const rest = SALARY_EXTRA.filter(
    (l) => !["lesson-uif-claim", "lesson-retirement-on-payslip"].includes(l.id)
  );
  return {
    ...c,
    units: [
      {
        ...u0,
        lessons: [
          ...u0.lessons.filter((l) => l.id !== "lesson-3" && l.id !== "lesson-4"),
          withId(uif, "lesson-3"),
          withId(ret, "lesson-4"),
          ...rest,
        ],
      },
    ],
  };
}

function mergeBanking(c: Course): Course {
  const [u0, u1] = c.units;
  const dig = pick(BANKING_EXTRA, "lesson-digital-banking");
  const stop = pick(BANKING_EXTRA, "lesson-stopping-debit-orders");
  const disp = pick(BANKING_EXTRA, "lesson-disputing-transactions");
  const rest = BANKING_EXTRA.filter(
    (l) =>
      ![
        "lesson-digital-banking",
        "lesson-stopping-debit-orders",
        "lesson-disputing-transactions",
      ].includes(l.id)
  );
  return {
    ...c,
    units: [
      {
        ...u0,
        lessons: u0.lessons.map((l) =>
          l.id === "lesson-3" ? withId(dig, "lesson-3") : l
        ),
      },
      {
        ...u1,
        lessons: [
          ...u1.lessons.filter((l) => l.id !== "lesson-5" && l.id !== "lesson-6"),
          withId(stop, "lesson-5"),
          withId(disp, "lesson-6"),
          ...rest,
        ],
      },
    ],
  };
}

function mergeCreditDebt(c: Course): Course {
  const [u0, u1] = c.units;
  const good = pick(CREDIT_DEBT_EXTRA, "lesson-good-bad-debt");
  const store = pick(CREDIT_DEBT_EXTRA, "lesson-store-cards");
  const consol = pick(CREDIT_DEBT_EXTRA, "lesson-debt-consolidation-detail");
  const usedIds = new Set([
    "lesson-good-bad-debt",
    "lesson-store-cards",
    "lesson-debt-consolidation-detail",
  ]);
  const rest = CREDIT_DEBT_EXTRA.filter((l) => !usedIds.has(l.id));
  return {
    ...c,
    units: [
      {
        ...u0,
        lessons: [
          ...u0.lessons.filter((l) => l.id !== "lesson-3" && l.id !== "lesson-4"),
          withId(good, "lesson-3"),
          withId(store, "lesson-4"),
          ...rest,
        ],
      },
      {
        ...u1,
        lessons: u1.lessons.map((l) =>
          l.id === "lesson-6" ? withId(consol, "lesson-6") : l
        ),
      },
    ],
  };
}

function mergeEmergencyFund(c: Course): Course {
  const [u0, u1] = c.units;
  const when = pick(EMERGENCY_RISK_EXTRA, "lesson-when-to-use-ef");
  const types = pick(EMERGENCY_RISK_EXTRA, "lesson-types-of-risk");
  const rr = pick(EMERGENCY_RISK_EXTRA, "lesson-risk-reward-practice");
  return {
    ...c,
    units: [
      {
        ...u0,
        lessons: u0.lessons.map((l) =>
          l.id === "lesson-3" ? withId(when, "lesson-3") : l
        ),
      },
      {
        ...u1,
        lessons: [
          ...u1.lessons.filter((l) => l.id !== "lesson-4" && l.id !== "lesson-5"),
          withId(types, "lesson-4"),
          withId(rr, "lesson-5"),
        ],
      },
    ],
  };
}

function mergeInsurance(c: Course): Course {
  const [u0, u1] = c.units;
  const dread = pick(EMERGENCY_RISK_EXTRA, "lesson-dread-disease");
  const disability = pick(EMERGENCY_RISK_EXTRA, "lesson-disability-planning");
  const income = pick(EMERGENCY_RISK_EXTRA, "lesson-income-protection");
  return {
    ...c,
    units: [
      {
        ...u0,
        lessons: u0.lessons.map((l) => {
          if (l.id === "lesson-3") return withId(dread, "lesson-3");
          if (l.id === "lesson-4") return withId(disability, "lesson-4");
          return l;
        }),
      },
      {
        ...u1,
        lessons: u1.lessons.map((l) =>
          l.id === "lesson-6" ? withId(income, "lesson-6") : l
        ),
      },
    ],
  };
}

function mergeInvestingBasics(c: Course): Course {
  const [u0, u1] = c.units;
  const th = pick(INVESTING_EXTRA, "lesson-time-horizon");
  const st = pick(INVESTING_EXTRA, "lesson-stocks-in-depth");
  const bd = pick(INVESTING_EXTRA, "lesson-bonds-explained");
  const usedIds = new Set([
    "lesson-time-horizon",
    "lesson-stocks-in-depth",
    "lesson-bonds-explained",
  ]);
  const rest = INVESTING_EXTRA.filter((l) => !usedIds.has(l.id));
  return {
    ...c,
    units: [
      {
        ...u0,
        lessons: u0.lessons.map((l) =>
          l.id === "lesson-4" ? withId(th, "lesson-4") : l
        ),
      },
      {
        ...u1,
        lessons: [
          ...u1.lessons.filter((l) => l.id !== "lesson-5" && l.id !== "lesson-6"),
          withId(st, "lesson-5"),
          withId(bd, "lesson-6"),
          ...rest,
        ],
      },
    ],
  };
}

function mergeSaInvesting(c: Course): Course {
  const [u0, u1] = c.units;
  const vs = pick(SA_INVESTING_EXTRA, "lesson-tfsa-vs-regular");
  const open = pick(SA_INVESTING_EXTRA, "lesson-how-to-open-tfsa");
  const ra = pick(SA_INVESTING_EXTRA, "lesson-ra-at-retirement");
  const pres = pick(SA_INVESTING_EXTRA, "lesson-preservation-fund");
  return {
    ...c,
    units: [
      {
        ...u0,
        lessons: u0.lessons.map((l) => {
          if (l.id === "lesson-2") return withId(vs, "lesson-2");
          if (l.id === "lesson-3") return withId(open, "lesson-3");
          return l;
        }),
      },
      {
        ...u1,
        lessons: u1.lessons.map((l) => {
          if (l.id === "lesson-5") return withId(ra, "lesson-5");
          if (l.id === "lesson-6") return withId(pres, "lesson-6");
          return l;
        }),
      },
    ],
  };
}

function mergeProperty(c: Course): Course {
  const [u0, u2] = c.units;
  const hl = pick(PROPERTY_EXTRA, "lesson-home-loan-mechanics");
  const dep = pick(PROPERTY_EXTRA, "lesson-deposit-requirements");
  const rvb = pick(PROPERTY_EXTRA, "lesson-rent-vs-buy");
  return {
    ...c,
    units: [
      {
        ...u0,
        lessons: u0.lessons.map((l) => {
          if (l.id === "lesson-2") return withId(hl, "lesson-2");
          if (l.id === "lesson-3") return withId(dep, "lesson-3");
          if (l.id === "lesson-4") return withId(rvb, "lesson-4");
          return l;
        }),
      },
      u2,
    ],
  };
}

function mergeTaxes(c: Course): Course {
  const [u0, u1] = c.units;
  const t = TAXES_EXTRA;
  const l2 = pick(t, "lesson-when-to-file");
  const l3 = pick(t, "lesson-tax-deductions");
  const l4 = pick(t, "lesson-capital-gains-tax");
  const l5 = pick(t, "lesson-provisional-tax");
  const l6 = pick(t, "lesson-vat-individuals");
  const used = new Set([
    "lesson-when-to-file",
    "lesson-tax-deductions",
    "lesson-capital-gains-tax",
    "lesson-provisional-tax",
    "lesson-vat-individuals",
  ]);
  const rest = TAXES_EXTRA.filter((l) => !used.has(l.id));
  const u0l = u0.lessons.filter((l) => l.id === "lesson-1");
  return {
    ...c,
    units: [
      {
        ...u0,
        lessons: [
          ...u0l,
          withId(l2, "lesson-2"),
          withId(l3, "lesson-3"),
          withId(l4, "lesson-4"),
          ...rest,
        ],
      },
      {
        ...u1,
        lessons: u1.lessons.map((l) => {
          if (l.id === "lesson-5") return withId(l5, "lesson-5");
          if (l.id === "lesson-6") return withId(l6, "lesson-6");
          return l;
        }),
      },
    ],
  };
}

function mergeScams(c: Course): Course {
  const [u0, u1] = c.units;
  const fake = pick(SCAMS_FRAUD_EXTRA, "lesson-fake-investments");
  const rom = pick(SCAMS_FRAUD_EXTRA, "lesson-romance-scams");
  const guar = pick(SCAMS_FRAUD_EXTRA, "lesson-guaranteed-returns-red-flag");
  const what = pick(SCAMS_FRAUD_EXTRA, "lesson-what-to-do-if-scammed");
  const used = new Set([
    "lesson-fake-investments",
    "lesson-romance-scams",
    "lesson-guaranteed-returns-red-flag",
    "lesson-what-to-do-if-scammed",
  ]);
  const rest = SCAMS_FRAUD_EXTRA.filter((l) => !used.has(l.id));
  return {
    ...c,
    units: [
      {
        ...u0,
        lessons: [
          ...u0.lessons.filter((l) => l.id !== "lesson-3" && l.id !== "lesson-4"),
          withId(fake, "lesson-3"),
          withId(rom, "lesson-4"),
        ],
      },
      {
        ...u1,
        lessons: [
          ...u1.lessons.filter((l) => l.id !== "lesson-5" && l.id !== "lesson-6"),
          withId(guar, "lesson-5"),
          withId(what, "lesson-6"),
          ...rest,
        ],
      },
    ],
  };
}

function mergeBibleMoney(c: Course): Course {
  const u0 = c.units[0];
  return {
    ...c,
    units: [{ ...u0, lessons: [...u0.lessons, ...BIBLE_MONEY_EXTRA] }],
  };
}

function mergePsychology(c: Course): Course {
  const [u0, u1] = c.units;
  const herd = pick(PSYCHOLOGY_EXTRA, "lesson-herd-mentality-fomo");
  const loss = pick(PSYCHOLOGY_EXTRA, "lesson-loss-aversion");
  const social = pick(PSYCHOLOGY_EXTRA, "lesson-social-media-money-pressure");
  const rest = PSYCHOLOGY_EXTRA.filter(
    (l) =>
      ![
        "lesson-herd-mentality-fomo",
        "lesson-loss-aversion",
        "lesson-social-media-money-pressure",
      ].includes(l.id)
  );
  return {
    ...c,
    units: [
      {
        ...u0,
        lessons: [
          ...u0.lessons.filter((l) => l.id !== "lesson-3" && l.id !== "lesson-4"),
          withId(herd, "lesson-3"),
          withId(loss, "lesson-4"),
          ...rest,
        ],
      },
      {
        ...u1,
        lessons: u1.lessons.map((l) =>
          l.id === "lesson-6" ? withId(social, "lesson-6") : l
        ),
      },
    ],
  };
}

function mergeRetirement(c: Course): Course {
  const u0 = c.units[0];
  return {
    ...c,
    units: [{ ...u0, lessons: [...u0.lessons, ...RETIREMENT_EXTRA] }],
  };
}

function mergeRandEconomy(c: Course): Course {
  const u0 = c.units[0];
  return {
    ...c,
    units: [{ ...u0, lessons: [...u0.lessons, ...RAND_ECONOMY_EXTRA] }],
  };
}

function mergeCrypto(c: Course): Course {
  const u0 = c.units[0];
  return {
    ...c,
    units: [{ ...u0, lessons: [...u0.lessons, ...CRYPTO_EXTRA] }],
  };
}

function mergeBusinessFinance(c: Course): Course {
  const u0 = c.units[0];
  return {
    ...c,
    units: [{ ...u0, lessons: [...u0.lessons, ...BUSINESS_FINANCE_EXTRA] }],
  };
}
