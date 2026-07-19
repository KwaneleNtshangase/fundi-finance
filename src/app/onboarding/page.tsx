"use client";

import React from "react";
import { OnboardingView } from "@/components/views/OnboardingView";
import { supabase } from "@/lib/supabaseClient";
import { normalizeUsername, isUsernameAvailable, GOAL_COURSE_MAP } from "@/app/pageViews.types";
import { CONTENT_DATA, Lesson } from "@/data/content";
import { useNotho, NothoProvider } from "@/context/NothoContext";
import { useRouter } from "next/navigation";

function OnboardingContent() {
  const { setRoute, setCurrentLessonState } = useNotho();
  const router = useRouter();

  const handleOnboardingComplete = async (payload: { goal?: string; ageRange?: string; goalDescription?: string; username: string }) => {
    localStorage.setItem("notho-onboarded", "true");
    if (payload.goal) localStorage.setItem("notho-user-goal", payload.goal);
    if (payload.goalDescription) localStorage.setItem("notho-goal-description", payload.goalDescription);
    if (payload.ageRange) localStorage.setItem("notho-age-range", payload.ageRange);
    localStorage.setItem("notho-username", payload.username);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const username = normalizeUsername(payload.username);
      const available = await isUsernameAvailable(username, user.id);
      if (!available) return;
      const row: Record<string, unknown> = { user_id: user.id };
      if (payload.goal) row.goal = payload.goal;
      if (payload.goalDescription) row.goal_description = payload.goalDescription;
      if (payload.ageRange) row.age_range = payload.ageRange;
      row.username = username;
      if (row.goal ?? row.age_range ?? row.goal_description ?? row.username) {
        await supabase.from("profiles").upsert(row, { onConflict: "user_id" });
      }
      await supabase.from("user_progress").upsert({ user_id: user.id, display_name: username }, { onConflict: "user_id" });
    }
    
    // Fire welcome email (non-blocking) via the app's own route
    void (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (token) {
          await fetch("/api/welcome-email", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
        }
      } catch { /* non-blocking */ }
    })();
    
    // Auto-launch the first lesson of the user's goal course
    const firstCourseId = payload.goal ? (GOAL_COURSE_MAP[payload.goal]?.[0] ?? null) : null;
    if (firstCourseId) {
      const goalCourse = CONTENT_DATA.courses.find((c) => c.id === firstCourseId);
      const firstLesson = goalCourse?.units?.[0]?.lessons?.[0];
      if (firstLesson?.steps?.length) {
        setCurrentLessonState({
          courseId: firstCourseId,
          lessonId: firstLesson.id,
          stepIndex: 0,
          steps: firstLesson.steps,
          answers: {},
          correctCount: 0,
        });
        setRoute({ name: "lesson", courseId: firstCourseId, lessonId: firstLesson.id });
        return;
      }
    }
    
    setRoute({ name: "learn" });
  };

  return <OnboardingView onComplete={handleOnboardingComplete} />;
}

export default function OnboardingPage() {
  return (
    <NothoProvider>
      <OnboardingContent />
    </NothoProvider>
  );
}
