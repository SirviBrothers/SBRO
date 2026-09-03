import os

storage_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\js\storage.js'

with open(storage_path, 'r', encoding='utf-8') as f:
    storage_content = f.read()

# Fix getSales() mapping
old_get_sales = """    static async getSales() {
        // Fetch sales with their nested items
        const { data, error } = await this.client.from('sales').select(`
            *,
            sale_items (*)
        `).order('created_at', { ascending: false });
        if (error) console.error("Error fetching sales:", error);
        return data || [];
    }"""

new_get_sales = """    static async getSales() {
        // Fetch sales with their nested items
        const { data, error } = await this.client.from('sales').select(`
            *,
            sale_items (*)
        `).order('created_at', { ascending: false });
        
        if (error) {
            console.error("Error fetching sales:", error);
            return [];
        }
        
        return (data || []).map(s => ({
            id: s.id,
            invoiceNo: s.invoice_no,
            date: s.date,
            buyerName: s.buyer_name,
            mobile: s.mobile,
            address: s.address,
            gstn: s.gstn,
            subtotal: s.subtotal,
            discount: s.discount,
            grandTotal: s.grand_total,
            total: s.grand_total,
            receivedAmt: s.received_amt,
            dueAmount: s.balance,
            balance: s.balance,
            paymentMethod: s.payment_mode,
            remarks: s.remarks,
            items: (s.sale_items || []).map(i => ({
                id: i.id,
                category: i.category,
                brand: i.brand,
                variant: i.variant,
                qty: i.quantity,
                unit: i.unit,
                price: i.price,
                total: i.total
            }))
        }));
    }"""

storage_content = storage_content.replace(old_get_sales, new_get_sales)

# Fix getPurchases() mapping
old_get_purchases = """    static async getPurchases() {
        const { data, error } = await this.client.from('purchases').select(`
            *,
            purchase_items (*)
        `).order('created_at', { ascending: false });
        if (error) console.error("Error fetching purchases:", error);
        return data || [];
    }"""

new_get_purchases = """    static async getPurchases() {
        const { data, error } = await this.client.from('purchases').select(`
            *,
            purchase_items (*)
        `).order('created_at', { ascending: false });
        
        if (error) {
            console.error("Error fetching purchases:", error);
            return [];
        }
        
        return (data || []).map(p => ({
            id: p.id,
            billNo: p.bill_no,
            date: p.date,
            vendorName: p.vendor_name,
            mobile: p.mobile,
            totalAmount: p.total_amount,
            total: p.total_amount,
            paidAmount: p.paid_amount,
            balance: p.balance,
            items: (p.purchase_items || []).map(i => ({
                id: i.id,
                category: i.category,
                brand: i.brand,
                variant: i.variant,
                qty: i.quantity,
                unit: i.unit,
                price: i.price,
                total: i.total
            }))
        }));
    }"""

storage_content = storage_content.replace(old_get_purchases, new_get_purchases)

with open(storage_path, 'w', encoding='utf-8') as f:
    f.write(storage_content)
    
print("SUCCESS: Fixed data mapping for sales and purchases.")
