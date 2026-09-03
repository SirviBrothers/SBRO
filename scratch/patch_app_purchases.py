import os

app_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\js\app.js'

with open(app_path, 'r', encoding='utf-8') as f:
    content = f.read()

target1 = """            const totalAmount = calculatePurchaseTotal();
            
            await StorageManager.savePurchase({
                vendorName,
                date,
                mobile: document.getElementById('purchase-vendor-mobile').value || '',
                items,
                totalAmount
            });"""

replacement1 = """            const totalAmount = calculatePurchaseTotal();
            const paidAmount = parseFloat(document.getElementById('purchase-paid-amount').value) || 0;
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

target2 = """            document.getElementById('purchase-vendor-name').value = '';
            document.getElementById('purchase-vendor-mobile').value = '';
            document.getElementById('purchase-date').valueAsDate = new Date();"""

replacement2 = """            document.getElementById('purchase-vendor-name').value = '';
            document.getElementById('purchase-vendor-mobile').value = '';
            document.getElementById('purchase-vendor-gstn').value = '';
            document.getElementById('purchase-paid-amount').value = '';
            document.getElementById('purchase-date').valueAsDate = new Date();"""

content = content.replace(target1, replacement1)
content = content.replace(target2, replacement2)

with open(app_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS: Patched app.js with GSTN and Paid Amount logic.")
