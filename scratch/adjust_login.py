import re

html_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\login.html'

with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Change header-row justify-content from center to space-between
content = content.replace('justify-content:center;\n    align-items:flex-start;\n    gap: 40px;', 'justify-content:space-between;\n    align-items:flex-start;')

# 2. Make SB Logo more above
# The center-content has justify-content: center;
# I will change it to flex-start so it sits higher up, right under the header.
content = content.replace('justify-content: center;\n    text-align:center;', 'justify-content: flex-start;\n    text-align:center;\n    padding-top: 0px;')

# I will also adjust the SB logo's margin if it needs to be higher
# Currently it has: style="width: 240px; height: auto; margin-bottom: 5px; filter: drop-shadow(0px 8px 16px rgba(0,0,0,0.15)); z-index: 5;"
content = content.replace('margin-bottom: 5px;', 'margin-bottom: 30px; margin-top: -20px;')

# Let's write the changes back
with open(html_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS: Adjusted login.html layout for Mataji, Totem, and SB Logo.")
