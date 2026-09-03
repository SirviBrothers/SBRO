import os
import base64
import re

html_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\index.html'

with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Extract the invoice template part
start_marker = '<div id="invoice-template"'
end_marker = '<table cellpadding="0" cellspacing="0" class="invoice-layout-table">'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker, start_idx)

if start_idx != -1 and end_idx != -1:
    template_html = content[start_idx:end_idx]
    
    # Find all src="..." in this template block
    def replace_with_base64(match):
        src = match.group(1)
        if src.startswith('assets/'):
            # Convert to absolute path based on CWD
            abs_path = os.path.join(r'c:\Users\ompra\Desktop\Sirvi Brothers', src.replace('/', '\\'))
            if os.path.exists(abs_path):
                with open(abs_path, 'rb') as img_f:
                    b64_data = base64.b64encode(img_f.read()).decode('utf-8')
                
                # Determine mime type
                ext = abs_path.split('.')[-1].lower()
                mime = f'image/{ext}'
                if ext == 'jpg': mime = 'image/jpeg'
                
                new_src = f'data:{mime};base64,{b64_data}'
                return f'src="{new_src}"'
        return match.group(0)

    # regex to find src="something"
    new_template_html = re.sub(r'src="([^"]+)"', replace_with_base64, template_html)
    
    new_content = content[:start_idx] + new_template_html + content[end_idx:]
    
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print("Replaced images in invoice template with Base64.")
else:
    print("Could not find invoice template.")
