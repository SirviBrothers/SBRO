import re

js_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\js\app.js'

with open(js_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'renderInventoryTable' in line:
        print(f"Line {i+1}: {line.strip()}")
    if 'share-bill-btn' in line:
        print(f"Line {i+1}: {line.strip()}")
    if 'whatsapp-share-btn' in line:
        print(f"Line {i+1}: {line.strip()}")
