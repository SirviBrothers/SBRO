import re

html_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\index.html'

with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

print("--- Searching for Download ---")
idx = content.find('Download')
while idx != -1:
    print(content[max(0, idx-100):min(len(content), idx+100)])
    print("---------------------------------")
    idx = content.find('Download', idx+1)

print("--- Searching for GSTN ---")
idx = content.find('GSTN')
while idx != -1:
    print(content[max(0, idx-100):min(len(content), idx+100)])
    print("---------------------------------")
    idx = content.find('GSTN', idx+1)

print("--- Searching for Sirvi Brothers ---")
idx = content.find('Sirvi Brothers')
while idx != -1:
    # Just print the first one or two
    print(content[max(0, idx-100):min(len(content), idx+100)])
    print("---------------------------------")
    idx = content.find('Sirvi Brothers', idx+1)
