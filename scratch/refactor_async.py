import re
import os

app_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\js\app.js'
inv_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\js\inventory.js'
storage_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\js\storage.js'

# 1. Add getCredits() to storage.js if missing
with open(storage_path, 'r', encoding='utf-8') as f:
    storage_content = f.read()

if 'static async getCredits()' not in storage_content:
    credits_method = """
    static async getCredits() {
        const sales = await this.getSales();
        return sales.filter(s => s.balance > 0);
    }
    """
    storage_content = storage_content.replace('static async getSales()', credits_method + '\n    static async getSales()')
    with open(storage_path, 'w', encoding='utf-8') as f:
        f.write(storage_content)


def refactor_file(filepath):
    if not os.path.exists(filepath): return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add await to StorageManager calls
    content = re.sub(r'(?<!await )StorageManager\.', 'await StorageManager.', content)

    # Now we must make sure the functions containing these are async.
    # 1. document.addEventListener('DOMContentLoaded', () => { -> async () => {
    content = content.replace("document.addEventListener('DOMContentLoaded', () => {", "document.addEventListener('DOMContentLoaded', async () => {")
    content = content.replace("document.addEventListener('DOMContentLoaded', function() {", "document.addEventListener('DOMContentLoaded', async function() {")

    # 2. Named functions that call StorageManager (like renderHomeDashboard, renderSalesTable, etc.)
    # List of known functions in app.js that need to be async
    funcs_to_async = [
        'renderHomeDashboard', 'renderSalesTable', 'renderCreditTable', 
        'renderInventoryTable', 'renderPartiesTable', 'renderPurchaseHistoryTable',
        'updateTotalDisplay', 'addBillItemToTable', 'saveBill', 'updateGlobalStock',
        'updateInventoryTable'
    ]
    for func in funcs_to_async:
        content = re.sub(rf'function {func}\s*\(', f'async function {func}(', content)

    # 3. Fix event listeners that contain await (button clicks)
    # This is tricky with regex, but most are: .addEventListener('click', () => {
    # We can just blindly replace all event listeners that have `await` inside them? No.
    # Let's replace common ones.
    content = content.replace("addEventListener('click', () => {", "addEventListener('click', async () => {")
    content = content.replace("addEventListener('click', (e) => {", "addEventListener('click', async (e) => {")
    content = content.replace("addEventListener('change', () => {", "addEventListener('change', async () => {")
    content = content.replace("addEventListener('change', (e) => {", "addEventListener('change', async (e) => {")
    content = content.replace("addEventListener('input', () => {", "addEventListener('input', async () => {")
    content = content.replace("addEventListener('input', (e) => {", "addEventListener('input', async (e) => {")
    
    # 4. Remove duplicate async if it happened
    content = content.replace("async async", "async")

    # 5. LocalStorage leftover migrations:
    # app.js line 41 has: localStorage.setItem('sb_inventory_v2', JSON.stringify(inventory));
    # We should comment out direct localStorage calls since we use Supabase now.
    content = re.sub(r'localStorage\.setItem\(.*?\);', '// localStorage.setItem disabled for Supabase', content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

refactor_file(app_path)
refactor_file(inv_path)

print("SUCCESS: Refactored app.js and inventory.js to use async/await.")
