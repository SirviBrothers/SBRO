import os

html_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\index.html'

with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

if 'id="migrate-btn"' not in content:
    btn_html = """
<a href="#" class="nav-item" id="migrate-btn" style="background: linear-gradient(135deg, #10b981, #059669); color: white; margin-top: 20px;">
    <i class="ph ph-cloud-arrow-up"></i> Push Local Data to Cloud
</a>
</nav>"""
    
    # We replace the first </nav> that appears after <nav class="nav-menu">
    # Wait, simple string replace of '</nav>' might hit the wrong nav if there are multiple.
    # Looking at the peek output, there is only one nav in the sidebar.
    # We can replace '</nav>\n            </aside>' or similar.
    # Let's just do a specific replace based on the peek output.
    old_end = """<i class="ph ph-wallet"></i> Passbook Ledger
</a>
</nav>"""

    new_end = """<i class="ph ph-wallet"></i> Passbook Ledger
</a>
<a href="#" class="nav-item" id="migrate-btn" style="background: linear-gradient(135deg, #10b981, #059669); color: white; margin-top: 20px;">
    <i class="ph ph-cloud-arrow-up"></i> Push Local Data to Cloud
</a>
</nav>"""
    
    content = content.replace(old_end, new_end)
    
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print("SUCCESS: Injected migrate-btn into index.html")
else:
    print("Button already exists.")
