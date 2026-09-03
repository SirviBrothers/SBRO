import os

app_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\js\app.js'

with open(app_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

out_lines = []
found = False
count = 0
for i, line in enumerate(lines):
    if 'saveBtn.addEventListener' in line or 'function saveBill' in line or 'document.getElementById(\'save-bill-btn\').addEventListener' in line:
        found = True
    if found:
        out_lines.append(f"{i+1}: {line.strip().encode('ascii', 'ignore').decode('ascii')}")
        count += 1
    if count > 150:
        break

with open(r'c:\Users\ompra\Desktop\Sirvi Brothers\scratch\dump_save_bill.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(out_lines))

print("Dumped save logic!")
