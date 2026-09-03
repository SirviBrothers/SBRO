import re

html_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\index.html'

with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove WhatsApp Share button
wa_btn_pattern = r'<button class="btn btn-success" id="whatsapp-share-btn"[^>]*>\s*<i class="ph ph-whatsapp-logo"></i> WhatsApp Share\s*</button>'
content = re.sub(wa_btn_pattern, '', content)

# 2. Remove old Share button
share_btn_pattern = r'<button class="btn btn-primary" id="share-bill-btn">\s*<i class="ph ph-share-network"></i> Share\s*</button>'
content = re.sub(share_btn_pattern, '', content)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS: Removed WhatsApp Share and Share buttons from index.html")
