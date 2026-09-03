import re

html_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\login.html'

url = 'https://ztlrayekobgcllnxmqft.supabase.co'
key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0bHJheWVrb2JnY2xsbnhtcWZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNzc4NTIsImV4cCI6MjEwMzk1Mzg1Mn0.SCv_r5KOQIN0RTvEEQrZLCOGaaneWsPlJuIMnyxYXkE'

with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Force replace the placeholder or any existing faulty url/key definitions in login.html
# Look for const SUPABASE_URL = ...
content = re.sub(r"const SUPABASE_URL = '[^']+';", f"const SUPABASE_URL = '{url}';", content)
content = re.sub(r"const SUPABASE_ANON_KEY = '[^']+';", f"const SUPABASE_ANON_KEY = '{key}';", content)

# Also fix the `window.location.origin` bug for file:/// URLs
# If the user is on file:///, window.location.origin is 'file://', which Google OAuth rejects.
# We will change it to fallback to a relative path or just hardcode for localhost testing.
# A better way is: const redirectUrl = window.location.href.replace('login.html', 'index.html');
old_redirect = "redirectTo: window.location.origin + '/index.html'"
new_redirect = "redirectTo: window.location.href.replace('login.html', 'index.html')"
content = content.replace(old_redirect, new_redirect)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS: Fixed keys and redirect URL in login.html")
