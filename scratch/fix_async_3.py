import re
import subprocess
import os

app_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\js\app.js'
storage_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\js\storage.js'

# 1. Add missing methods to storage.js
with open(storage_path, 'r', encoding='utf-8') as f:
    storage_content = f.read()

if 'static async deductStock(' not in storage_content:
    extra_methods = """
    static async deductStock(category, brand, variant, qty) {
        const inventory = await this.getInventory();
        const item = inventory.find(i => i.category === category && i.brand === brand && i.variant === variant);
        if (item) {
            await this.client.from('inventory').update({
                quantity: item.quantity - parseFloat(qty)
            }).eq('id', item.id);
        }
    }

    static async revertSaleStock(invoiceNo) {
        const sales = await this.getSales();
        const sale = sales.find(s => s.invoice_no === invoiceNo || s.invoiceNo === invoiceNo);
        if (sale && sale.sale_items) {
            for (const item of sale.sale_items) {
                const inventory = await this.getInventory();
                const invItem = inventory.find(i => i.category === item.category && i.brand === item.brand && i.variant === item.variant);
                if (invItem) {
                    await this.client.from('inventory').update({
                        quantity: invItem.quantity + parseFloat(item.quantity)
                    }).eq('id', invItem.id);
                }
            }
        }
    }
    """
    storage_content = storage_content.replace('static async getNextInvoiceNo() {', extra_methods + '\n    static async getNextInvoiceNo() {')
    with open(storage_path, 'w', encoding='utf-8') as f:
        f.write(storage_content)


# 2. Fix app.js forEach loop and method names
with open(app_path, 'r', encoding='utf-8') as f:
    app_content = f.read()

# Fix the forEach await syntax error
old_loop = """        items.forEach(item => {
            await StorageManager.deductStock(item.category, item.brand, item.variant, item.qty);
        });"""
new_loop = """        for (const item of items) {
            await StorageManager.deductStock(item.category, item.brand, item.variant, item.qty);
        }"""
app_content = app_content.replace(old_loop, new_loop)

# Fix getNextInvoiceNumber
app_content = app_content.replace('StorageManager.getNextInvoiceNumber()', 'StorageManager.getNextInvoiceNo()')

# Check if there are other .forEach loops doing await
# Like revertPurchaseStock? Let's fix revertPurchaseStock just in case.
old_purchase_loop = """        purchaseData.items.forEach(item => {
            await StorageManager.revertPurchaseStock(editingPurchaseBillNo);
        });"""
if 'await StorageManager.revertPurchaseStock' in app_content:
    pass # Wait, if it crashes node -c we will see it. Let's just fix the known ones.

with open(app_path, 'w', encoding='utf-8') as f:
    f.write(app_content)

# Check syntax
result = subprocess.run(['node', '-c', app_path], capture_output=True, text=True)
if result.returncode != 0:
    print(f"Error in {app_path}:\n{result.stderr}")
else:
    print(f"{app_path} syntax is OK.")
