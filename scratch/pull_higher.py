import re

html_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\login.html'

with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

# I want to increase the negative margin-top on the SB logo to pull it and the switchboard higher
# Currently it might be 'margin-top: -20px;'
# I will replace it with 'margin-top: -100px;'
content = content.replace('margin-top: -20px;', 'margin-top: -100px;')

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS: Adjusted margin-top to pull the logo higher.")
