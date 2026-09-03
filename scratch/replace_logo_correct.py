import os
import re
import base64

html_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\index.html'

with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

logo_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\assets\sb_logo.png'
with open(logo_path, 'rb') as img_f:
    b64_data = base64.b64encode(img_f.read()).decode('utf-8')

b64_src = f'data:image/png;base64,{b64_data}'
img_tag = f'<img src="{b64_src}" style="height: 120px; object-fit: contain;">'

# Replace `<div class="logo-circle">SB</div>` with the base64 img tag
new_content = re.sub(
    r'<div\s+class="logo-circle"\s*>SB</div>', 
    img_tag, 
    content,
    flags=re.IGNORECASE
)

if new_content != content:
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("SUCCESS: Replaced logo-circle div with base64 image tag.")
else:
    print("FAILED: Could not find <div class=\"logo-circle\">SB</div> in index.html.")
