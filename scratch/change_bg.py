import re

html_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\login.html'

with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace all occurrences of background: #F3F4F6; with background: #ffffff;
content = content.replace('background: #F3F4F6;', 'background: #ffffff;')

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS: Changed background to completely white.")
