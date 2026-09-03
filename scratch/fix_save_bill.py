import os

app_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\js\app.js'

with open(app_path, 'r', encoding='utf-8') as f:
    app_content = f.read()

old_logic = """const billData = {
invoiceNo,
date,
buyerName,
mobile,
gstn,
address,
paymentMethod: dueAmount > 0 ? 'Credit' : 'Cash/Online',
paidAmount,
dueAmount,
items,
total
};

// Save Data
await StorageManager.saveSale(billData, editingInvoiceNo !== null);

if (dueAmount > 0) {
const dueDate = document.getElementById('due-date').value;
await StorageManager.saveCredit({
...billData,
total: dueAmount, // Override total for the credit section
dueDate
}, editingInvoiceNo !== null);
} else if (editingInvoiceNo !== null) {
await StorageManager.removeCredit(editingInvoiceNo);
}"""

# Convert spaces to match exact file indents (could be tabs or spaces)
# It's safer to just regex replace the entire block from `const billData = {` to `editingInvoiceNo = null;`

import re

# We want to replace everything from `const billData = {` up to `editingInvoiceNo = null;`
pattern = r'const billData = \{.*?(?=editingInvoiceNo = null;)'

new_logic = """const billData = {
    invoiceNo,
    date,
    buyerName,
    mobile,
    gstn,
    address,
    subtotal: total,
    discount: 0,
    grandTotal: total,
    receivedAmt: paidAmount,
    balance: dueAmount,
    paymentMode: dueAmount > 0 ? 'Credit' : 'Cash/Online',
    remarks: '',
    items
};

// Save Data
await StorageManager.saveSale(billData, editingInvoiceNo !== null);

"""

app_content = re.sub(pattern, new_logic, app_content, flags=re.DOTALL)

with open(app_path, 'w', encoding='utf-8') as f:
    f.write(app_content)

print("SUCCESS: Fixed billData construction and removed obsolete saveCredit calls.")
