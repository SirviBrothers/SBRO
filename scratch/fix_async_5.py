import re
import subprocess
import os

app_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\js\app.js'
storage_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\js\storage.js'

# 1. Add updateCreditStatus to storage.js
with open(storage_path, 'r', encoding='utf-8') as f:
    storage_content = f.read()

if 'static async updateCreditStatus(' not in storage_content:
    extra_methods = """
    static async updateCreditStatus(creditId, status) {
        // Mock for now until full credit module is built
        console.log('Update credit status:', creditId, status);
    }
    """
    storage_content = storage_content.replace('static async getNextInvoiceNo() {', extra_methods + '\n    static async getNextInvoiceNo() {')
    with open(storage_path, 'w', encoding='utf-8') as f:
        f.write(storage_content)


# 2. Fix app.js forEach loop
with open(app_path, 'r', encoding='utf-8') as f:
    app_content = f.read()

# Fix the forEach await syntax error in renderCreditTable
old_loop = """        credits.slice().reverse().forEach(credit => {"""
new_loop = """        for (const credit of credits.slice().reverse()) {"""
app_content = app_content.replace(old_loop, new_loop)

# Let's replace the closing braces of the forEach block to just a standard `}`
# Since we replaced the top line, the bottom line is `});`. We need to change the first `});` after that loop.
# It's safer to use regex to find `});` specifically associated with this loop, or just replace `        });` with `        }`.
# Let's just find the exact block and replace the end.
old_block = """                        <button class="btn btn-secondary btn-sm edit-date-btn" data-id="${credit.id}">Edit Date</button>
                    ` : ''}
                </td>
            `;
            tbody.appendChild(tr);
        });"""
new_block = """                        <button class="btn btn-secondary btn-sm edit-date-btn" data-id="${credit.id}">Edit Date</button>
                    ` : ''}
                </td>
            `;
            tbody.appendChild(tr);
        }"""
app_content = app_content.replace(old_block, new_block)


# Let's also check for other forEach loops containing await
# Searching for `.forEach(.*?=>.*?await` is a good idea.
if 'forEach' in app_content and 'await' in app_content:
    # We will just rely on node -c to catch them since manual regex is hard for this.
    pass

with open(app_path, 'w', encoding='utf-8') as f:
    f.write(app_content)

# Check syntax
result = subprocess.run(['node', '-c', app_path], capture_output=True, text=True)
if result.returncode != 0:
    print(f"Error in {app_path}:\n{result.stderr}")
else:
    print(f"{app_path} syntax is OK.")
