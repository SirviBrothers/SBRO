import re

html_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\index.html'

with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

# I want to add the mantra container before the logout button in index.html
# The logout button html is:
# <a href="login.html" class="btn btn-secondary" ...> <i class="ph ph-sign-out"></i> Logout </a>
# Let's search for "login.html" inside index.html to see where the logout button is.

idx = content.find('login.html')
if idx != -1:
    logout_start = content.rfind('<a href="login.html"', 0, idx + 20)
    if logout_start != -1:
        mantra_html = '''
                <div id="mantra-container" style="font-style: italic; color: #B45309; font-weight: 700; font-size: 1.3rem; flex: 1; text-align: center;">
                    || ॐ श्री गणेशाय नमः ||
                </div>
                '''
        new_content = content[:logout_start] + mantra_html + content[logout_start:]
        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("SUCCESS: Injected mantra container before Logout button.")
    else:
        print("FAILED: Could not find the <a href= for the logout button.")
else:
    print("FAILED: Could not find login.html reference.")
