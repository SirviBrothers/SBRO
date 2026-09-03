import re

html_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\login.html'

with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace padding: 30px 40px; with padding: 5px 40px 30px 40px; in .header-row
content = content.replace('padding: 30px 40px;', 'padding: 5px 40px 30px 40px;')

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS: Reduced top padding of the header row.")
