import re

with open('temp.tsx', 'r') as f:
    lines = f.readlines()

def print_functions_in_range(start, end):
    for i in range(start, end):
        if lines[i].startswith("function ") or lines[i].startswith("const "):
            if " = (" in lines[i] or " = ()" in lines[i]:
                print(lines[i].strip())
            elif lines[i].startswith("function "):
                print(lines[i].strip())

print("Between Onboarding and LearnView (451 to 950):")
print_functions_in_range(451, 950)

print("Between Quests and CourseView (1539 to 1540):")
print_functions_in_range(1539, 1540)

print("Between CourseView and LessonView (1782 to 1910):")
print_functions_in_range(1782, 1910)
