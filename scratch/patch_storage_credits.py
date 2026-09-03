import os

app_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\js\storage.js'

with open(app_path, 'r', encoding='utf-8') as f:
    content = f.read()

target_get_credits = """    static async getCredits() {
        const sales = await this.getSales();
        return sales.filter(s => s.balance > 0);
    }"""

replacement_get_credits = """    static async getCredits() {
        const sales = await this.getSales();
        const salesCredits = sales.filter(s => s.balance > 0).map(s => ({...s, type: 'Sale'}));
        
        const purchases = await this.getPurchases();
        const purchaseCredits = purchases.filter(p => p.balance > 0).map(p => ({
            ...p, 
            buyerName: p.vendorName, // map for uniform rendering
            type: 'Purchase'
        }));
        
        return [...salesCredits, ...purchaseCredits].sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    static async updateCreditDueDate(id, newDate, type = 'Sale') {
        const table = type === 'Sale' ? 'sales' : 'purchases';
        const { data, error } = await this.client.from(table).select('remarks').eq('id', id).single();
        if (data) {
            let remarks = data.remarks || '';
            remarks = remarks.replace(/DueDate:[\d-]+/, '');
            remarks += ` DueDate:${newDate}`;
            await this.client.from(table).update({ remarks: remarks.trim() }).eq('id', id);
        }
    }
    
    static async markCreditAsPaid(id, date, type = 'Sale') {
        const table = type === 'Sale' ? 'sales' : 'purchases';
        const { data } = await this.client.from(table).select('grand_total, total_amount').eq('id', id).single();
        if (data) {
            const total = data.grand_total || data.total_amount;
            await this.client.from(table).update({ balance: 0, received_amt: total, paid_amount: total }).eq('id', id);
        }
    }
"""

content = content.replace(target_get_credits, replacement_get_credits)

with open(app_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS: Patched storage.js for unified credits")
