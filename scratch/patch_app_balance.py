import os

app_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\js\app.js'

with open(app_path, 'r', encoding='utf-8') as f:
    content = f.read()

target1 = """            const paidAmount = parseFloat(document.getElementById('purchase-paid-amount').value) || 0;
            const gstn = document.getElementById('purchase-vendor-gstn').value || '';
            
            await StorageManager.savePurchase({
                vendorName,
                date,
                mobile: document.getElementById('purchase-vendor-mobile').value || '',
                gstn,
                items,
                totalAmount,
                paidAmount
            });"""

replacement1 = """            const paidAmount = parseFloat(document.getElementById('purchase-paid-amount').value) || 0;
            const balance = totalAmount - paidAmount;
            const gstn = document.getElementById('purchase-vendor-gstn').value || '';
            
            await StorageManager.savePurchase({
                vendorName,
                date,
                mobile: document.getElementById('purchase-vendor-mobile').value || '',
                gstn,
                items,
                totalAmount,
                paidAmount,
                balance
            });"""


content = content.replace(target1, replacement1)

with open(app_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS: Added balance logic to app.js")
