"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { analytics } from "@/lib/analytics";
import { trackBehaviorEvent } from "@/lib/behaviorTracking";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Award,
  BarChart2,
  Brain,
  Briefcase,
  Building2,
  Car,
  ChevronLeft,
  ChevronRight,
  Copy,
  CreditCard,
  FileText,
  Flag,
  Flame,
  GraduationCap,
  Hash,
  Heart,
  Home as HomeIcon,
  Landmark,
  Lightbulb,
  Lock,
  MoreHorizontal,
  PiggyBank,
  Plus,
  Shield,
  ShoppingCart,
  Smartphone,
  Target,
  Trash2,
  TrendingUp,
  Tv,
  Umbrella,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { formatRand } from "@/lib/viewHelpers";

// ─── Types ────────────────────────────────────────────────────────────────────

type BudgetEntry = {
  id: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  description?: string;
  entry_date: string;
};

type CustomBudgetCat = {
  id: string;
  name: string;
  color: string;
  icon_name: string;
  type: "expense" | "income";
};

// ─── Icon palette ─────────────────────────────────────────────────────────────

const ICON_PICKER_OPTIONS: { name: string; Icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }> }[] = [
  { name: "ShoppingCart",   Icon: ShoppingCart },
  { name: "Car",            Icon: Car },
  { name: "Home",           Icon: HomeIcon },
  { name: "CreditCard",     Icon: CreditCard },
  { name: "PiggyBank",      Icon: PiggyBank },
  { name: "Tv",             Icon: Tv },
  { name: "Smartphone",     Icon: Smartphone },
  { name: "Heart",          Icon: Heart },
  { name: "GraduationCap",  Icon: GraduationCap },
  { name: "Briefcase",      Icon: Briefcase },
  { name: "Building2",      Icon: Building2 },
  { name: "Wallet",         Icon: Wallet },
  { name: "Zap",            Icon: Zap },
  { name: "Target",         Icon: Target },
  { name: "TrendingUp",     Icon: TrendingUp },
  { name: "BarChart2",      Icon: BarChart2 },
  { name: "Flame",          Icon: Flame },
  { name: "Award",          Icon: Award },
  { name: "Flag",           Icon: Flag },
  { name: "Landmark",       Icon: Landmark },
  { name: "Lock",           Icon: Lock },
  { name: "Umbrella",       Icon: Umbrella },
  { name: "Shield",         Icon: Shield },
  { name: "Brain",          Icon: Brain },
  { name: "Hash",           Icon: Hash },
  { name: "MoreHorizontal", Icon: MoreHorizontal },
];

function getIconByName(name: string): React.ComponentType<{ size?: number; style?: React.CSSProperties }> {
  return ICON_PICKER_OPTIONS.find((o) => o.name === name)?.Icon ?? MoreHorizontal;
}

const CAT_COLOR_SWATCHES = [
  "#007A4D","#FFB612","#3B7DD8","#E03C31","#00BFA5",
  "#7C4DFF","#F57C00","#C2185B","#1976D2","#9E9E9E",
  "#00897B","#D81B60","#F4511E","#8E24AA","#43A047",
];

const BUDGET_EXPENSE_CATS = [
  { id: "food",          label: "Food & Groceries", color: "#007A4D", tag: "needs",   Icon: ShoppingCart },
  { id: "transport",     label: "Transport",         color: "#FFB612", tag: "needs",   Icon: Car },
  { id: "housing",       label: "Housing/Rent",      color: "#3B7DD8", tag: "needs",   Icon: HomeIcon },
  { id: "debt",          label: "Debt Repayments",   color: "#E03C31", tag: "debt",    Icon: CreditCard },
  { id: "savings",       label: "Savings",           color: "#00BFA5", tag: "savings", Icon: PiggyBank },
  { id: "entertainment", label: "Entertainment",     color: "#7C4DFF", tag: "wants",   Icon: Tv },
  { id: "airtime",       label: "Airtime & Data",    color: "#F57C00", tag: "needs",   Icon: Smartphone },
  { id: "healthcare",    label: "Healthcare",        color: "#C2185B", tag: "needs",   Icon: Heart },
  { id: "education",     label: "Education",         color: "#1976D2", tag: "needs",   Icon: GraduationCap },
  { id: "other",         label: "Other",             color: "#9E9E9E", tag: "other",   Icon: MoreHorizontal },
] as const;

const BUDGET_INCOME_CATS = [
  { id: "salary",       label: "Salary / Wages",   Icon: Briefcase },
  { id: "freelance",    label: "Freelance",         Icon: Zap },
  { id: "business",     label: "Business Income",  Icon: Building2 },
  { id: "other-income", label: "Other Income",     Icon: Wallet },
] as const;

// ─── BudgetView ───────────────────────────────────────────────────────────────

export function BudgetView() {
  const now = new Date();
  const [viewMode, setViewMode] = useState<"month" | "year">("month");
  const [monthOffset, setMonthOffset] = useState(0);
  const [entries, setEntries] = useState<BudgetEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addType, setAddType] = useState<"income" | "expense">("expense");
  const [addCategory, setAddCategory] = useState("");
  const [addAmount, setAddAmount] = useState("");
  const [addDesc, setAddDesc] = useState("");
  const [addDate, setAddDate] = useState(() => now.toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editEntry, setEditEntry] = useState<BudgetEntry | null>(null);
  const [editType, setEditType] = useState<"income" | "expense">("expense");
  const [editCategory, setEditCategory] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [yearEntries, setYearEntries] = useState<BudgetEntry[]>([]);
  const [budgetTargets, setBudgetTargets] = useState<Record<string, number>>({});
  const [showSetBudget, setShowSetBudget] = useState(false);
  const [budgetDraft, setBudgetDraft] = useState<Record<string, string>>({});
  const [budgetSaving, setBudgetSaving] = useState(false);
  const [customCats, setCustomCats] = useState<CustomBudgetCat[]>([]);
  const [showAddCustomCat, setShowAddCustomCat] = useState(false);
  const [newCatType, setNewCatType] = useState<"expense" | "income">("expense");
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState("#007A4D");
  const [newCatIcon, setNewCatIcon] = useState("MoreHorizontal");
  const [savingCustomCat, setSavingCustomCat] = useState(false);
  const [benchmarks, setBenchmarks] = useState<Record<string, number>>({});
  const [userGoalLabel, setUserGoalLabel] = useState<string | null>(null);

  // Read the user's onboarding goal from localStorage to show as header context
  useEffect(() => {
    if (typeof window === "undefined") return;
    const GOAL_LABELS: Record<string, string> = {
      "debt-free": "Get debt-free",
      emergency: "Build emergency fund",
      invest: "Start investing",
      home: "Save for a home",
      retire: "Plan for retirement",
      business: "Grow my business",
    };
    const goalId = localStorage.getItem("fundi-user-goal");
    const desc = localStorage.getItem("fundi-goal-description");
    if (goalId) {
      setUserGoalLabel(GOAL_LABELS[goalId] ?? desc ?? goalId);
    }
    const onStorage = (e: StorageEvent) => {
      if (e.key === "fundi-user-goal" && e.newValue) {
        setUserGoalLabel(GOAL_LABELS[e.newValue] ?? e.newValue);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const targetDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth();
  const monthLabel = targetDate.toLocaleString("en-ZA", { month: "long", year: "numeric" });
  const isCurrentMonth = monthOffset === 0;

  const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const loadEntries = React.useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from("budget_entries")
      .select("id, type, category, amount, description, entry_date")
      .eq("user_id", user.id)
      .gte("entry_date", startDate)
      .lte("entry_date", endDate)
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false });
    setEntries((data ?? []) as BudgetEntry[]);
    setLoading(false);
  }, [startDate, endDate]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isoDay = new Date().toISOString().slice(0, 10);
      localStorage.setItem(`fundi-budget-visited-${isoDay}`, "1");
      // Also sync to Supabase for cross-device daily challenge tracking
      supabase.auth.getUser().then(async ({ data: { user } }) => {
        if (!user) return;
        await supabase.from("user_progress").upsert(
          { user_id: user.id, budget_visited_date: isoDay } as any,
          { onConflict: "user_id" }
        );
      }).catch(() => {});
    }
  }, []);

  const monthYear = `${year}-${String(month + 1).padStart(2, "0")}`;

  const loadBudgetTargets = React.useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("budget_targets")
      .select("category, monthly_limit")
      .eq("user_id", user.id)
      .eq("month_year", monthYear);
    const map: Record<string, number> = {};
    (data ?? []).forEach((r: { category: string; monthly_limit: number }) => { map[r.category] = Number(r.monthly_limit); });
    setBudgetTargets(map);
  }, [monthYear]);

  useEffect(() => { loadBudgetTargets(); }, [loadBudgetTargets]);

  const loadCustomCats = React.useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("custom_budget_categories")
      .select("id, name, color, icon_name, type")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    setCustomCats((data ?? []) as CustomBudgetCat[]);
  }, []);

  useEffect(() => { loadCustomCats(); }, [loadCustomCats]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("budget_benchmarks").select("category, avg_pct, user_count");
      if (data) {
        const map: Record<string, number> = {};
        (data as { category: string; avg_pct: number }[]).forEach((r) => { map[r.category] = Number(r.avg_pct); });
        setBenchmarks(map);
      }
    })();
  }, []);

  const handleSaveCustomCat = async () => {
    if (!newCatName.trim()) return;
    setSavingCustomCat(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSavingCustomCat(false); return; }
    await supabase.from("custom_budget_categories").insert({
      user_id: user.id, name: newCatName.trim(), color: newCatColor, icon_name: newCatIcon, type: newCatType,
    });
    setSavingCustomCat(false);
    setShowAddCustomCat(false);
    setNewCatName(""); setNewCatColor("#007A4D"); setNewCatIcon("MoreHorizontal");
    loadCustomCats();
  };

  const handleDeleteCustomCat = async (id: string) => {
    await supabase.from("custom_budget_categories").delete().eq("id", id);
    setCustomCats((prev) => prev.filter((c) => c.id !== id));
  };

  const allExpCats = useMemo(() => {
    const statics = BUDGET_EXPENSE_CATS.filter(c => c.id !== "other");
    const custom = customCats.filter(c => c.type === "expense").map(c => ({
      id: c.id, label: c.name, color: c.color, tag: "custom" as const, Icon: getIconByName(c.icon_name),
    }));
    const other = BUDGET_EXPENSE_CATS.find(c => c.id === "other")!;
    return [...statics, ...custom, other];
  }, [customCats]);

  const allIncCats = useMemo(() => {
    const custom = customCats.filter(c => c.type === "income").map(c => ({
      id: c.id, label: c.name, Icon: getIconByName(c.icon_name),
    }));
    return [...BUDGET_INCOME_CATS, ...custom];
  }, [customCats]);

  const openSetBudget = () => {
    const draft: Record<string, string> = {};
    allExpCats.forEach((c) => { draft[c.id] = budgetTargets[c.id] ? String(budgetTargets[c.id]) : ""; });
    setBudgetDraft(draft);
    setShowSetBudget(true);
  };

  const handleSaveBudgetTargets = async () => {
    setBudgetSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setBudgetSaving(false); return; }
    for (const cat of allExpCats) {
      const val = Number(budgetDraft[cat.id]);
      if (val > 0) {
        await supabase.from("budget_targets").upsert(
          { user_id: user.id, category: cat.id, monthly_limit: val, month_year: monthYear },
          { onConflict: "user_id,category,month_year" }
        );
      } else {
        await supabase.from("budget_targets").delete()
          .eq("user_id", user.id).eq("category", cat.id).eq("month_year", monthYear);
      }
    }
    // Behavioral outcome: track if user set a savings target
    const savingsDraft = Number(budgetDraft["savings"] ?? 0);
    if (savingsDraft > 0) {
      analytics.savingsGoalSet(savingsDraft);
      void trackBehaviorEvent("savings_goal_set");
    }
    setBudgetSaving(false);
    setShowSetBudget(false);
    loadBudgetTargets();
  };

  const loadYearEntries = React.useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const yr = now.getFullYear();
    const { data } = await supabase
      .from("budget_entries")
      .select("id, type, category, amount, description, entry_date")
      .eq("user_id", user.id)
      .gte("entry_date", `${yr}-01-01`)
      .lte("entry_date", `${yr}-12-31`);
    setYearEntries((data ?? []) as BudgetEntry[]);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (viewMode === "year") loadYearEntries(); }, [viewMode, loadYearEntries]);

  const handleAdd = async () => {
    if (!addCategory || !addAmount || isNaN(Number(addAmount)) || Number(addAmount) <= 0) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    await supabase.from("budget_entries").insert({
      user_id: user.id, type: addType, category: addCategory,
      amount: Number(addAmount), description: addDesc.trim() || null, entry_date: addDate,
    });
    if (addType === "expense" && budgetTargets[addCategory]) {
      const catSpent = entries.filter(e => e.type === "expense" && e.category === addCategory).reduce((s, e) => s + e.amount, 0) + Number(addAmount);
      const limit = budgetTargets[addCategory];
      const pct = (catSpent / limit) * 100;
      if (pct >= 80) {
        const catLabel = BUDGET_EXPENSE_CATS.find(c => c.id === addCategory)?.label ?? addCategory;
        fetch(`${window.location.origin}/api/budget-alert`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user.id, category: catLabel, pct }),
        }).catch(() => {});
      }
    }
    analytics.budgetEntryAdded(addCategory, addType);
    // Behavioral outcome: track expense logged
    if (addType === "expense") {
      analytics.expenseLogged(addCategory, Number(addAmount));
      void trackBehaviorEvent("expense_logged");
    }
    if (addType === "expense" && typeof window !== "undefined") {
      const isoDay = new Date().toISOString().slice(0, 10);
      const expKey = `fundi-expense-today-${isoDay}`;
      const newExpenseCount = (parseInt(localStorage.getItem(expKey) ?? "0", 10)) + 1;
      localStorage.setItem(expKey, String(newExpenseCount));
      // Also sync to Supabase for cross-device daily challenge tracking
      supabase.auth.getUser().then(async ({ data: { user } }) => {
        if (!user) return;
        await supabase.from("user_progress").upsert(
          { user_id: user.id, expense_today: newExpenseCount, expense_today_date: isoDay } as any,
          { onConflict: "user_id" }
        );
      }).catch(() => {});
    }
    setSaving(false); setShowAdd(false); setAddCategory(""); setAddAmount(""); setAddDesc("");
    setAddDate(now.toISOString().slice(0, 10));
    loadEntries();
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await supabase.from("budget_entries").delete().eq("id", id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setDeleting(null);
  };

  const openEdit = (e: BudgetEntry) => {
    setEditEntry(e); setEditType(e.type); setEditCategory(e.category);
    setEditAmount(String(e.amount)); setEditDesc(e.description ?? ""); setEditDate(e.entry_date);
  };

  const handleEditSave = async () => {
    if (!editEntry || !editCategory || !editAmount || Number(editAmount) <= 0) return;
    setEditSaving(true);
    await supabase.from("budget_entries").update({
      type: editType, category: editCategory, amount: Number(editAmount),
      description: editDesc.trim() || null, entry_date: editDate,
    }).eq("id", editEntry.id);
    setEntries((prev) => prev.map((e) => e.id === editEntry.id
      ? { ...e, type: editType, category: editCategory, amount: Number(editAmount), description: editDesc.trim() || undefined, entry_date: editDate }
      : e));
    setEditSaving(false); setEditEntry(null);
  };

  const handleEditDelete = async () => {
    if (!editEntry) return;
    setEditSaving(true);
    await supabase.from("budget_entries").delete().eq("id", editEntry.id);
    setEntries((prev) => prev.filter((e) => e.id !== editEntry.id));
    setEditSaving(false); setEditEntry(null);
  };

  const income = entries.filter((e) => e.type === "income").reduce((s, e) => s + e.amount, 0);
  const expenses = entries.filter((e) => e.type === "expense").reduce((s, e) => s + e.amount, 0);
  const surplus = income - expenses;

  const catTotals = allExpCats.map((c) => ({
    ...c,
    total: entries.filter((e) => e.type === "expense" && e.category === c.id).reduce((s, e) => s + e.amount, 0),
  })).filter((c) => c.total > 0).sort((a, b) => b.total - a.total);

  const needsTotal = entries.filter((e) => e.type === "expense" && ["food","transport","housing","airtime","healthcare","education"].includes(e.category)).reduce((s, e) => s + e.amount, 0);
  const wantsTotal = entries.filter((e) => e.type === "expense" && e.category === "entertainment").reduce((s, e) => s + e.amount, 0);
  const debtTotal = entries.filter((e) => e.type === "expense" && e.category === "debt").reduce((s, e) => s + e.amount, 0);
  const savingsTotal = entries.filter((e) => e.type === "expense" && e.category === "savings").reduce((s, e) => s + e.amount, 0);
  const savingsRate = income > 0 ? Math.round((savingsTotal / income) * 100) : 0;
  const debtRate = income > 0 ? Math.round((debtTotal / income) * 100) : 0;

  const getCatLabel = (type: string, cat: string) => {
    if (type === "income") return allIncCats.find((c) => c.id === cat)?.label ?? cat;
    return allExpCats.find((c) => c.id === cat)?.label ?? cat;
  };
  const getCatColor = (cat: string) => allExpCats.find((c) => c.id === cat)?.color ?? "#9E9E9E";
  const formatEntry = (date: string) => {
    const d = new Date(date + "T00:00:00");
    return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
  };

  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const yearMonthData = monthNames.map((name, mi) => {
    const monthEntries = yearEntries.filter((e) => {
      const d = new Date(e.entry_date + "T00:00:00");
      return d.getMonth() === mi;
    });
    const inc = monthEntries.filter(e => e.type === "income").reduce((s, e) => s + e.amount, 0);
    const exp = monthEntries.filter(e => e.type === "expense").reduce((s, e) => s + e.amount, 0);
    return { name, income: inc, expenses: exp, surplus: inc - exp };
  });

  return (
    <main className="main-content main-with-stats budget-page">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: userGoalLabel ? 8 : 16 }}>
        <h2 style={{ fontSize: 28, fontWeight: 900 }}>Budget</h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", borderRadius: 10, border: "1px solid var(--color-border)", overflow: "hidden" }}>
            {(["month", "year"] as const).map((v) => (
              <button key={v} type="button" onClick={() => setViewMode(v)}
                style={{ padding: "7px 14px", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer", background: viewMode === v ? "var(--color-primary)" : "var(--color-surface)", color: viewMode === v ? "white" : "var(--color-text-secondary)" }}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
          <button type="button"
            onClick={() => { setAddType("expense"); setAddCategory(""); setAddAmount(""); setAddDesc(""); setAddDate(now.toISOString().slice(0, 10)); setShowAdd(true); }}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--color-primary)", color: "white", border: "none", borderRadius: 10, padding: "8px 14px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            <Plus size={16} aria-hidden /> Add
          </button>
        </div>
      </div>

      {/* Goal context banner */}
      {userGoalLabel && (
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          marginBottom: 16, padding: "6px 12px",
          background: "rgba(0,122,77,0.07)",
          borderRadius: 8, border: "1px solid rgba(0,122,77,0.2)",
        }}>
          <Target size={13} style={{ color: "var(--color-primary)", flexShrink: 0 }} aria-hidden />
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-primary)" }}>
            Your budget plan — {userGoalLabel}
          </span>
        </div>
      )}

      {/* YEAR VIEW */}
      {viewMode === "year" && (
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 14 }}>{now.getFullYear()} Overview</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, marginBottom: 24 }}>
            {yearMonthData.map((m) => (
              <div key={m.name} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12, padding: 14 }}>
                <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 10, color: "var(--color-text-primary)" }}>{m.name}</div>
                {m.income === 0 && m.expenses === 0 ? (
                  <div style={{ fontSize: 11, color: "var(--color-text-secondary)", fontStyle: "italic" }}>No entries</div>
                ) : (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: "var(--color-text-secondary)" }}>Income</span>
                      <span style={{ fontWeight: 700, color: "#007A4D" }}>{formatRand(m.income)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                      <span style={{ color: "var(--color-text-secondary)" }}>Expenses</span>
                      <span style={{ fontWeight: 700, color: "#E03C31" }}>{formatRand(m.expenses)}</span>
                    </div>
                    <div style={{ height: 3, borderRadius: 2, background: "var(--color-border)", overflow: "hidden", marginBottom: 4 }}>
                      <div style={{ height: "100%", background: m.surplus >= 0 ? "#007A4D" : "#E03C31", width: `${m.income > 0 ? Math.min(100, (m.expenses / m.income) * 100) : 100}%` }} />
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: m.surplus >= 0 ? "#007A4D" : "#E03C31", textAlign: "right" }}>
                      {m.surplus >= 0 ? "+" : ""}{formatRand(m.surplus)}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          {(() => {
            const totInc = yearMonthData.reduce((s, m) => s + m.income, 0);
            const totExp = yearMonthData.reduce((s, m) => s + m.expenses, 0);
            const totSur = totInc - totExp;
            return (
              <>
                {yearMonthData.some(m => m.income > 0 || m.expenses > 0) && (
                  <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 14, padding: 16, marginBottom: 16 }}>
                    <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 14 }}>Income vs Expenses - {now.getFullYear()}</div>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={yearMonthData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: "var(--color-text-secondary)" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `R${(v/1000).toFixed(0)}k`} />
                        <Tooltip
                          formatter={((value: unknown, name: unknown) => [formatRand(Number(value)), name === "income" ? "Income" : name === "expenses" ? "Expenses" : "Surplus"]) as never}
                          contentStyle={{ borderRadius: 10, fontSize: 12, border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text-primary)" }}
                        />
                        <Legend iconType="circle" iconSize={8} formatter={(v: string) => v === "income" ? "Income" : v === "expenses" ? "Expenses" : "Surplus"} wrapperStyle={{ fontSize: 12 }} />
                        <Line type="monotone" dataKey="income" stroke="#007A4D" strokeWidth={2.5} dot={{ r: 3, fill: "#007A4D" }} activeDot={{ r: 5 }} />
                        <Line type="monotone" dataKey="expenses" stroke="#E03C31" strokeWidth={2.5} dot={{ r: 3, fill: "#E03C31" }} activeDot={{ r: 5 }} />
                        <Line type="monotone" dataKey="surplus" stroke="#FFB612" strokeWidth={2} dot={{ r: 2, fill: "#FFB612" }} strokeDasharray="4 3" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 14, padding: 16 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 12 }}>Year Totals</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    {[
                      { label: "Total Income", value: totInc, color: "#007A4D" },
                      { label: "Total Expenses", value: totExp, color: "#E03C31" },
                      { label: totSur >= 0 ? "Net Surplus" : "Net Deficit", value: Math.abs(totSur), color: totSur >= 0 ? "#007A4D" : "#E03C31" },
                    ].map((c) => (
                      <div key={c.label} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", marginBottom: 4 }}>{c.label}</div>
                        <div style={{ fontSize: 16, fontWeight: 900, color: c.color }}>{formatRand(c.value)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* MONTH VIEW */}
      {viewMode === "month" && (<>

      {/* Month selector */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12, padding: "10px 14px", marginBottom: 20 }}>
        <button type="button" onClick={() => setMonthOffset((o) => o - 1)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary)", padding: 4 }} aria-label="Previous month">
          <ChevronLeft size={20} />
        </button>
        <span style={{ fontWeight: 700, fontSize: 15 }}>{monthLabel}</span>
        <button type="button" onClick={() => setMonthOffset((o) => Math.min(o + 1, 0))} disabled={isCurrentMonth}
          style={{ background: "none", border: "none", cursor: isCurrentMonth ? "default" : "pointer", color: isCurrentMonth ? "var(--color-border)" : "var(--color-text-secondary)", padding: 4 }} aria-label="Next month">
          <ChevronRight size={20} />
        </button>
      </div>

      {Object.keys(budgetTargets).length > 0 && (
        <button type="button" onClick={() => {
          if (window.confirm("Apply this month's budget to all 12 months?")) {
            const months = ["01","02","03","04","05","06","07","08","09","10","11","12"];
            const y = year;
            (async () => {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;
              for (const m of months) {
                const targetMonthYear = `${y}-${m}`;
                for (const [cat, limit] of Object.entries(budgetTargets)) {
                  await supabase.from("budget_targets").upsert(
                    { user_id: user.id, category: cat, monthly_limit: limit, month_year: targetMonthYear },
                    { onConflict: "user_id,category,month_year" }
                  );
                }
              }
              loadBudgetTargets();
            })();
          }
        }}
          style={{ width: "100%", marginBottom: 12, padding: "10px", borderRadius: 10, border: "1.5px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text-secondary)", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <Copy size={14} /> Apply this budget to all months
        </button>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--color-text-secondary)" }}>Loading...</div>
      ) : (
        <>
          {/* Summary cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
            {[
              { label: "Income", value: income, color: "#007A4D" },
              { label: "Expenses", value: expenses, color: "#E03C31" },
              { label: surplus >= 0 ? "Surplus" : "Deficit", value: Math.abs(surplus), color: surplus >= 0 ? "#007A4D" : "#E03C31" },
            ].map((c) => (
              <div key={c.label} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12, padding: "12px 10px", textAlign: "center" }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{c.label}</div>
                <div style={{ fontSize: 15, fontWeight: 900, color: c.color, lineHeight: 1.2 }}>{formatRand(c.value)}</div>
              </div>
            ))}
          </div>

          {entries.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--color-text-secondary)" }}>
              <Wallet size={48} strokeWidth={1.2} style={{ color: "var(--color-border)", margin: "0 auto 12px" }} />
              <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: "var(--color-text-primary)" }}>No entries yet</p>
              <p style={{ fontSize: 14, marginBottom: 20 }}>Start by adding your income and expenses for {monthLabel}.</p>
              <button type="button" onClick={() => { setAddType("income"); setShowAdd(true); }} className="btn btn-primary" style={{ padding: "12px 28px" }}>
                Add your first entry
              </button>
            </div>
          ) : (
            <>
              {income > 0 && (
                <div style={{ background: "linear-gradient(135deg,rgba(0,122,77,0.07) 0%,rgba(255,182,18,0.05) 100%)", border: "1px solid rgba(0,122,77,0.2)", borderRadius: 14, padding: 16, marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: 14, marginBottom: 12 }}>
                    <Lightbulb size={16} style={{ color: "var(--color-primary)" }} /> Fundi Insights
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "var(--color-text-secondary)" }}>Savings rate</span>
                      <span style={{ fontWeight: 700, color: savingsRate >= 10 ? "#007A4D" : "#E03C31" }}>{savingsRate}% {savingsRate >= 10 ? "On track" : "aim for 10%+"}</span>
                    </div>
                    {debtTotal > 0 && (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13 }}>
                        <span style={{ color: "var(--color-text-secondary)" }}>Debt repayments</span>
                        <span style={{ fontWeight: 700, color: debtRate > 40 ? "#E03C31" : debtRate > 20 ? "#FFB612" : "var(--color-text-primary)" }}>{debtRate}% of income</span>
                      </div>
                    )}
                    {needsTotal + wantsTotal > 0 && (
                      <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>
                        Needs: {formatRand(needsTotal)} · Wants: {formatRand(wantsTotal)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {Object.keys(budgetTargets).length > 0 && catTotals.length > 0 && (() => {
                const totalBudget = Object.values(budgetTargets).reduce((s, v) => s + v, 0);
                const totalActual = BUDGET_EXPENSE_CATS.reduce((s, c) => s + (budgetTargets[c.id] ? entries.filter(e => e.type === "expense" && e.category === c.id).reduce((a, e) => a + e.amount, 0) : 0), 0);
                const delta = totalBudget - totalActual;
                const isOver = delta < 0;
                return (
                  <div style={{ background: isOver ? "rgba(224,60,49,0.08)" : "rgba(0,122,77,0.08)", border: `1px solid ${isOver ? "rgba(224,60,49,0.3)" : "rgba(0,122,77,0.3)"}`, borderRadius: 14, padding: 16, marginBottom: 20, display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: isOver ? "rgba(224,60,49,0.15)" : "rgba(0,122,77,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Target size={22} style={{ color: isOver ? "#E03C31" : "#007A4D" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 15, color: isOver ? "#E03C31" : "#007A4D" }}>{isOver ? "Over Budget" : "Under Budget"}</div>
                      <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 2 }}>
                        {isOver ? `${formatRand(Math.abs(delta))} over` : `${formatRand(delta)} remaining`} of {formatRand(totalBudget)} budgeted
                      </div>
                    </div>
                  </div>
                );
              })()}

              {catTotals.length > 0 && (
                <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 14, padding: 16, marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>Expense breakdown</div>
                    <button type="button" onClick={openSetBudget} style={{ background: "rgba(0,122,77,0.1)", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#007A4D", display: "flex", alignItems: "center", gap: 4 }}>
                      <Target size={13} /> Set Budget
                    </button>
                  </div>
                  <div style={{ position: "relative", width: "100%", maxWidth: 260, margin: "0 auto 20px" }}>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={catTotals.map((c) => ({ name: c.label, value: c.total, color: c.color }))}
                          cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value" stroke="none">
                          {catTotals.map((c, i) => (<Cell key={`cell-${i}`} fill={c.color} style={{ cursor: "pointer", outline: "none" }} />))}
                        </Pie>
                        <Tooltip
                          formatter={(value: any) => formatRand(Number(value))}
                          contentStyle={{ borderRadius: 10, fontSize: 13, fontWeight: 600, border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text-primary)" }}
                          itemStyle={{ color: "var(--color-text-primary)" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none" }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 2 }}>Total</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: "var(--color-text-primary)" }}>{formatRand(expenses)}</div>
                    </div>
                  </div>

                  {catTotals.map((c) => {
                    const pct = expenses > 0 ? (c.total / expenses) * 100 : 0;
                    const limit = budgetTargets[c.id];
                    const usagePct = limit ? (c.total / limit) * 100 : 0;
                    const isAmber = limit && usagePct >= 80 && usagePct < 100;
                    const isOver = limit && usagePct >= 100;
                    return (
                      <div key={c.id} style={{ marginBottom: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 13 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 10, height: 10, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
                            <span style={{ fontWeight: 600 }}>{c.label}</span>
                            {isOver && <span style={{ fontSize: 10, fontWeight: 800, background: "rgba(224,60,49,0.15)", color: "#E03C31", borderRadius: 4, padding: "1px 5px" }}>OVER</span>}
                            {isAmber && !isOver && <span style={{ fontSize: 10, fontWeight: 800, background: "rgba(255,152,0,0.15)", color: "#F57C00", borderRadius: 4, padding: "1px 5px" }}>80%+</span>}
                          </div>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <span style={{ fontSize: 11, fontWeight: 700, background: "var(--color-bg)", borderRadius: 6, padding: "2px 6px", color: "var(--color-text-secondary)" }}>{pct.toFixed(1)}%</span>
                            <span style={{ fontWeight: 800, color: isOver ? "#E03C31" : "var(--color-text-primary)" }}>{formatRand(c.total)}</span>
                          </div>
                        </div>
                        {limit ? (
                          <div>
                            <div style={{ height: 10, borderRadius: 5, background: "var(--color-border)", overflow: "hidden" }}>
                              <div style={{ height: "100%", borderRadius: 5, background: isOver ? "#E03C31" : isAmber ? "#F57C00" : c.color, width: `${Math.min(100, usagePct)}%`, transition: "width 0.4s ease" }} />
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3, fontSize: 11, color: "var(--color-text-secondary)" }}>
                              <span>{formatRand(c.total)} of {formatRand(limit)}</span>
                              <span style={{ color: isOver ? "#E03C31" : isAmber ? "#F57C00" : "#007A4D", fontWeight: 700 }}>
                                {isOver ? `${formatRand(c.total - limit)} over` : `${formatRand(limit - c.total)} left`}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div style={{ height: 8, borderRadius: 4, background: "var(--color-border)", overflow: "hidden" }}>
                            <div style={{ height: "100%", borderRadius: 4, background: c.color, width: `${Math.min(100, pct)}%`, transition: "width 0.4s ease" }} />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--color-border)", display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {catTotals.map((c) => (
                      <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--color-text-secondary)" }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.color }} />
                        <span>{c.label}: {expenses > 0 ? ((c.total / expenses) * 100).toFixed(0) : 0}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {income > 0 && Object.keys(benchmarks).length > 0 && (
                <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 14, padding: 16, marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <BarChart2 size={15} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
                    <div style={{ fontWeight: 800, fontSize: 14 }}>How you compare</div>
                    <span style={{ fontSize: 10, fontWeight: 600, color: "var(--color-text-secondary)", marginLeft: "auto", background: "rgba(0,122,77,0.08)", padding: "2px 8px", borderRadius: 20 }}>Community avg</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {catTotals.filter((c) => benchmarks[c.id] !== undefined).slice(0, 5).map((c) => {
                      const userPct = income > 0 ? Math.round((c.total / income) * 100) : 0;
                      const avgPct = benchmarks[c.id];
                      const diff = userPct - avgPct;
                      const isOver = diff > 2;
                      const isUnder = diff < -2;
                      return (
                        <div key={c.id}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
                              <span style={{ fontSize: 12, fontWeight: 600 }}>{c.label}</span>
                            </div>
                            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                              <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>avg {avgPct}%</span>
                              <span style={{ fontSize: 13, fontWeight: 800, color: isOver ? "#E03C31" : isUnder ? "#007A4D" : "var(--color-text-primary)" }}>
                                you {userPct}%{isOver ? " ▲" : isUnder ? " ▼" : ""}
                              </span>
                            </div>
                          </div>
                          <div style={{ height: 6, borderRadius: 3, background: "var(--color-border)", overflow: "visible", position: "relative" }}>
                            <div style={{ position: "absolute", top: -2, left: `${Math.min(avgPct, 95)}%`, width: 2, height: 10, background: "rgba(255,255,255,0.4)", borderRadius: 1, zIndex: 2 }} />
                            <div style={{ height: "100%", borderRadius: 3, background: isOver ? "#E03C31" : isUnder ? "#007A4D" : c.color, width: `${Math.min(100, userPct)}%`, transition: "width 0.5s ease" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--color-text-secondary)", marginTop: 12, textAlign: "center" }}>Anonymized community data, updated daily</div>
                </div>
              )}

              <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 14, overflow: "hidden", marginBottom: 24 }}>
                <div style={{ fontWeight: 800, fontSize: 14, padding: "14px 16px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Transactions</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)" }}>Tap to edit</span>
                </div>
                {entries.map((e) => (
                  <button key={e.id} type="button" onClick={() => openEdit(e)}
                    style={{ display: "flex", alignItems: "center", padding: "12px 16px", borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: "1px solid var(--color-border)", gap: 12, width: "100%", background: "none", cursor: "pointer", textAlign: "left" }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: e.type === "income" ? "rgba(0,122,77,0.12)" : `${getCatColor(e.category)}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {e.type === "income" ? <TrendingUp size={16} style={{ color: "#007A4D" }} /> : <div style={{ width: 8, height: 8, borderRadius: "50%", background: getCatColor(e.category) }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "var(--color-text-primary)" }}>{getCatLabel(e.type, e.category)}</div>
                      <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 1 }}>
                        {formatEntry(e.entry_date)}{e.description ? ` · ${e.description}` : ""}
                      </div>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: e.type === "income" ? "#007A4D" : "var(--color-text-primary)", flexShrink: 0 }}>
                      {e.type === "income" ? "+" : "-"}{formatRand(e.amount)}
                    </div>
                    <ChevronRight size={14} style={{ color: "var(--color-text-secondary)", flexShrink: 0 }} />
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}
      </>)}

      {/* Set Budget Targets Modal */}
      {showSetBudget && (
        <div className="fixed inset-0 z-[400] flex items-end justify-center bg-black/60" role="dialog" aria-modal="true">
          <div style={{ background: "var(--color-surface)", borderRadius: "20px 20px 0 0", padding: "24px 20px 36px", width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ fontWeight: 900, fontSize: 18 }}>Set Monthly Budget</h3>
              <button type="button" onClick={() => setShowSetBudget(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                <X size={20} style={{ color: "var(--color-text-secondary)" }} />
              </button>
            </div>
            <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 16 }}>Set a spending limit for each category in {monthLabel}. Leave blank for no limit.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
              {allExpCats.map((c) => (
                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
                  <span style={{ fontWeight: 600, fontSize: 13, flex: 1, minWidth: 0 }}>{c.label}</span>
                  <div style={{ position: "relative", width: 120 }}>
                    <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, fontWeight: 700, color: "var(--color-text-secondary)" }}>R</span>
                    <input type="number" inputMode="decimal" placeholder="0" value={budgetDraft[c.id] ?? ""}
                      onChange={(e) => setBudgetDraft((prev) => ({ ...prev, [c.id]: e.target.value }))}
                      style={{ width: "100%", padding: "10px 10px 10px 26px", borderRadius: 10, border: "1px solid var(--color-border)", background: "var(--color-bg)", fontSize: 14, fontWeight: 700, color: "var(--color-text-primary)" }} />
                  </div>
                </div>
              ))}
            </div>
            <button type="button" className="btn btn-primary" style={{ width: "100%", padding: 14, fontSize: 15 }} disabled={budgetSaving} onClick={handleSaveBudgetTargets}>
              {budgetSaving ? "Saving..." : "Save Budget Targets"}
            </button>
          </div>
        </div>
      )}

      {/* Edit Entry Modal */}
      {editEntry && (
        <div className="fixed inset-0 z-[400] flex items-end justify-center bg-black/60" role="dialog" aria-modal="true">
          <div style={{ background: "var(--color-surface)", borderRadius: "20px 20px 0 0", padding: "24px 20px 36px", width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ fontWeight: 900, fontSize: 18 }}>Edit Entry</h3>
              <button type="button" onClick={() => setEditEntry(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary)" }}><X size={20} /></button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
              {(["expense", "income"] as const).map((t) => (
                <button key={t} type="button" onClick={() => { setEditType(t); setEditCategory(""); }}
                  style={{ padding: "10px", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer", border: `2px solid ${editType === t ? "var(--color-primary)" : "var(--color-border)"}`, background: editType === t ? "rgba(0,122,77,0.1)" : "var(--color-bg)", color: "var(--color-text-primary)", textTransform: "capitalize" }}>
                  {t === "income" ? "Income +" : "Expense -"}
                </button>
              ))}
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 8 }}>Category</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {(editType === "expense" ? allExpCats : allIncCats).map((c) => (
                  <button key={c.id} type="button" onClick={() => setEditCategory(c.id)}
                    style={{ padding: "10px 12px", borderRadius: 10, cursor: "pointer", border: `2px solid ${editCategory === c.id ? "var(--color-primary)" : "var(--color-border)"}`, background: editCategory === c.id ? "rgba(0,122,77,0.08)" : "var(--color-bg)", display: "flex", alignItems: "center", gap: 8, fontWeight: 600, fontSize: 13, color: "var(--color-text-primary)" }}>
                    <c.Icon size={14} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
                    <span>{c.label}</span>
                  </button>
                ))}
                {editType === "expense" && (
                  <button type="button" onClick={() => { setNewCatType("expense"); setShowAddCustomCat(true); }}
                    style={{ padding: "10px 12px", borderRadius: 10, cursor: "pointer", border: "2px dashed var(--color-border)", background: "transparent", display: "flex", alignItems: "center", gap: 8, fontWeight: 600, fontSize: 13, color: "var(--color-text-secondary)" }}>
                    <Plus size={14} style={{ flexShrink: 0 }} /> <span>Add category</span>
                  </button>
                )}
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 6 }}>Amount (R)</div>
              <input type="number" inputMode="decimal" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} min="0.01" step="0.01"
                style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid var(--color-border)", fontSize: 16, fontWeight: 700, background: "var(--color-bg)", color: "var(--color-text-primary)", boxSizing: "border-box" as const }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 6 }}>Description</div>
              <input type="text" value={editDesc} onChange={(e) => setEditDesc(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--color-border)", fontSize: 14, background: "var(--color-bg)", color: "var(--color-text-primary)", boxSizing: "border-box" as const }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 6 }}>Date</div>
              <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--color-border)", fontSize: 14, background: "var(--color-bg)", color: "var(--color-text-primary)", boxSizing: "border-box" as const }} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={handleEditDelete} disabled={editSaving}
                style={{ padding: "13px 16px", borderRadius: 12, border: "1.5px solid #E03C31", background: "transparent", color: "#E03C31", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <Trash2 size={15} /> Delete
              </button>
              <button type="button" className="btn btn-primary" style={{ flex: 1, padding: 14, fontSize: 15 }} disabled={editSaving || !editCategory || !editAmount || Number(editAmount) <= 0} onClick={handleEditSave}>
                {editSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Entry Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-[400] flex items-end justify-center bg-black/60" role="dialog" aria-modal="true">
          <div style={{ background: "var(--color-surface)", borderRadius: "20px 20px 0 0", padding: "24px 20px 36px", width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ fontWeight: 900, fontSize: 18 }}>Add Entry</h3>
              <button type="button" onClick={() => setShowAdd(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary)" }}><X size={20} /></button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
              {(["expense", "income"] as const).map((t) => (
                <button key={t} type="button" onClick={() => { setAddType(t); setAddCategory(""); }}
                  style={{ padding: "10px", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer", border: `2px solid ${addType === t ? "var(--color-primary)" : "var(--color-border)"}`, background: addType === t ? "rgba(0,122,77,0.1)" : "var(--color-bg)", color: "var(--color-text-primary)", textTransform: "capitalize" }}>
                  {t === "income" ? "Income +" : "Expense -"}
                </button>
              ))}
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 8 }}>Category</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {(addType === "expense" ? allExpCats : allIncCats).map((c) => (
                  <button key={c.id} type="button" onClick={() => setAddCategory(c.id)}
                    style={{ padding: "10px 12px", borderRadius: 10, cursor: "pointer", border: `2px solid ${addCategory === c.id ? "var(--color-primary)" : "var(--color-border)"}`, background: addCategory === c.id ? "rgba(0,122,77,0.08)" : "var(--color-bg)", display: "flex", alignItems: "center", gap: 8, fontWeight: 600, fontSize: 13, color: "var(--color-text-primary)", textAlign: "left" }}>
                    <c.Icon size={14} style={{ color: "var(--color-primary)", flexShrink: 0 }} aria-hidden />
                    <span>{c.label}</span>
                  </button>
                ))}
                <button type="button" onClick={() => { setNewCatType(addType); setShowAddCustomCat(true); }}
                  style={{ padding: "10px 12px", borderRadius: 10, cursor: "pointer", border: "2px dashed var(--color-border)", background: "transparent", display: "flex", alignItems: "center", gap: 8, fontWeight: 600, fontSize: 13, color: "var(--color-text-secondary)", textAlign: "left" }}>
                  <Plus size={14} style={{ flexShrink: 0 }} aria-hidden /> <span>Add category</span>
                </button>
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 6 }}>Amount (R)</div>
              <input type="number" inputMode="decimal" placeholder="0.00" value={addAmount} onChange={(e) => setAddAmount(e.target.value)} min="0.01" step="0.01"
                style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid var(--color-border)", fontSize: 16, fontWeight: 700, background: "var(--color-bg)", color: "var(--color-text-primary)", boxSizing: "border-box" as const }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 6 }}>Description (optional)</div>
              <input type="text" placeholder="e.g. Woolworths, Uber" value={addDesc} onChange={(e) => setAddDesc(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--color-border)", fontSize: 14, background: "var(--color-bg)", color: "var(--color-text-primary)", boxSizing: "border-box" as const }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 6 }}>Date</div>
              <input type="date" value={addDate} onChange={(e) => setAddDate(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--color-border)", fontSize: 14, background: "var(--color-bg)", color: "var(--color-text-primary)", boxSizing: "border-box" as const }} />
            </div>
            <button type="button" className="btn btn-primary" style={{ width: "100%", padding: 14, fontSize: 16 }}
              disabled={saving || !addCategory || !addAmount || Number(addAmount) <= 0} onClick={handleAdd}>
              {saving ? "Saving..." : "Save Entry"}
            </button>
          </div>
        </div>
      )}

      {/* Add Custom Category Modal */}
      {showAddCustomCat && (
        <div className="fixed inset-0 z-[500] flex items-end justify-center bg-black/70" role="dialog" aria-modal="true">
          <div style={{ background: "var(--color-surface)", borderRadius: "20px 20px 0 0", padding: "24px 20px 40px", width: "100%", maxWidth: 500, maxHeight: "92vh", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ fontWeight: 900, fontSize: 18 }}>New Category</h3>
              <button type="button" onClick={() => setShowAddCustomCat(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary)" }}><X size={20} /></button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
              {(["expense", "income"] as const).map((t) => (
                <button key={t} type="button" onClick={() => setNewCatType(t)}
                  style={{ padding: 10, borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer", border: `2px solid ${newCatType === t ? "var(--color-primary)" : "var(--color-border)"}`, background: newCatType === t ? "rgba(0,122,77,0.1)" : "var(--color-bg)", color: "var(--color-text-primary)", textTransform: "capitalize" }}>
                  {t === "income" ? "Income" : "Expense"}
                </button>
              ))}
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 6 }}>Category Name</div>
              <input type="text" placeholder="e.g. Gym, Pets, Clothing" value={newCatName} onChange={(e) => setNewCatName(e.target.value)}
                style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid var(--color-border)", fontSize: 15, fontWeight: 700, background: "var(--color-bg)", color: "var(--color-text-primary)", boxSizing: "border-box" as const }} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 8 }}>Colour</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {CAT_COLOR_SWATCHES.map((col) => (
                  <button key={col} type="button" onClick={() => setNewCatColor(col)}
                    style={{ width: 30, height: 30, borderRadius: "50%", background: col, border: `3px solid ${newCatColor === col ? "white" : "transparent"}`, outline: newCatColor === col ? `2px solid ${col}` : "none", cursor: "pointer", flexShrink: 0 }}
                    aria-label={col} />
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 8 }}>Icon</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
                {ICON_PICKER_OPTIONS.map((opt) => (
                  <button key={opt.name} type="button" onClick={() => setNewCatIcon(opt.name)}
                    style={{ padding: 10, borderRadius: 10, cursor: "pointer", border: `2px solid ${newCatIcon === opt.name ? newCatColor : "var(--color-border)"}`, background: newCatIcon === opt.name ? `${newCatColor}18` : "var(--color-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}
                    aria-label={opt.name}>
                    <opt.Icon size={18} style={{ color: newCatIcon === opt.name ? newCatColor : "var(--color-text-secondary)" }} />
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 20, padding: "12px 14px", borderRadius: 12, border: "1px solid var(--color-border)", background: "var(--color-bg)", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${newCatColor}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {(() => { const Ic = getIconByName(newCatIcon); return <Ic size={18} style={{ color: newCatColor }} />; })()}
              </div>
              <span style={{ fontWeight: 700, fontSize: 14, color: "var(--color-text-primary)" }}>{newCatName.trim() || "Category name"}</span>
              <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "capitalize" }}>{newCatType}</span>
            </div>
            <button type="button" className="btn btn-primary" style={{ width: "100%", padding: 14, fontSize: 15 }} disabled={savingCustomCat || !newCatName.trim()} onClick={handleSaveCustomCat}>
              {savingCustomCat ? "Saving..." : "Create Category"}
            </button>
            {customCats.filter(c => c.type === newCatType).length > 0 && (
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--color-border)" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 10 }}>Your custom {newCatType} categories</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {customCats.filter(c => c.type === newCatType).map((c) => {
                    const CatIcon = getIconByName(c.icon_name);
                    return (
                      <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
                        <CatIcon size={16} style={{ color: c.color, flexShrink: 0 }} />
                        <span style={{ fontWeight: 600, fontSize: 13, flex: 1 }}>{c.name}</span>
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
                        <button type="button" onClick={() => handleDeleteCustomCat(c.id)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#E03C31", padding: 4, display: "flex", alignItems: "center" }} aria-label="Delete category">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export default BudgetView;
