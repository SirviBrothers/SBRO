import os

app_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\js\app.js'
out_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\scratch\inv_dump.txt'

with open(app_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

out_lines = []
found = False
for i, line in enumerate(lines):
    if 'function renderInventoryTable' in line:
        found = True
    if found:
        out_lines.append(f"{i+1}: {line}")
    if found and i > 0 and len(out_lines) > 100:
        break

with open(out_path, 'w', encoding='utf-8') as f:
    f.writelines(out_lines)
