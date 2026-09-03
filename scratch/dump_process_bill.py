import os
app_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\js\app.js'
with open(app_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

out = []
found = False
for i, line in enumerate(lines):
    if 'async function processBillData(' in line or 'save-bill-btn' in line:
        found = True
    if found:
        out.append(f"{i+1}: {line}")
    if found and len(out) > 100:
        break
        
with open(r'c:\Users\ompra\Desktop\Sirvi Brothers\scratch\dump.txt', 'w', encoding='utf-8') as f:
    f.writelines(out)
