import os

storage_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\js\storage.js'

with open(storage_path, 'r', encoding='utf-8') as f:
    storage_content = f.read()

# Fix getSales() mapping to include paidAmount
storage_content = storage_content.replace('receivedAmt: s.received_amt,', 'receivedAmt: s.received_amt,\n            paidAmount: s.received_amt,')

with open(storage_path, 'w', encoding='utf-8') as f:
    f.write(storage_content)
    
print("SUCCESS: Added paidAmount to getSales mapping.")
