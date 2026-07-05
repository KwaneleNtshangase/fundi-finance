import re

with open('temp.tsx', 'r') as f:
    lines = f.readlines()

header = "".join(lines[0:164])
# Replace the import from pageViews.types with the new one
header = header.replace("COURSE_LEVEL_REQUIREMENTS,", "COURSE_LEVEL_REQUIREMENTS, COURSE_COLOURS, type SavedLessonProgress,")

files_mapping = {
    "OnboardingView": (164, 450),       # 165 to 450
    "LearnView": (450, 1451),           # 451 to 1451 (includes components before LearnView)
    "QuestsView": (1451, 1539),         # 1452 to 1539
    "CourseView": (1539, 1781),         # 1540 to 1781
    "LessonView": (1781, 2677)          # 1782 to 2677 (includes FillBlankStep and LessonView)
}

for name, (start_idx, end_idx) in files_mapping.items():
    content = header + "\n" + "".join(lines[start_idx:end_idx])
    with open(f"src/components/views/{name}.tsx", 'w') as f:
        f.write(content)
    print(f"Created {name}.tsx")
