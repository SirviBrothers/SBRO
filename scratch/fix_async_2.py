import re
import subprocess
import os

app_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\js\app.js'
storage_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\js\storage.js'

# 1. Add checkStock to storage.js
with open(storage_path, 'r', encoding='utf-8') as f:
    storage_content = f.read()

if 'static async checkStock(' not in storage_content:
    check_stock_method = """
    static async checkStock(category, brand, variant, qty) {
        const inventory = await this.getInventory();
        const item = inventory.find(i => i.category === category && i.brand === brand && i.variant === variant);
        if (!item) return false;
        return item.quantity >= qty;
    }
    """
    storage_content = storage_content.replace('static async getInventory() {', check_stock_method + '\n    static async getInventory() {')
    with open(storage_path, 'w', encoding='utf-8') as f:
        f.write(storage_content)


# 2. Fix app.js
with open(app_path, 'r', encoding='utf-8') as f:
    app_content = f.read()

# Make processBillData async
app_content = app_content.replace('function processBillData() {', 'async function processBillData() {')

# Await processBillData where it is called
app_content = app_content.replace('const billData = processBillData();', 'const billData = await processBillData();')

with open(app_path, 'w', encoding='utf-8') as f:
    f.write(app_content)

# Check syntax
result = subprocess.run(['node', '-c', app_path], capture_output=True, text=True)
if result.returncode != 0:
    print(f"Error in {app_path}:\n{result.stderr}")
else:
    print(f"{app_path} syntax is OK.")
