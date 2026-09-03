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

# Replace all occurrences of src="assets/sb_logo.png" with the base64 data URI
new_content = re.sub(
    r'src=["\']assets/sb_logo\.png["\']', 
    f'src="{b64_src}"', 
    content,
    flags=re.IGNORECASE
)

if new_content != content:
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("SUCCESS: Replaced tainted assets/sb_logo.png with base64 string.")
else:
    print("FAILED: Could not find assets/sb_logo.png in index.html.")
