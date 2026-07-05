import re
import os

with open('src/app/pageViews.tsx', 'r') as f:
    lines = f.readlines()

def get_block(start_line_idx):
    # Find matching brace
    open_braces = 0
    in_block = False
    for i in range(start_line_idx, len(lines)):
        line = lines[i]
        open_braces += line.count('{')
        open_braces -= line.count('}')
        if '{' in line or in_block:
            in_block = True
            if open_braces == 0:
                return i
    return -1

# Common header is lines 0 to 164 (0-indexed)
header = "".join(lines[0:164])

components = {
    "OnboardingView": 164, # Line 165
    "LearnView": 950, # Line 951
    "QuestsView": 1451, # Line 1452
    "CourseView": 1539, # Line 1540
    "LessonView": 1910, # Line 1911
}

for name, start_idx in components.items():
    end_idx = get_block(start_idx)
    content = header + "\n" + "".join(lines[start_idx:end_idx+1])
    with open(f"src/components/views/{name}.tsx", 'w') as f:
        f.write(content)
    print(f"Created {name}.tsx (lines {start_idx+1} to {end_idx+1})")

