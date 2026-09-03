import os

app_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\js\app.js'

with open(app_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'renderInventoryTable' in line:
        print(f"Found renderInventoryTable at line {i+1}")
        # Print next 50 lines to see the table generation and edit buttons
        for j in range(i, min(i+50, len(lines))):
            print(f"{j+1}: {lines[j].strip()}")
        break
