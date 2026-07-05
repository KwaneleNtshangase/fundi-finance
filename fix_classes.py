import os
import re

directories = ['src/components', 'src/app']

for directory in directories:
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                filepath = os.path.join(root, file)
                with open(filepath, 'r') as f:
                    content = f.read()

                # Replace className="main-content main-with-stats" with className="page-wrapper"
                # Or just remove main-content and main-with-stats completely.
                # Actually, some places might just have `main-content` or `main-with-stats`.
                new_content = content
                # To be safe, let's just replace exact common patterns
                new_content = new_content.replace('className="main-content main-with-stats"', 'className=""')
                new_content = new_content.replace('className="main-content main-with-stats budget-page"', 'className="budget-page"')
                new_content = new_content.replace('className="main-content" style=', 'style=')
                
                # if className="" was created, we can remove it (or leave it, it's fine)
                new_content = new_content.replace('className="" id=', 'id=')
                new_content = new_content.replace('className=""', '')

                if new_content != content:
                    with open(filepath, 'w') as f:
                        f.write(new_content)
                    print(f"Fixed {filepath}")
