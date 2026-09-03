import re
import base64

html_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\index.html'

with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

cello_path = r'C:\Users\ompra\.gemini\antigravity-ide\brain\3d72163d-7141-44c7-a603-82d0d62f0d99\.user_uploaded\media_1788374922635.png'
with open(cello_path, 'rb') as img_f:
    cello_b64 = base64.b64encode(img_f.read()).decode('utf-8')

cello_src = f'data:image/png;base64,{cello_b64}'
cello_img_tag = f'<img src="{cello_src}" style="height: 35px; object-fit: contain;">'

# Find the header div
header_start = content.find('<!-- Brand Logos Header -->')
if header_start != -1:
    div_start = content.find('<div style="display: flex; justify-content: center;', header_start)
    div_end = content.find('</div>', div_start)
    
    header_html = content[div_start:div_end+6]
    
    # Extract all img tags
    img_tags = re.findall(r'<img[^>]+>', header_html)
    
    if len(img_tags) >= 5:
        # The 5th image is the SB Logo (index 4)
        old_sb_tag = img_tags[4]
        print("Found SB logo tag. Replacing...")
        
        new_header_html = header_html.replace(old_sb_tag, cello_img_tag)
        new_content = content[:div_start] + new_header_html + content[div_end+6:]
        
        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("SUCCESS: Replaced top bar SB logo with Cello logo.")
    else:
        print(f"FAILED: Found only {len(img_tags)} images in the header.")
else:
    print("FAILED: Could not find Brand Logos Header.")
