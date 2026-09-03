import re
import os

html_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\index.html'
auth_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\js\auth.js'

# 1. Fix Logout Button in index.html and auth.js
with open(html_path, 'r', encoding='utf-8') as f:
    html_content = f.read()

# Change href="login.html" to id="supabase-logout-btn"
if '<a href="login.html" class="nav-item">' in html_content:
    html_content = html_content.replace('<a href="login.html" class="nav-item">', '<a href="#" id="supabase-logout-btn" class="nav-item">')
elif '<a href="login.html"' in html_content:
    html_content = re.sub(r'<a href="login\.html"([^>]*)>', r'<a href="#" id="supabase-logout-btn"\1>', html_content)


# 2. Fix PIN box sizes
# Currently: width: 45px; height: 55px; text-align: center; font-size: 1.5rem;
html_content = html_content.replace('width: 45px; height: 55px;', 'width: 60px; height: 65px; padding: 0; box-sizing: border-box;')
html_content = html_content.replace('font-size: 1.5rem;', 'font-size: 2rem;')

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html_content)


# 3. Add Logout logic to auth.js
with open(auth_path, 'r', encoding='utf-8') as f:
    auth_content = f.read()

logout_logic = """
    // Logout Logic
    document.addEventListener('DOMContentLoaded', () => {
        const logoutBtn = document.getElementById('supabase-logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await supabaseClient.auth.signOut();
                sessionStorage.removeItem('dashboard_unlocked');
                window.location.href = 'login.html';
            });
        }
    });
"""
if 'supabase-logout-btn' not in auth_content:
    # insert before the generic DOMContentLoaded for pin
    if 'document.addEventListener(\'DOMContentLoaded\'' in auth_content:
        auth_content = auth_content.replace("document.addEventListener('DOMContentLoaded', () => {", logout_logic + "\ndocument.addEventListener('DOMContentLoaded', () => {", 1)

with open(auth_path, 'w', encoding='utf-8') as f:
    f.write(auth_content)

print("SUCCESS: Fixed Logout button and PIN box sizes.")
