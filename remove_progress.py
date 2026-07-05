import re

for filename in ['src/components/views/LearnView.tsx', 'src/components/views/CourseView.tsx']:
    with open(filename, 'r') as f:
        content = f.read()
    
    # regex to remove SavedLessonProgress
    content = re.sub(r'type SavedLessonProgress = \{.*?^};\n', '', content, flags=re.DOTALL | re.MULTILINE)
    
    with open(filename, 'w') as f:
        f.write(content)

