import re

html_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\index.html'

with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the header div
header_start = content.find('<!-- Brand Logos Header -->')
if header_start != -1:
    div_start = content.find('<div style="display: flex; justify-content: center;', header_start)
    div_end = content.find('</div>', div_start)
    
    header_html = content[div_start:div_end+6]
    
    # Extract all img tags
    img_tags = re.findall(r'<img[^>]+>', header_html)
    
    if len(img_tags) >= 5:
        # The 5th image is currently the totem (index 4)
        tag_to_remove = img_tags[4]
        print("Found the 5th logo tag (totem). Removing...")
        
        # Remove it from the header HTML
        new_header_html = header_html.replace(tag_to_remove, '')
        new_content = content[:div_start] + new_header_html + content[div_end+6:]
        
        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("SUCCESS: Removed the 5th logo from the top bar.")
    else:
        print(f"FAILED: Found only {len(img_tags)} images in the header.")
else:
    print("FAILED: Could not find Brand Logos Header.")
