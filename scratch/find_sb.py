import os
import re

html_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\index.html'

with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

# find all divs containing exactly 'SB'
matches = re.finditer(r'<div[^>]*>\s*SB\s*</div>', content, re.IGNORECASE)
found = False
for m in matches:
    print(f"Found match: {m.group(0)}")
    found = True

if not found:
    print("Could not find any div containing 'SB'")

# Let's also just search for the string "Bill To"
idx = content.find("Bill To")
if idx != -1:
    print("Found 'Bill To' at index", idx)
    print("Context around 'Bill To':")
    print(content[max(0, idx-200):min(len(content), idx+200)])
else:
    print("Could not find 'Bill To'")
