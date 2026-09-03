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
img_tag = f'<img src="{b64_src}" style="height: 80px; object-fit: contain;">'

# Replace `<div class="invoice-logo">...</div>` with the base64 img tag
# This handles any whitespace or inner text
new_content = re.sub(
    r'<div\s+class="invoice-logo"\s*>.*?</div>', 
    img_tag, 
    content,
    flags=re.DOTALL
)

if new_content != content:
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("SUCCESS: Replaced invoice-logo div with base64 image tag.")
else:
    print("FAILED: Could not find <div class=\"invoice-logo\"> in index.html.")
