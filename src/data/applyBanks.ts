import type { Course } from "@/data/content";
import { LESSON_BANKS } from "@/data/banks";

/**
 * Swap in bank-backed lessons. For any lesson with a registered bank, attach
 * its `layout` + `slots` (the resolver in lib/lessonBank.ts will pick one
 * variant per slot at runtime). The original static `steps` are left in place
 * as a harmless fallback for any preview/count code that reads them directly.
 *
 * Runs LAST in the content pipeline so it overrides reinforcement/extras.
 */
export function applyBanks(courses: Course[]): Course[] {
  return courses.map((course) => ({
    ...course,
    units: course.units.map((unit) => ({
      ...unit,
      lessons: unit.lessons.map((lesson) => {
        const bank = LESSON_BANKS[`${course.id}::${lesson.id}`];
        if (!bank) return lesson;
        return { ...lesson, layout: bank.layout, slots: bank.slots };
      }),
    })),
  }));
}
