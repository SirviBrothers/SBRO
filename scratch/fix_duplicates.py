import os
import re

app_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\js\app.js'
storage_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\js\storage.js'

# 1. Fix app.js dropdown duplication
with open(app_path, 'r', encoding='utf-8') as f:
    app_content = f.read()

old_dropdown_logic = """                const variants = inventory.filter(i => i.category === cat && i.brand === brand);
                variants.forEach(v => {
                    varSelect.innerHTML += `<option value="${v.variant}">${v.variant} (Stock: ${v.quantity})</option>`;
                });"""

new_dropdown_logic = """                const variants = inventory.filter(i => i.category === cat && i.brand === brand);
                const uniqueVariants = {};
                variants.forEach(v => {
                    if (!uniqueVariants[v.variant]) uniqueVariants[v.variant] = { ...v, quantity: 0 };
                    uniqueVariants[v.variant].quantity += parseFloat(v.quantity) || 0;
                });
                Object.values(uniqueVariants).forEach(v => {
                    varSelect.innerHTML += `<option value="${v.variant}">${v.variant} (Stock: ${v.quantity})</option>`;
                });"""

app_content = app_content.replace(old_dropdown_logic, new_dropdown_logic)

with open(app_path, 'w', encoding='utf-8') as f:
    f.write(app_content)


# 2. Fix storage.js checkStock and deductStock to sum quantities
with open(storage_path, 'r', encoding='utf-8') as f:
    storage_content = f.read()

old_check_stock = """    static async checkStock(category, brand, variant, qty) {
        const inventory = await this.getInventory();
        const item = inventory.find(i => i.category === category && i.brand === brand && i.variant === variant);
        if (!item) return false;
        return item.quantity >= qty;
    }"""

new_check_stock = """    static async checkStock(category, brand, variant, qty) {
        const inventory = await this.getInventory();
        const items = inventory.filter(i => i.category === category && i.brand === brand && i.variant === variant);
        if (items.length === 0) return false;
        const totalQty = items.reduce((sum, i) => sum + (parseFloat(i.quantity) || 0), 0);
        return totalQty >= qty;
    }"""

storage_content = storage_content.replace(old_check_stock, new_check_stock)

# Deduct stock must deduct from matching items in order until fulfilled
old_deduct_stock = """    static async deductStock(category, brand, variant, qty) {
        const inventory = await this.getInventory();
        const item = inventory.find(i => i.category === category && i.brand === brand && i.variant === variant);
        if (item) {
            await this.client.from('inventory').update({
                quantity: item.quantity - parseFloat(qty)
            }).eq('id', item.id);
        }
    }"""

new_deduct_stock = """    static async deductStock(category, brand, variant, qty) {
        const inventory = await this.getInventory();
        const items = inventory.filter(i => i.category === category && i.brand === brand && i.variant === variant);
        let remainingToDeduct = parseFloat(qty) || 0;
        
        for (const item of items) {
            if (remainingToDeduct <= 0) break;
            const itemQty = parseFloat(item.quantity) || 0;
            const deductFromThis = Math.min(itemQty, remainingToDeduct);
            
            if (deductFromThis > 0) {
                await this.client.from('inventory').update({
                    quantity: itemQty - deductFromThis
                }).eq('id', item.id);
                remainingToDeduct -= deductFromThis;
            }
        }
        
        // If there's still remainder (meaning they forced deduction below 0), subtract from the first item
        if (remainingToDeduct > 0 && items.length > 0) {
            const firstItem = items[0];
            const itemQty = parseFloat(firstItem.quantity) || 0;
            await this.client.from('inventory').update({
                quantity: itemQty - remainingToDeduct
            }).eq('id', firstItem.id);
        }
    }"""

storage_content = storage_content.replace(old_deduct_stock, new_deduct_stock)

with open(storage_path, 'w', encoding='utf-8') as f:
    f.write(storage_content)
    
print("SUCCESS: Fixed app.js dropdown duplication and storage.js check/deduct stock logic.")

