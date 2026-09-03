import os

html_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\index.html'

with open(html_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if '<aside class="sidebar">' in line:
        print("Found sidebar at line", i)
        # Print next 50 lines, but truncate long lines to 100 chars
        for j in range(i, min(i+50, len(lines))):
            print(f"{j}: {lines[j][:100].strip()}")
        break
