import re
import os

login_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\login.html'

with open(login_path, 'r', encoding='utf-8') as f:
    login_content = f.read()

# Replace the shadowed variable declaration
login_content = login_content.replace('const supabase = supabase.createClient', 'const supabaseClient = supabase.createClient')

# Replace the usage inside the block (lines 386, 398)
# Be careful to only replace `supabase.` with `supabaseClient.` inside the <script> block
# A simple way is to replace `await supabase.auth` and `supabase.auth.getSession()`
login_content = login_content.replace('await supabase.auth', 'await supabaseClient.auth')
login_content = login_content.replace('supabase.auth.getSession()', 'supabaseClient.auth.getSession()')

with open(login_path, 'w', encoding='utf-8') as f:
    f.write(login_content)

print("SUCCESS: Fixed variable shadowing in login.html")
