import re
import subprocess

app_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\js\app.js'
inv_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\js\inventory.js'

def make_async(filepath, func_names):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for func in func_names:
        # function createRow( -> async function createRow(
        content = re.sub(rf'function {func}\s*\(', f'async function {func}(', content)
        # const createRow = ( -> const createRow = async (
        content = re.sub(rf'const {func}\s*=\s*\(', f'const {func} = async (', content)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

# Make these functions async
make_async(app_path, [
    'createRow', 'populateFormForEdit', 'populatePurchaseFormForEdit',
    'handlePurchaseRowChange', 'createPurchaseRow'
])

# Also we need to fix any places that call these functions to await them if necessary
# Actually, for UI event listeners, they don't need to await them, the promise will just resolve in the background and update the DOM.

# Let's run node -c to see if there are more errors
def check_syntax(file):
    result = subprocess.run(['node', '-c', file], capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error in {file}:\n{result.stderr}")
    else:
        print(f"{file} syntax is OK.")

check_syntax(app_path)
check_syntax(inv_path)
