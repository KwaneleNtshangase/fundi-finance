import React from "react";
import { renderToFile } from "@react-pdf/renderer";
import { BudgetReportDocument } from "@/lib/budget/report/pdf";
import type { ReportModel } from "@/lib/budget/report/types";

const months = ["Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May","Jun"];
const monthYears = ["2025-06","2025-07","2025-08","2025-09","2025-10","2025-11","2025-12","2026-01","2026-02","2026-03","2026-04","2026-05","2026-06"];
const incomeSeq = [1000,3000,5000,30000,55000,18000,22000,15000,12000,40000,131000,80000,24000];
const expenseSeq = [800,2500,4000,20000,40000,17000,21000,13000,14000,38000,112000,68000,22000];

const expenseCategories = [
  { categoryId:"housing", categoryName:"Housing", color:"#E6B84C", budgetedCents:8000000, actualCents:12000000, varianceCents:4000000, variancePct:150, sharePct:32.0, overBudget:true },
  { categoryId:"food", categoryName:"Food & Groceries", color:"#2AA39A", budgetedCents:4000000, actualCents:6800000, varianceCents:2800000, variancePct:170, sharePct:18.2, overBudget:true },
  { categoryId:"transport", categoryName:"Transport", color:"#7C9CF5", budgetedCents:3000000, actualCents:2900000, varianceCents:-100000, variancePct:97, sharePct:7.8, overBudget:false },
  { categoryId:"debt", categoryName:"Debt", color:"#E0584E", budgetedCents:0, actualCents:5400000, varianceCents:5400000, variancePct:null, sharePct:14.4, overBudget:false },
  { categoryId:"insurance", categoryName:"Insurance", color:"#9AA7BD", budgetedCents:1500000, actualCents:1200000, varianceCents:-300000, variancePct:80, sharePct:3.2, overBudget:false },
  { categoryId:"entertainment", categoryName:"Entertainment", color:"#C9A14A", budgetedCents:500000, actualCents:900000, varianceCents:400000, variancePct:180, sharePct:2.4, overBudget:true },
];

const model: ReportModel = {
  periodStart:"2025-06-01",
  periodEnd:"2026-06-27",
  displayName:"Minenhle Ntshangase",
  generatedAt:new Date().toISOString(),
  totalIncomeCents:43647633,
  totalExpenseCents:37445943,
  netCents:6201690,
  savingsRatePct:2,
  totalBudgetedExpenseCents:16520000,
  budgetVarianceCents:20925943,
  budgetUsedPct:227,
  budgetIsEstimate:true,
  expenseCategories,
  incomeCategories:[
    { categoryId:"salary", categoryName:"Salary", actualCents:38000000, sharePct:87.1 },
    { categoryId:"freelance", categoryName:"Freelance", actualCents:4000000, sharePct:9.2 },
    { categoryId:"other-income", categoryName:"Other income", actualCents:1647633, sharePct:3.7 },
  ],
  monthlySpend: monthYears.map((my,i)=>({ monthYear:my, label:months[i], expenseCents:expenseSeq[i]*100, incomeCents:incomeSeq[i]*100 })),
  topMerchants:[
    { description:"checkers superspar sandton", totalCents:2300000 },
    { description:"engen garage rivonia", totalCents:1800000 },
    { description:"woolworths food", totalCents:1500000 },
    { description:"netflix subscription", totalCents:19900 },
    { description:"vodacom prepaid airtime", totalCents:50000 },
  ],
  largestTransactions:[
    { id:"1", description:"Bond repayment SA Home Loans", category:"housing", categoryName:"Housing", cents:8500000, date:"2026-04-01" },
    { id:"2", description:"Car instalment Wesbank", category:"debt", categoryName:"Debt", cents:4200000, date:"2026-04-02" },
    { id:"3", description:"School fees term 2", category:"education", categoryName:"Education", cents:2500000, date:"2026-04-03" },
    { id:"4", description:"Checkers Superspar", category:"food", categoryName:"Food & Groceries", cents:230000, date:"2026-04-05" },
    { id:"5", description:"Engen Garage", category:"transport", categoryName:"Transport", cents:180000, date:"2026-04-06" },
  ],
  topOverBudget:[expenseCategories[1], expenseCategories[0], expenseCategories[5]],
  topUnderBudget:[expenseCategories[2], expenseCategories[4]],
};

await renderToFile(<BudgetReportDocument model={model} logoDataUri={undefined} />, "/sessions/practical-funny-allen/mnt/outputs/test-report.pdf");
console.log("rendered");
