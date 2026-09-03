import os

app_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\js\app.js'

with open(app_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if '(Stock: ' in line:
        print(f"Found '(Stock: ' at line {i+1}")
        start = max(0, i - 15)
        end = min(len(lines), i + 15)
        for j in range(start, end):
            print(f"{j+1}: {lines[j].strip().encode('ascii', 'ignore').decode('ascii')}")
        break
