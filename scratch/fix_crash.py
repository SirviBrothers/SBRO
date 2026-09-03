import os
import re

app_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\js\app.js'

with open(app_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix shareBtn crash
old_code = """    const shareBtn = document.getElementById('share-bill-btn');
    shareBtn.addEventListener('click', async () => {"""

new_code = """    const shareBtn = document.getElementById('share-bill-btn');
    if (shareBtn) shareBtn.addEventListener('click', async () => {"""

content = content.replace(old_code, new_code)

# There is also a whatsapp share button we should check
old_wa = """    const waBtn = document.getElementById('whatsapp-bill-btn');
    waBtn.addEventListener('click', async () => {"""

new_wa = """    const waBtn = document.getElementById('whatsapp-bill-btn');
    if (waBtn) waBtn.addEventListener('click', async () => {"""

content = content.replace(old_wa, new_wa)

with open(app_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS: Fixed null reference crashes in app.js")
