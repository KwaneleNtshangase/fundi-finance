"use client";

import React, { use } from "react";
import { CourseView } from "@/components/views/CourseView";
import { useNotho } from "@/context/NothoContext";
import { CONTENT_DATA } from "@/data/content";

export default function CoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const { setRoute, isLessonCompleted, completedLessons, setCurrentLessonState } = useNotho();
  const course = CONTENT_DATA.courses.find(c => c.id === courseId);

  if (!course) {
    return <div className="p-4">Course not found.</div>;
  }

  return (
    <CourseView
      course={course}
      isLessonCompleted={isLessonCompleted}
      goBack={() => setRoute({ name: "learn" })}
      goToLesson={(lessonId) => {
        const lessonInfo = course.units.flatMap((u) => u.lessons).find((l) => l.id === lessonId);
        if (lessonInfo) {
          setCurrentLessonState({
            courseId,
            lessonId,
            stepIndex: 0,
            answers: {},
            correctCount: 0,
            steps: lessonInfo.steps || [],
          });
        }
        setRoute({ name: "lesson", courseId, lessonId });
      }}
    />
  );
}
