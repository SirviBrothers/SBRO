import os
import re

app_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\js\app.js'

with open(app_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace parseInt(e.currentTarget.dataset.id) -> e.currentTarget.dataset.id
content = re.sub(r'parseInt\(e\.currentTarget\.dataset\.id\)', 'e.currentTarget.dataset.id', content)
# Replace parseInt(e.target.dataset.id) -> e.target.dataset.id
content = re.sub(r'parseInt\(e\.target\.dataset\.id\)', 'e.target.dataset.id', content)

# There might also be other parseInt(id) usages when loading bills, but those are invoice numbers which are integers.
# Let's check for any other dataset usages:
content = re.sub(r'parseInt\((.*?\.dataset\.id)\)', r'\1', content)

with open(app_path, 'w', encoding='utf-8') as f:
    f.write(content)
    
print("SUCCESS: Replaced parseInt(dataset.id) to fix UUID bugs.")
