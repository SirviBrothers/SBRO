import os

login_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\login.html'
auth_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\js\auth.js'

url = 'https://ztlrayekobgcllnxmqft.supabase.co'
key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0bHJheWVrb2JnY2xsbnhtcWZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNzc4NTIsImV4cCI6MjEwMzk1Mzg1Mn0.SCv_r5KOQIN0RTvEEQrZLCOGaaneWsPlJuIMnyxYXkE'

# 1. Update auth.js
with open(auth_path, 'r', encoding='utf-8') as f:
    auth_content = f.read()

auth_content = auth_content.replace("'YOUR_SUPABASE_URL_HERE'", f"'{url}'")
auth_content = auth_content.replace("'YOUR_SUPABASE_ANON_KEY_HERE'", f"'{key}'")

with open(auth_path, 'w', encoding='utf-8') as f:
    f.write(auth_content)

# 2. Update login.html
with open(login_path, 'r', encoding='utf-8') as f:
    login_content = f.read()

# If it didn't get injected previously because of an error, let's inject it now
login_script = f"""
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script>
    // Supabase Configuration
    const SUPABASE_URL = '{url}';
    const SUPABASE_ANON_KEY = '{key}';
    
    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    document.getElementById('google-signin-btn').addEventListener('click', async (e) => {{
        e.preventDefault();
        const {{ data, error }} = await supabaseClient.auth.signInWithOAuth({{
            provider: 'google',
            options: {{
                redirectTo: window.location.origin + '/index.html'
            }}
        }});
        if (error) {{
            alert('Login failed: ' + error.message);
        }}
    }});
    
    // If already logged in, redirect to dashboard automatically
    supabaseClient.auth.getSession().then(({{ data: {{ session }} }}) => {{
        if (session) {{
            window.location.href = 'index.html';
        }}
    }});
</script>
"""

# Check if old script is there
if 'YOUR_SUPABASE_URL_HERE' in login_content:
    login_content = login_content.replace("'YOUR_SUPABASE_URL_HERE'", f"'{url}'")
    login_content = login_content.replace("'YOUR_SUPABASE_ANON_KEY_HERE'", f"'{key}'")
else:
    # If not there at all, we must ensure we replace the button and inject the script
    if 'id="google-signin-btn"' not in login_content:
        login_content = login_content.replace('<a href="index.html" class="switch-signin">Sign In</a>', 
                                              '<a href="#" id="google-signin-btn" class="switch-signin">Sign In</a>')
    if 'supabase-js@2' not in login_content:
        login_content = login_content.replace('</body>', login_script + '\\n</body>')

with open(login_path, 'w', encoding='utf-8') as f:
    f.write(login_content)

print("SUCCESS: Injected Supabase keys into auth.js and login.html.")
