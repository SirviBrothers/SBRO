import os

html_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\index.html'

with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

new_content = content.replace('<div class="invoice-logo">SB</div>', '<img src="assets/sb_logo.png" style="height: 60px; object-fit: contain;">')

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Replaced invoice-logo text with image.")
