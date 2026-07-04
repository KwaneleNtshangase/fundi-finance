"use client";

import React, { use } from "react";
import { CourseView } from "@/components/views/CourseView";
import { useFundi } from "@/context/FundiContext";
import { CONTENT_DATA } from "@/data/content";

export default function CoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const { setRoute, isLessonCompleted, completedLessons } = useFundi();
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
        setRoute({ name: "lesson", courseId, lessonId });
      }}
    />
  );
}
