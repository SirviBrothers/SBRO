import os

html_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\index.html'

with open(html_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if '<nav class="nav-menu">' in line:
        # We found the nav. Now find the closing </nav>
        for j in range(i, len(lines)):
            if '</nav>' in lines[j]:
                # Found it. Insert before this line.
                btn_lines = [
                    '            <a href="#" class="nav-item" id="migrate-btn" style="background: linear-gradient(135deg, #10b981, #059669); color: white; margin-top: 20px;">\n',
                    '                <i class="ph ph-cloud-arrow-up"></i> Push Local Data to Cloud\n',
                    '            </a>\n'
                ]
                lines = lines[:j] + btn_lines + lines[j:]
                break
        break

with open(html_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)
    
print("SUCCESS: Forced injection of migrate-btn")
