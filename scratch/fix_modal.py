import re
import os

html_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\index.html'

with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Increase modal container width from 400px to 460px
content = content.replace('width: 400px;', 'width: 460px;')

# 2. Adjust input box sizes slightly so they breathe better
# Current: width: 60px; height: 65px; padding: 0; box-sizing: border-box; text-align: center; font-size: 2rem;
content = content.replace('width: 60px; height: 65px;', 'width: 55px; height: 65px;')

# Also add gap: 12px; to the pin-inputs container to space them out nicely
if 'gap: 8px;' in content:
    content = content.replace('gap: 8px;', 'gap: 12px;')

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS: Adjusted modal and pin box sizes to fit perfectly.")
