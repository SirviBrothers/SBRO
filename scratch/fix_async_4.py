import re
import subprocess

app_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\js\app.js'

with open(app_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix loadBillIntoForm
content = content.replace('function loadBillIntoForm(invoiceNo)', 'async function loadBillIntoForm(invoiceNo)')

# Fix await ... .find()
content = re.sub(r'await (StorageManager\.\w+\(\))\.find', r'(await \1).find', content)
content = re.sub(r'await (StorageManager\.\w+\(\))\.filter', r'(await \1).filter', content)
content = re.sub(r'await (StorageManager\.\w+\(\))\.map', r'(await \1).map', content)

# Fix sale.items.forEach(item => { createRow(item); });
# Just change it to a for...of loop
old_create_loop = """        sale.items.forEach(item => {
            createRow(item);
        });"""
new_create_loop = """        for (const item of sale.items) {
            await createRow(item);
        }"""
content = content.replace(old_create_loop, new_create_loop)

# Let's also check for loadPurchaseIntoForm
if 'function loadPurchaseIntoForm' in content:
    content = content.replace('function loadPurchaseIntoForm', 'async function loadPurchaseIntoForm')
    
old_purch_loop = """        purchase.items.forEach(item => {
            createPurchaseRow(item);
        });"""
new_purch_loop = """        for (const item of purchase.items) {
            await createPurchaseRow(item);
        }"""
content = content.replace(old_purch_loop, new_purch_loop)

# Fix recalculateDueAmount if it has await? No, it shouldn't.
# Find any function xyz() { ... await ... }
def find_and_fix_missing_async(text):
    # This is a naive heuristic: find functions and check if they contain await but aren't async.
    # It's better to just let node -c tell us.
    return text

content = find_and_fix_missing_async(content)

with open(app_path, 'w', encoding='utf-8') as f:
    f.write(content)

result = subprocess.run(['node', '-c', app_path], capture_output=True, text=True)
if result.returncode != 0:
    print(f"Error in {app_path}:\n{result.stderr}")
else:
    print(f"{app_path} syntax is OK.")
