import re

html_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\index.html'

with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace the logo sidebar header
# I'll use regex to find the logo-circle/company-info structure
# Since the image is base64, I will carefully extract everything up to <div class="company-info">
old_sidebar_pattern = r'(<img[^>]+style="height: 120px; object-fit: contain;">)\s*<div class="company-info">\s*<h2>Sirvi Brothers</h2>\s*<span class="gstn">GSTN: XYZ123456789</span>\s*</div>'

def sidebar_repl(match):
    img_tag = match.group(1)
    # Wrap in a flex column container
    return f'<div style="display: flex; flex-direction: column; align-items: center; gap: 5px;">\n    {img_tag}\n    <span class="gstn" style="font-weight: 600; color: #4B5563;">GSTN: XYZ123456789</span>\n</div>'

content = re.sub(old_sidebar_pattern, sidebar_repl, content)

# 2. Replace the Download button
old_btn = r'<button class="btn btn-primary" id="download-bill-btn">\s*<i class="ph ph-download-simple"></i> Download\s*</button>'
new_btn = '''<button class="btn btn-primary" id="download-bill-btn">
                                <i class="ph ph-download-simple"></i> Download/Save
                            </button>
                            <button class="btn btn-success" id="whatsapp-share-btn" style="background-color: #25D366; border-color: #25D366; color: white; margin-left: 10px;">
                                <i class="ph ph-whatsapp-logo"></i> WhatsApp Share
                            </button>'''

content = re.sub(old_btn, new_btn, content)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Applied logo and button changes successfully.")
