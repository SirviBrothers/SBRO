import re

html_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\login.html'

with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace margin-top: -100px with -160px to pull it even higher
content = content.replace('margin-top: -100px;', 'margin-top: -160px;')

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS: Adjusted margin-top to -160px.")
