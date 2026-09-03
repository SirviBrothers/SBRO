import re

html_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\index.html'

with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

print("--- Searching for Share buttons ---")
idx = content.find('whatsapp-share-btn')
if idx != -1:
    print(content[max(0, idx-200):min(len(content), idx+200)])
else:
    print("Could not find whatsapp-share-btn")

print("\n--- Searching for any other Share button ---")
idx = content.find('> Share')
while idx != -1:
    print(content[max(0, idx-100):min(len(content), idx+100)])
    idx = content.find('> Share', idx+1)

print("\n--- Searching for Total Sales action buttons ---")
# Usually Total Sales section is a table row or a section
idx = content.find('Total Sales')
while idx != -1:
    print(content[max(0, idx-100):min(len(content), idx+500)])
    print("---------------------------------")
    idx = content.find('Total Sales', idx+1)
