import re

html_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\index.html'

with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

print("--- Searching for <header ---")
idx = content.find('<header')
while idx != -1:
    print(content[max(0, idx-50):min(len(content), idx+500)])
    print("---------------------------------")
    idx = content.find('<header', idx+1)

print("\n--- Searching for top-bar ---")
idx = content.find('top-bar')
while idx != -1:
    print(content[max(0, idx-50):min(len(content), idx+200)])
    print("---------------------------------")
    idx = content.find('top-bar', idx+1)
    
print("\n--- Searching for Logout ---")
idx = content.find('Logout')
while idx != -1:
    print(content[max(0, idx-50):min(len(content), idx+200)])
    print("---------------------------------")
    idx = content.find('Logout', idx+1)
