import re

with open('temp.tsx', 'r') as f:
    lines = f.readlines()

def get_block(start_line_idx):
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

components = {
    "OnboardingView": 164, # Line 165
    "LearnView": 950, # Line 951
    "QuestsView": 1451, # Line 1452
    "CourseView": 1539, # Line 1540
    "LessonView": 1910, # Line 1911
}

last_end = 163
for name, start_idx in components.items():
    if start_idx > last_end + 1:
        print(f"--- Missing content before {name} ---")
        for j in range(last_end + 1, start_idx):
            print(lines[j].strip())
    
    end_idx = get_block(start_idx)
    last_end = end_idx

