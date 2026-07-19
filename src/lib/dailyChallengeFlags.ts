import { sastToday } from "@/lib/dates";

export function markSharedToday(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`notho-shared-today-${sastToday()}`, "1");
}

export function markConceptReviewedToday(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`notho-concept-reviewed-${sastToday()}`, "1");
}

export function bumpCorrectAnswerStreakToday(): void {
  if (typeof window === "undefined") return;
  const key = `notho-correct-streak-today-${sastToday()}`;
  const n = parseInt(localStorage.getItem(key) ?? "0", 10);
  localStorage.setItem(key, String(n + 1));
}

export function resetCorrectAnswerStreakToday(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`notho-correct-streak-today-${sastToday()}`, "0");
}
