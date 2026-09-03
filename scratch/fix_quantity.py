import os
import re
import subprocess

app_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\js\app.js'
html_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\index.html'

# 1. Fix app.js
with open(app_path, 'r', encoding='utf-8') as f:
    app_content = f.read()

# Replace .stock with .quantity for inventory items
# We only want to replace item.stock -> item.quantity
app_content = app_content.replace('item.stock', 'item.quantity')

# Fix save logic
# const itemData = { category, brand, variant, hsn, stock }; -> const itemData = { category, brand, variant, hsn, quantity: stock };
app_content = app_content.replace('const itemData = {\n            category, brand, variant, hsn, stock\n        };', 'const itemData = {\n            category, brand, variant, hsn, quantity: stock\n        };')
app_content = app_content.replace('category, brand, variant, hsn, stock', 'category, brand, variant, hsn, quantity: stock') # Fallback if spacing is different

# Fix parseInt(id) inside saveInvBtn
app_content = app_content.replace('itemData.id = parseInt(id);', 'itemData.id = id;')

# Fix parseInt(id) inside delete-inv-btn
app_content = app_content.replace('await StorageManager.deleteInventoryItem(parseInt(id));', 'await StorageManager.deleteInventoryItem(id);')

with open(app_path, 'w', encoding='utf-8') as f:
    f.write(app_content)

# 2. Fix index.html (remove migrate button)
with open(html_path, 'r', encoding='utf-8') as f:
    html_lines = f.readlines()

new_html_lines = []
skip = False
for line in html_lines:
    if 'id="migrate-btn"' in line:
        skip = True
        continue
    if skip and '</a>' in line:
        skip = False
        continue
    if not skip:
        new_html_lines.append(line)

with open(html_path, 'w', encoding='utf-8') as f:
    f.writelines(new_html_lines)

print("SUCCESS: Fixed quantity and removed migrate button.")

