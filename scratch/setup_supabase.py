import os

login_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\login.html'
index_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\index.html'
auth_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\js\auth.js'

supabase_cdn = '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>\n'

# 1. Update login.html
with open(login_path, 'r', encoding='utf-8') as f:
    login_content = f.read()

# Change the signin button
login_content = login_content.replace('<a href="index.html" class="switch-signin">Sign In</a>', 
                                      '<a href="#" id="google-signin-btn" class="switch-signin">Sign In</a>')

# Add CDN and login logic
login_script = """
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script>
    // Supabase Configuration (PASTE YOUR KEYS HERE)
    const SUPABASE_URL = 'YOUR_SUPABASE_URL_HERE';
    const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY_HERE';
    
    // Only initialize if keys are present to prevent crashes
    if (SUPABASE_URL !== 'YOUR_SUPABASE_URL_HERE') {
        const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        document.getElementById('google-signin-btn').addEventListener('click', async (e) => {
            e.preventDefault();
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin + '/index.html'
                }
            });
            if (error) {
                alert('Login failed: ' + error.message);
            }
        });
        
        // If already logged in, redirect to dashboard automatically
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                window.location.href = 'index.html';
            }
        });
    } else {
        // Fallback for demo purposes if keys aren't added yet
        document.getElementById('google-signin-btn').addEventListener('click', (e) => {
            e.preventDefault();
            alert('Supabase keys missing! Please add them to the code.');
            // window.location.href = 'index.html'; // uncomment to bypass
        });
    }
</script>
"""
if '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2">' not in login_content:
    login_content = login_content.replace('</body>', login_script + '\n</body>')

with open(login_path, 'w', encoding='utf-8') as f:
    f.write(login_content)

# 2. Update index.html to include Supabase CDN
with open(index_path, 'r', encoding='utf-8') as f:
    index_content = f.read()

if 'supabase-js@2' not in index_content:
    index_content = index_content.replace('<script src="js/auth.js"></script>', 
                                          supabase_cdn + '    <script src="js/auth.js"></script>')
    with open(index_path, 'w', encoding='utf-8') as f:
        f.write(index_content)

# 3. Update auth.js with secure routing
with open(auth_path, 'r', encoding='utf-8') as f:
    auth_content = f.read()

# Prepend Supabase logic to auth.js
auth_header = """// Supabase Configuration for Secure Routing (PASTE YOUR KEYS HERE)
const SUPABASE_URL = 'YOUR_SUPABASE_URL_HERE';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY_HERE';

if (SUPABASE_URL !== 'YOUR_SUPABASE_URL_HERE') {
    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Check session on page load
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
            // Not logged in! Redirect to login page
            window.location.href = 'login.html';
        }
    });
    
    // Listen for sign-out events (Optional future feature)
    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
            window.location.href = 'login.html';
        }
    });
} else {
    console.warn('Supabase keys missing in auth.js. Secure routing bypassed for testing.');
}

"""
if 'supabaseClient' not in auth_content:
    with open(auth_path, 'w', encoding='utf-8') as f:
        f.write(auth_header + auth_content)

print("SUCCESS: Configured Supabase Auth and Routing logic.")
