/* eslint-disable @next/next/no-html-link-for-pages */
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { CONTENT_DATA } from "@/data/content";

import type { Course, Lesson, LessonStep } from "@/data/content";

type UserData = {
  xp: number;
  level: number;
  streak: number;
  lastActiveDate: string | null;
  dailyXP: number;
  dailyGoal: number;
  completedLessons: Record<string, Record<string, boolean>>;
  badges: string[];
};

type Route =
  | { name: "learn" }
  | { name: "course"; courseId: string }
  | { name: "lesson"; courseId: string; lessonId: string }
  | { name: "profile" }
  | { name: "leaderboard" }
  | { name: "settings" };

const DEFAULT_USER_DATA: UserData = {
  xp: 0,
  level: 1,
  streak: 0,
  lastActiveDate: null,
  dailyXP: 0,
  dailyGoal: 50,
  completedLessons: {},
  badges: [],
};

function useFundiState() {
  const [userData, setUserData] = useState<UserData>(DEFAULT_USER_DATA);
  const [route, setRoute] = useState<Route>({ name: "learn" });
  const [currentLessonState, setCurrentLessonState] = useState<{
    courseId: string | null;
    lessonId: string | null;
    stepIndex: number;
    steps: LessonStep[];
    answers: Record<number, unknown>;
    correctCount: number;
  }>({
    courseId: null,
    lessonId: null,
    stepIndex: 0,
    steps: [],
    answers: {},
    correctCount: 0,
  });

  useEffect(() => {
    const saved = typeof window !== "undefined"
      ? window.localStorage.getItem("fundiUserData")
      : null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as UserData;
        setUserData(parsed);
      } catch {
        setUserData(DEFAULT_USER_DATA);
      }
    } else {
      setUserData(DEFAULT_USER_DATA);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("fundiUserData", JSON.stringify(userData));
  }, [userData]);

  const updateStreak = () => {
    const today = new Date().toDateString();
    const lastActive = userData.lastActiveDate;
    let streak = userData.streak;
    let dailyXP = userData.dailyXP;

    if (!lastActive) {
      streak = 0;
    } else if (lastActive !== today) {
      const lastDate = new Date(lastActive);
      const currentDate = new Date(today);
      const diffDays = Math.floor(
        (currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays === 1) {
        streak += 1;
      } else if (diffDays > 1) {
        streak = 0;
      }
      dailyXP = 0;
    }

    setUserData((prev) => ({
      ...prev,
      streak,
      dailyXP,
      lastActiveDate: today,
    }));
  };

  useEffect(() => {
    updateStreak();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addXP = (amount: number) => {
    setUserData((prev) => {
      const xp = prev.xp + amount;
      const dailyXP = prev.dailyXP + amount;
      const newLevel = Math.floor(xp / 500) + 1;
      return {
        ...prev,
        xp,
        dailyXP,
        level: newLevel > prev.level ? newLevel : prev.level,
      };
    });
  };

  const completeLesson = (courseId: string, lessonId: string, xpEarned: number) => {
    setUserData((prev) => {
      const completedLessons = { ...prev.completedLessons };
      if (!completedLessons[courseId]) {
        completedLessons[courseId] = {};
      }
      completedLessons[courseId][lessonId] = true;
      return {
        ...prev,
        completedLessons,
      };
    });
    addXP(xpEarned);
  };

  const isLessonCompleted = (courseId: string, lessonId: string) =>
    !!userData.completedLessons[courseId]?.[lessonId];

  const startLesson = (courseId: string, lessonId: string) => {
    const course = CONTENT_DATA.courses.find((c) => c.id === courseId);
    if (!course) return;
    let found: Lesson | undefined;
    for (const unit of course.units) {
      const lesson = unit.lessons.find((l) => l.id === lessonId);
      if (lesson) {
        found = lesson;
        break;
      }
    }
    if (!found || found.comingSoon || !found.steps) return;
    setCurrentLessonState({
      courseId,
      lessonId,
      stepIndex: 0,
      steps: found.steps,
      answers: {},
      correctCount: 0,
    });
    setRoute({ name: "lesson", courseId, lessonId });
  };

  const value = {
    userData,
    route,
    setRoute,
    isLessonCompleted,
    completeLesson,
    currentLessonState,
    setCurrentLessonState,
  };

  return value;
}

function LearnView({
  courses,
  isLessonCompleted,
  goToCourse,
}: {
  courses: Course[];
  isLessonCompleted: (courseId: string, lessonId: string) => boolean;
  goToCourse: (courseId: string) => void;
}) {
  return (
    <main className="main-content main-with-stats" id="mainContent">
      <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 32 }}>
        Your Learning Path
      </h2>
      <div className="courses-grid">
        {courses.map((course) => {
          const totalLessons = course.units.reduce(
            (sum, unit) => sum + unit.lessons.length,
            0
          );
          const completedLessons = course.units.reduce((sum, unit) => {
            return (
              sum +
              unit.lessons.filter((lesson) =>
                isLessonCompleted(course.id, lesson.id)
              ).length
            );
          }, 0);
          const percentage =
            totalLessons > 0
              ? Math.round((completedLessons / totalLessons) * 100)
              : 0;
          return (
            <div
              key={course.id}
              className="course-card"
              onClick={() => goToCourse(course.id)}
            >
              <div className="course-header">
                <div>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>
                    {course.icon}
                  </div>
                  <div className="course-title">{course.title}</div>
                  <div className="course-description">
                    {course.description}
                  </div>
                </div>
                <div className="course-progress">
                  <div className="course-percentage">{percentage}%</div>
                  <div className="course-percentage-label">Complete</div>
                </div>
              </div>
              <div className="course-stats">
                <div className="course-stat">
                  <strong>{completedLessons}</strong> / {totalLessons} lessons
                </div>
                <div className="course-stat">
                  <strong>{course.units.length}</strong> units
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}

function CourseView({
  course,
  isLessonCompleted,
  goBack,
  goToLesson,
}: {
  course: Course;
  isLessonCompleted: (courseId: string, lessonId: string) => boolean;
  goBack: () => void;
  goToLesson: (lessonId: string) => void;
}) {
  return (
    <main className="main-content main-with-stats">
      <div className="course-map">
        <button className="back-button" onClick={goBack}>
          ← Back to Courses
        </button>
        <div className="course-map-header">
          <div style={{ fontSize: 64, marginBottom: 16 }}>{course.icon}</div>
          <h2 className="course-map-title">{course.title}</h2>
          <p className="course-map-description">{course.description}</p>
        </div>
        {course.units.map((unit) => (
          <div className="unit" key={unit.id}>
            <div className="unit-header">
              <div className="unit-title">{unit.title}</div>
              <div className="unit-description">{unit.description}</div>
            </div>
            <div className="lessons-path">
              {unit.lessons.map((lesson) => {
                const completed = isLessonCompleted(course.id, lesson.id);
                const comingSoon = lesson.comingSoon;
                let nodeClass = "lesson-node";
                let icon = "📖";
                if (comingSoon) {
                  nodeClass += " coming-soon";
                  icon = "🔒";
                } else if (completed) {
                  nodeClass += " completed";
                  icon = "✓";
                }
                return (
                  <div key={lesson.id}>
                    <div
                      className={nodeClass}
                      onClick={() =>
                        !comingSoon ? goToLesson(lesson.id) : undefined
                      }
                    >
                      {icon}
                    </div>
                    <div className="lesson-label">{lesson.title}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

function LessonView({
  lessonState,
  completeLessonFlow,
  nextStep,
  answerQuestion,
  answerTrueFalse,
}: {
  lessonState: {
    steps: LessonStep[];
    stepIndex: number;
    answers: Record<number, unknown>;
  };
  completeLessonFlow: () => void;
  nextStep: () => void;
  answerQuestion: (index: number) => void;
  answerTrueFalse: (value: boolean) => void;
}) {
  const step = lessonState.steps[lessonState.stepIndex];
  const progress =
    ((lessonState.stepIndex + 1) / lessonState.steps.length) * 100;

  const answered = lessonState.answers[lessonState.stepIndex] !== undefined;

  const renderStep = () => {
    if (!step) return null;
    if (step.type === "info") {
      return (
        <>
          <h2 className="step-title">{step.title}</h2>
          <div
            className="step-content"
            dangerouslySetInnerHTML={{ __html: step.content }}
          />
          <div className="lesson-actions">
            <button className="btn btn-primary" onClick={nextStep}>
              Continue
            </button>
          </div>
        </>
      );
    }

    if (step.type === "mcq" || step.type === "scenario") {
      const selectedAnswer = lessonState.answers[lessonState.stepIndex] as
        | number
        | undefined;
      const isCorrect = selectedAnswer === step.correct;
      return (
        <>
          <h2 className="step-title">{step.question}</h2>
          {step.content ? (
            <div
              className="step-content"
              dangerouslySetInnerHTML={{ __html: step.content }}
            />
          ) : null}
          <div className="question-options">
            {step.options.map((option, index) => {
              let optionClass = "option-button";
              if (answered) {
                if (index === selectedAnswer) {
                  optionClass += isCorrect ? " correct" : " incorrect";
                }
                if (index === step.correct && selectedAnswer !== step.correct) {
                  optionClass += " correct";
                }
              }
              return (
                <button
                  key={option}
                  className={optionClass}
                  onClick={() => answerQuestion(index)}
                  disabled={answered}
                >
                  {option}
                </button>
              );
            })}
          </div>
          {answered && (
            <>
              <div
                className={`feedback ${isCorrect ? "correct" : "incorrect"}`}
              >
                {isCorrect ? step.feedback.correct : step.feedback.incorrect}
              </div>
              <div className="lesson-actions">
                <button className="btn btn-primary" onClick={nextStep}>
                  Continue
                </button>
              </div>
            </>
          )}
        </>
      );
    }

    if (step.type === "true-false") {
      const selectedAnswer = lessonState.answers[lessonState.stepIndex] as
        | boolean
        | undefined;
      const isCorrect = selectedAnswer === step.correct;
      return (
        <>
          <h2 className="step-title">True or False?</h2>
          <div className="step-content">
            <p>{step.statement}</p>
          </div>
          <div className="question-options">
            {[true, false].map((value) => {
              let optionClass = "option-button";
              if (answered) {
                if (value === selectedAnswer) {
                  optionClass += isCorrect ? " correct" : " incorrect";
                }
                if (value === step.correct && selectedAnswer !== step.correct) {
                  optionClass += " correct";
                }
              }
              return (
                <button
                  key={String(value)}
                  className={optionClass}
                  onClick={() => answerTrueFalse(value)}
                  disabled={answered}
                >
                  {value ? "True" : "False"}
                </button>
              );
            })}
          </div>
          {answered && (
            <>
              <div
                className={`feedback ${isCorrect ? "correct" : "incorrect"}`}
              >
                {isCorrect ? step.feedback.correct : step.feedback.incorrect}
              </div>
              <div className="lesson-actions">
                <button className="btn btn-primary" onClick={nextStep}>
                  Continue
                </button>
              </div>
            </>
          )}
        </>
      );
    }
    return null;
  };

  return (
    <main className="main-content main-with-stats">
      <div className="lesson-player">
        <div className="lesson-progress-bar">
          <div
            className="lesson-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="lesson-step">{renderStep()}</div>
      </div>
    </main>
  );
}

function ProfileView({ userData }: { userData: UserData }) {
  const totalCompleted = useMemo(
    () =>
      Object.values(userData.completedLessons).reduce(
        (sum, course) => sum + Object.keys(course).length,
        0
      ),
    [userData.completedLessons]
  );

  const allBadges = [
    { id: "first-lesson", name: "First Steps", icon: "🌱" },
    { id: "five-lessons", name: "Getting Started", icon: "🚀" },
    { id: "ten-lessons", name: "On a Roll", icon: "🔥" },
    { id: "twenty-lessons", name: "Committed", icon: "💪" },
    { id: "streak-7", name: "7 Day Streak", icon: "⚡" },
    { id: "streak-30", name: "30 Day Streak", icon: "🏆" },
    { id: "course-complete", name: "Course Master", icon: "🎓" },
    { id: "all-courses", name: "Finance Pro", icon: "👑" },
  ];

  return (
    <main className="main-content main-with-stats">
      <div className="profile-header">
        <div className="profile-avatar">👤</div>
        <h2
          style={{
            fontSize: 32,
            fontWeight: 800,
            marginBottom: 8,
          }}
        >
          Your Profile
        </h2>
        <p style={{ fontSize: 18, color: "var(--text-light)" }}>
          Keep learning every day!
        </p>
      </div>

      <div className="profile-stats">
        <div className="profile-stat-card">
          <div className="profile-stat-value">{userData.xp}</div>
          <div className="profile-stat-label">Total XP</div>
        </div>
        <div className="profile-stat-card">
          <div className="profile-stat-value">{userData.level}</div>
          <div className="profile-stat-label">Level</div>
        </div>
        <div className="profile-stat-card">
          <div className="profile-stat-value">{userData.streak}</div>
          <div className="profile-stat-label">Day Streak</div>
        </div>
        <div className="profile-stat-card">
          <div className="profile-stat-value">{totalCompleted}</div>
          <div className="profile-stat-label">Lessons Completed</div>
        </div>
      </div>

      <div className="badges-section">
        <h3
          style={{
            fontSize: 24,
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          Your Badges
        </h3>
        <p style={{ color: "var(--text-light)", marginBottom: 24 }}>
          Earn badges by completing lessons and maintaining streaks
        </p>
        <div className="badges-grid">
          {allBadges.map((badge) => {
            const earned = userData.badges.includes(badge.id);
            return (
              <div
                key={badge.id}
                className={`badge ${earned ? "earned" : "locked"}`}
              >
                <div className="badge-icon">{badge.icon}</div>
                <div className="badge-name">{badge.name}</div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

function LeaderboardView({ xp }: { xp: number }) {
  const leaders = useMemo(
    () =>
      [
        { name: "Thabo M.", xp: 5240 },
        { name: "Sarah K.", xp: 4890 },
        { name: "You", xp },
        { name: "John D.", xp: 3120 },
        { name: "Nomsa P.", xp: 2850 },
        { name: "Michael T.", xp: 2630 },
        { name: "Jessica R.", xp: 2410 },
        { name: "David L.", xp: 2180 },
      ].sort((a, b) => b.xp - a.xp),
    [xp]
  );

  return (
    <main className="main-content main-with-stats">
      <h2
        style={{
          fontSize: 32,
          fontWeight: 800,
          marginBottom: 32,
        }}
      >
        Leaderboard
      </h2>
      <div className="leaderboard-table">
        {leaders.map((leader, index) => {
          const isYou = leader.name === "You";
          const rankClass = index < 3 ? "top" : "";
          return (
            <div
              key={leader.name}
              className="leaderboard-row"
              style={
                isYou
                  ? { background: "rgba(88, 204, 2, 0.1)" }
                  : undefined
              }
            >
              <div className={`leaderboard-rank ${rankClass}`}>
                {index + 1}
              </div>
              <div className="leaderboard-avatar">
                {leader.name[0]}
              </div>
              <div className="leaderboard-info">
                <div className="leaderboard-name">
                  {leader.name}
                  {isYou ? " 🎯" : ""}
                </div>
              </div>
              <div className="leaderboard-xp">
                {leader.xp.toLocaleString()} XP
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}

function SettingsView({
  userData,
  setDailyGoal,
  resetProgress,
}: {
  userData: UserData;
  setDailyGoal: (goal: number) => void;
  resetProgress: () => void;
}) {
  const [value, setValue] = useState(userData.dailyGoal);
  return (
    <main className="main-content main-with-stats">
      <h2
        style={{
          fontSize: 32,
          fontWeight: 800,
          marginBottom: 32,
        }}
      >
        Settings
      </h2>
      <div className="settings-section">
        <h3>Daily Goal</h3>
        <div className="setting-item">
          <div className="setting-label">XP Goal per Day</div>
          <input
            type="number"
            className="setting-input"
            value={value}
            min={10}
            max={500}
            step={10}
            onChange={(e) => setValue(Number(e.target.value))}
          />
        </div>
        <button
          className="btn btn-primary"
          style={{ marginTop: 16 }}
          onClick={() => setDailyGoal(value)}
        >
          Save Goal
        </button>
      </div>
      <div className="settings-section">
        <h3>Data Management</h3>
        <p style={{ color: "var(--text-light)", marginBottom: 16 }}>
          Warning: This will delete all your progress!
        </p>
        <button
          className="btn btn-secondary"
          style={{
            background: "var(--error-red)",
            color: "white",
            border: "none",
          }}
          onClick={resetProgress}
        >
          Reset All Progress
        </button>
      </div>
    </main>
  );
}

function StatsPanel({ userData }: { userData: UserData }) {
  const goalProgress = Math.min(
    (userData.dailyXP / userData.dailyGoal) * 100,
    100
  );
  return (
    <aside className="stats-panel" id="statsPanel">
      <div className="stats-section">
        <h3>My Stats</h3>
        <div className="stat-item">
          <div className="stat-icon">🔥</div>
          <div className="stat-content">
            <div className="stat-label">Day Streak</div>
            <div className="stat-value" id="streakValue">
              {userData.streak}
            </div>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon">⚡</div>
          <div className="stat-content">
            <div className="stat-label">Total XP</div>
            <div className="stat-value" id="xpValue">
              {userData.xp.toLocaleString()}
            </div>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <div className="stat-label">Level</div>
            <div className="stat-value" id="levelValue">
              {userData.level}
            </div>
          </div>
        </div>
      </div>
      <div className="stats-section">
        <h3>Daily Goal</h3>
        <div className="daily-goal-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              id="dailyGoalFill"
              style={{ width: `${goalProgress}%` }}
            />
          </div>
          <div className="progress-text" id="dailyGoalText">
            {userData.dailyXP} / {userData.dailyGoal} XP
          </div>
        </div>
      </div>
    </aside>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [session, setSession] = useState<unknown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        setSession(data.session ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSignIn = async () => {
    setError(null);
    const { error: e } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (e) setError(e.message);
  };

  const handleSignUp = async () => {
    setError(null);
    const { error: e } = await supabase.auth.signUp({
      email,
      password,
    });
    if (e) setError(e.message);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-gray)]">
        <div
          style={{
            background: "white",
            padding: 32,
            borderRadius: 16,
            border: "2px solid var(--border-light)",
            maxWidth: 400,
            width: "100%",
          }}
        >
          <h1
            style={{
              fontSize: 24,
              fontWeight: 800,
              marginBottom: 16,
              textAlign: "center",
            }}
          >
            💰 Fundi Finance
          </h1>
          <p
            style={{
              textAlign: "center",
              marginBottom: 24,
              color: "var(--text-light)",
            }}
          >
            Sign in to save your learning progress
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                padding: 12,
                borderRadius: 8,
                border: "1px solid var(--border-light)",
                fontSize: 14,
              }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                padding: 12,
                borderRadius: 8,
                border: "1px solid var(--border-light)",
                fontSize: 14,
              }}
            />
            {error && (
              <p style={{ color: "var(--error-red)", fontSize: 13 }}>
                {error}
              </p>
            )}
            <button
              className="btn btn-primary"
              style={{ width: "100%" }}
              onClick={handleSignIn}
            >
              Sign In
            </button>
            <button
              className="btn btn-secondary"
              style={{ width: "100%" }}
              onClick={handleSignUp}
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        className="btn btn-secondary"
        style={{
          position: "fixed",
          top: 16,
          right: 344,
          zIndex: 200,
        }}
        onClick={handleSignOut}
      >
        Sign Out
      </button>
      {children}
    </>
  );
}

export default function Home() {
  const {
    userData,
    route,
    setRoute,
    isLessonCompleted,
    completeLesson,
    currentLessonState,
    setCurrentLessonState,
  } = useFundiState();

  const currentCourse =
    route.name === "course" || route.name === "lesson"
      ? CONTENT_DATA.courses.find((c) => c.id === route.courseId)
      : null;

  const handleNav = (name: Route["name"]) => {
    if (name === "learn") setRoute({ name: "learn" });
    if (name === "profile") setRoute({ name: "profile" });
    if (name === "leaderboard") setRoute({ name: "leaderboard" });
    if (name === "settings") setRoute({ name: "settings" });
  };

  const nextStep = () => {
    if (currentLessonState.stepIndex < currentLessonState.steps.length - 1) {
      setCurrentLessonState((prev) => ({
        ...prev,
        stepIndex: prev.stepIndex + 1,
      }));
    } else {
      const baseXP = 50;
      const totalXP =
        baseXP + currentLessonState.correctCount * 10;
      if (
        currentLessonState.courseId &&
        currentLessonState.lessonId
      ) {
        completeLesson(
          currentLessonState.courseId,
          currentLessonState.lessonId,
          totalXP
        );
      }
      setRoute({ name: "course", courseId: currentLessonState.courseId! });
    }
  };

  const answerQuestion = (index: number) => {
    const step = currentLessonState.steps[currentLessonState.stepIndex];
    if (step.type !== "mcq" && step.type !== "scenario") return;
    setCurrentLessonState((prev) => ({
      ...prev,
      answers: { ...prev.answers, [prev.stepIndex]: index },
      correctCount:
        index === step.correct ? prev.correctCount + 1 : prev.correctCount,
    }));
  };

  const answerTrueFalse = (value: boolean) => {
    const step = currentLessonState.steps[currentLessonState.stepIndex];
    if (step.type !== "true-false") return;
    setCurrentLessonState((prev) => ({
      ...prev,
      answers: { ...prev.answers, [prev.stepIndex]: value },
      correctCount:
        value === step.correct ? prev.correctCount + 1 : prev.correctCount,
    }));
  };

  const setDailyGoal = (goal: number) => {
    setRoute((prev) => ({ ...prev }));
    // quick state update
    (window as any).requestAnimationFrame?.(() => undefined);
  };

  const resetProgress = () => {
    if (typeof window !== "undefined" && window.confirm("Reset all progress?")) {
      window.localStorage.removeItem("fundiUserData");
      window.location.reload();
    }
  };

  return (
    <AuthGate>
      <div className="app-container">
        <nav className="sidebar">
          <div className="logo">
            <h1>💰 Fundi Finance</h1>
            <p>Master Your Money</p>
          </div>
          <ul className="nav-menu">
            <li className="nav-item">
              <button
                className={`nav-link ${
                  route.name === "learn" ? "active" : ""
                }`}
                onClick={() => handleNav("learn")}
              >
                <span className="nav-icon">📚</span>
                Learn
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${
                  route.name === "profile" ? "active" : ""
                }`}
                onClick={() => handleNav("profile")}
              >
                <span className="nav-icon">👤</span>
                Profile
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${
                  route.name === "leaderboard" ? "active" : ""
                }`}
                onClick={() => handleNav("leaderboard")}
              >
                <span className="nav-icon">🏆</span>
                Leaderboard
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${
                  route.name === "settings" ? "active" : ""
                }`}
                onClick={() => handleNav("settings")}
              >
                <span className="nav-icon">⚙️</span>
                Settings
              </button>
            </li>
          </ul>
        </nav>

        {route.name === "learn" && (
          <LearnView
            courses={CONTENT_DATA.courses}
            isLessonCompleted={isLessonCompleted}
            goToCourse={(courseId) => setRoute({ name: "course", courseId })}
          />
        )}

        {route.name === "course" && currentCourse && (
          <CourseView
            course={currentCourse}
            isLessonCompleted={isLessonCompleted}
            goBack={() => setRoute({ name: "learn" })}
            goToLesson={(lessonId) => {
              const courseId = currentCourse.id;
              const course = CONTENT_DATA.courses.find(
                (c) => c.id === courseId
              );
              if (!course) return;
              let found: Lesson | undefined;
              for (const unit of course.units) {
                const lesson = unit.lessons.find((l) => l.id === lessonId);
                if (lesson) {
                  found = lesson;
                  break;
                }
              }
              if (!found || found.comingSoon || !found.steps) return;
              setCurrentLessonState({
                courseId,
                lessonId,
                stepIndex: 0,
                steps: found.steps,
                answers: {},
                correctCount: 0,
              });
              setRoute({ name: "lesson", courseId, lessonId });
            }}
          />
        )}

        {route.name === "lesson" && currentLessonState.steps.length > 0 && (
          <LessonView
            lessonState={{
              steps: currentLessonState.steps,
              stepIndex: currentLessonState.stepIndex,
              answers: currentLessonState.answers,
            }}
            completeLessonFlow={() => undefined}
            nextStep={nextStep}
            answerQuestion={answerQuestion}
            answerTrueFalse={answerTrueFalse}
          />
        )}

        {route.name === "profile" && <ProfileView userData={userData} />}

        {route.name === "leaderboard" && (
          <LeaderboardView xp={userData.xp} />
        )}

        {route.name === "settings" && (
          <SettingsView
            userData={userData}
            setDailyGoal={(goal) => {
              // simple update
              (window as any).fundiSetDailyGoal?.(goal);
            }}
            resetProgress={resetProgress}
          />
        )}

        <StatsPanel userData={userData} />
      </div>
    </AuthGate>
  );
}

