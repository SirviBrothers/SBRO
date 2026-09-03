import re
import os

login_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\login.html'
auth_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\js\auth.js'

url = 'https://ztlrayekobgcllnxmqft.supabase.co'

# 1. Fix auth.js
with open(auth_path, 'r', encoding='utf-8') as f:
    auth_content = f.read()

# Replace the broken if condition
broken_if = f"if (SUPABASE_URL !== '{url}') {{"
fixed_if = "if (SUPABASE_URL && SUPABASE_URL.startsWith('http')) {"
auth_content = auth_content.replace(broken_if, fixed_if)

with open(auth_path, 'w', encoding='utf-8') as f:
    f.write(auth_content)

# 2. Fix login.html
with open(login_path, 'r', encoding='utf-8') as f:
    login_content = f.read()

login_content = login_content.replace(broken_if, fixed_if)

# Let's also check if I accidentally replaced the error string itself if it had the placeholder, but it didn't.

with open(login_path, 'w', encoding='utf-8') as f:
    f.write(login_content)

print("SUCCESS: Fixed the if conditions in both files.")
