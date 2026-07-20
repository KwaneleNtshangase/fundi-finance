import { sastToday } from "@/lib/dates";

export function markSharedToday(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`fundi-shared-today-${sastToday()}`, "1");
}

export function markConceptReviewedToday(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`fundi-concept-reviewed-${sastToday()}`, "1");
}

export function bumpCorrectAnswerStreakToday(): void {
  if (typeof window === "undefined") return;
  const key = `fundi-correct-streak-today-${sastToday()}`;
  const n = parseInt(localStorage.getItem(key) ?? "0", 10);
  localStorage.setItem(key, String(n + 1));
}

export function resetCorrectAnswerStreakToday(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`fundi-correct-streak-today-${sastToday()}`, "0");
}
