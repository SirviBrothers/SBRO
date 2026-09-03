import os

app_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\index.html'
out_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\scratch\dump_home_html.txt'

with open(app_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

out_lines = []
found = False
for i, line in enumerate(lines):
    if 'id="home-tab"' in line:
        found = True
    if found:
        out_lines.append(f"{i+1}: {line}")
    if found and 'id="billing-tab"' in line:
        break
    if len(out_lines) > 200:
        break

with open(out_path, 'w', encoding='utf-8') as f:
    f.writelines(out_lines)
