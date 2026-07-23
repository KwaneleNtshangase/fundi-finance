import { MONEY_BASICS_BANKS, type LessonBank } from "./money-basics";
import { SALARY_PAYSLIP_BANKS } from "./salary-payslip";
import { BANKING_DEBIT_BANKS } from "./banking-debit";
import { CREDIT_DEBT_BANKS } from "./credit-debt";
import { EMERGENCY_FUND_BANKS } from "./emergency-fund";
import { INSURANCE_BANKS } from "./insurance";
import { INVESTING_BASICS_BANKS } from "./investing-basics";
import { SA_INVESTING_BANKS } from "./sa-investing";
import { PROPERTY_BANKS } from "./property";
import { TAXES_BANKS } from "./taxes";
import { SCAMS_FRAUD_BANKS } from "./scams-fraud";
import { BIBLE_MONEY_BANKS } from "./bible-money";
import { MONEY_PSYCHOLOGY_BANKS } from "./money-psychology";
import { RETIREMENT_BANKS } from "./retirement";
import { RAND_ECONOMY_BANKS } from "./rand-economy";
import { CRYPTO_BASICS_BANKS } from "./crypto-basics";
import { BUSINESS_FINANCE_BANKS } from "./business-finance";
import { ADVANCED_TAX_BANKS } from "./advanced-tax";
import { ESTATE_PLANNING_BANKS } from "./estate-planning";
import { ADVANCED_INVESTING_BANKS } from "./advanced-investing";
import { BUSINESS_FINANCE_ADVANCED_BANKS } from "./business-finance-advanced";
import { RE5_BANKS } from "./re5-exam-prep";
import { MONEY_BASICS_EXTRA_BANKS } from "./money-basics-extra";

export type { LessonBank };

/**
 * Registry of bank-backed lessons, keyed by `${courseId}::${lessonId}`.
 * Add a course's bank module here as it's authored.
 */
export const LESSON_BANKS: Record<string, LessonBank> = {
  ...MONEY_BASICS_BANKS,
  ...SALARY_PAYSLIP_BANKS,
  ...BANKING_DEBIT_BANKS,
  ...CREDIT_DEBT_BANKS,
  ...EMERGENCY_FUND_BANKS,
  ...INSURANCE_BANKS,
  ...INVESTING_BASICS_BANKS,
  ...SA_INVESTING_BANKS,
  ...PROPERTY_BANKS,
  ...TAXES_BANKS,
  ...SCAMS_FRAUD_BANKS,
  ...BIBLE_MONEY_BANKS,
  ...MONEY_PSYCHOLOGY_BANKS,
  ...RETIREMENT_BANKS,
  ...RAND_ECONOMY_BANKS,
  ...CRYPTO_BASICS_BANKS,
  ...BUSINESS_FINANCE_BANKS,
  ...ADVANCED_TAX_BANKS,
  ...ESTATE_PLANNING_BANKS,
  ...ADVANCED_INVESTING_BANKS,
  ...BUSINESS_FINANCE_ADVANCED_BANKS,
  ...RE5_BANKS,
  ...MONEY_BASICS_EXTRA_BANKS,
};
