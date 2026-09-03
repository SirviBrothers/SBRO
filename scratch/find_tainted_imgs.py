import re

html_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\index.html'

with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find all img tags
img_tags = re.findall(r'<img[^>]+>', content, re.IGNORECASE)

print(f"Total img tags found: {len(img_tags)}")
tainted_imgs = []
for tag in img_tags:
    src_match = re.search(r'src=["\']([^"\']+)["\']', tag, re.IGNORECASE)
    if src_match:
        src = src_match.group(1)
        if not src.startswith('data:'):
            tainted_imgs.append(src)
            print(f"Potentially tainted image source found: {src}")

if not tainted_imgs:
    print("All image sources seem to be Base64 (data: URIs).")
