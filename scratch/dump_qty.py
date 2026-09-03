import os

app_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\js\app.js'

with open(app_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for j in range(470, 492):
    print(f"{j+1}: {lines[j].strip().encode('ascii', 'ignore').decode('ascii')}")
