import os

app_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\js\storage.js'

with open(app_path, 'r', encoding='utf-8') as f:
    content = f.read()

target1 = """        await this.autoRegisterParty(purchaseData.vendorName, purchaseData.mobile, '', '');"""
replacement1 = """        await this.autoRegisterParty(purchaseData.vendorName, purchaseData.mobile, '', purchaseData.gstn);"""

content = content.replace(target1, replacement1)

with open(app_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS: Added GSTN to autoRegisterParty in storage.js")
