import os

app_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\js\app.js'

with open(app_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'Stock Error!' in line:
        print(f"Found 'Stock Error!' at line {i+1}")
        # Print 20 lines before and 20 lines after
        start = max(0, i - 20)
        end = min(len(lines), i + 20)
        for j in range(start, end):
            # Print safely ignoring errors to avoid unicode crash
            print(f"{j+1}: {lines[j].strip().encode('ascii', 'ignore').decode('ascii')}")
        break
