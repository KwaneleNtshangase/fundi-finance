import re

for filename in ['src/components/views/LearnView.tsx', 'src/components/views/CourseView.tsx']:
    with open(filename, 'r') as f:
        content = f.read()
    
    # regex to remove COURSE_COLOURS
    content = re.sub(r'// Course accent colours.*?\nconst COURSE_COLOURS = \[.*?\];\n', '', content, flags=re.DOTALL)
    
    with open(filename, 'w') as f:
        f.write(content)

