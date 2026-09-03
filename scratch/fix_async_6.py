import re
import subprocess
import os

app_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\js\app.js'

with open(app_path, 'r', encoding='utf-8') as f:
    app_content = f.read()

# Fix the trailing }); from the changed forEach loop
old_block = """                    <button class="btn btn-secondary btn-sm view-history-btn" data-id="${credit.id}"><i class="ph ph-clock-counter-clockwise"></i> History</button>
                </td>
            `;
            tbody.appendChild(tr);
        });"""

new_block = """                    <button class="btn btn-secondary btn-sm view-history-btn" data-id="${credit.id}"><i class="ph ph-clock-counter-clockwise"></i> History</button>
                </td>
            `;
            tbody.appendChild(tr);
        }"""

app_content = app_content.replace(old_block, new_block)

with open(app_path, 'w', encoding='utf-8') as f:
    f.write(app_content)

# Check syntax
result = subprocess.run(['node', '-c', app_path], capture_output=True, text=True)
if result.returncode != 0:
    print(f"Error in {app_path}:\n{result.stderr}")
else:
    print(f"{app_path} syntax is OK.")
