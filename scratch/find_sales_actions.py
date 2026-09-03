import re

html_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\index.html'

with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

print("--- Searching for Total Sales tab content ---")
# The tab usually has an ID like id="sales-tab"
idx = content.find('id="sales-tab"')
if idx != -1:
    end_idx = content.find('id="credit-tab"', idx)
    if end_idx == -1: end_idx = idx + 2000
    snippet = content[idx:end_idx]
    
    # Strip non-ascii chars to avoid printing errors in powershell
    snippet_safe = snippet.encode('ascii', 'ignore').decode('ascii')
    
    # Find action buttons in this snippet
    print(snippet_safe)
else:
    print("Could not find sales-tab")
