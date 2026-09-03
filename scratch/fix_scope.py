import os

auth_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\js\auth.js'

with open(auth_path, 'r', encoding='utf-8') as f:
    auth_content = f.read()

# Replace 'const supabaseClient =' with 'window.supabaseClient =' in auth.js
auth_content = auth_content.replace('const supabaseClient = supabase.createClient', 'window.supabaseClient = supabase.createClient')

# And replace usage in auth.js to use window.supabaseClient just to be 100% safe
auth_content = auth_content.replace('supabaseClient.auth.', 'window.supabaseClient.auth.')

# Also check login.html to see if there's any scoping issue there. 
# login.html has:
# const supabaseClient = supabase.createClient...
# and it is used inside the same <script> block but not inside an if block? 
# Wait, login.html has `if (SUPABASE_URL && SUPABASE_URL.startsWith('http')) { const supabaseClient = ... }`.
# Yes, it is inside an if block!
login_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\login.html'
with open(login_path, 'r', encoding='utf-8') as f:
    login_content = f.read()

login_content = login_content.replace('const supabaseClient = supabase.createClient', 'window.supabaseClient = supabase.createClient')
login_content = login_content.replace('supabaseClient.auth.', 'window.supabaseClient.auth.')

with open(auth_path, 'w', encoding='utf-8') as f:
    f.write(auth_content)

with open(login_path, 'w', encoding='utf-8') as f:
    f.write(login_content)

print("SUCCESS: Fixed variable scope issues in auth.js and login.html.")
