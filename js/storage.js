// Supabase Cloud Storage Manager
// Completely replaces localStorage with Supabase async calls

class StorageManager {
    static get client() {
        if (!window.supabaseClient) {
            console.error("Supabase client not initialized.");
        }
        return window.supabaseClient;
    }

    // ==========================================
    // PARTIES (Customers / Vendors)
    // ==========================================
    static async getParties() {
        const { data, error } = await this.client.from('parties').select('*').order('created_at', { ascending: false });
        if (error) console.error("Error fetching parties:", error);
        return data || [];
    }

    static async saveParty(partyData) {
        if (partyData.id) {
            const { error } = await this.client.from('parties').update({
                name: partyData.name,
                mobile: partyData.mobile,
                address: partyData.address,
                gstn: partyData.gstn
            }).eq('id', partyData.id);
            if (error) console.error("Error updating party:", error);
        } else {
            const { error } = await this.client.from('parties').insert([{
                name: partyData.name,
                mobile: partyData.mobile,
                address: partyData.address,
                gstn: partyData.gstn
            }]);
            if (error) console.error("Error creating party:", error);
        }
    }

    static async deleteParty(id) {
        const { error } = await this.client.from('parties').delete().eq('id', id);
        if (error) console.error("Error deleting party:", error);
    }

    static async autoRegisterParty(name, mobile, address, gstn) {
        if (!name) return;
        const { data: existing } = await this.client.from('parties').select('*')
            .or(`mobile.eq.${mobile},name.ilike.${name}`)
            .limit(1);

        if (!existing || existing.length === 0) {
            await this.saveParty({ name, mobile: mobile || '', address: address || '', gstn: gstn || '' });
        } else {
            const p = existing[0];
            let updated = false;
            if (gstn && !p.gstn) { p.gstn = gstn; updated = true; }
            if (mobile && !p.mobile) { p.mobile = mobile; updated = true; }
            if (address && !p.address) { p.address = address; updated = true; }
            if (updated) await this.saveParty(p);
        }
    }

    // ==========================================
    // INVENTORY
    // ==========================================
    
    static async checkStock(category, brand, variant, qty) {
        const inventory = await this.getInventory();
        const items = inventory.filter(i => i.category === category && i.brand === brand && i.variant === variant);
        if (items.length === 0) return false;
        const totalQty = items.reduce((sum, i) => sum + (parseFloat(i.quantity) || 0), 0);
        return totalQty >= qty;
    }
    
    static async getInventory() {
        const { data, error } = await this.client.from('inventory').select('*').order('category', { ascending: true });
        if (error) console.error("Error fetching inventory:", error);
        return data || [];
    }

    static async saveInventoryItem(itemData) {
        if (itemData.id) {
            const { error } = await this.client.from('inventory').update({
                category: itemData.category,
                brand: itemData.brand,
                variant: itemData.variant,
                quantity: parseFloat(itemData.quantity) || 0,
                unit: itemData.unit,
                price: parseFloat(itemData.price) || 0,
                min_stock: parseFloat(itemData.minStock) || 0
            }).eq('id', itemData.id);
            if (error) console.error("Error updating inventory:", error);
        } else {
            const { error } = await this.client.from('inventory').insert([{
                category: itemData.category,
                brand: itemData.brand,
                variant: itemData.variant,
                quantity: parseFloat(itemData.quantity) || 0,
                unit: itemData.unit,
                price: parseFloat(itemData.price) || 0,
                min_stock: parseFloat(itemData.minStock) || 0
            }]);
            if (error) console.error("Error creating inventory:", error);
        }
    }

    static async deleteInventoryItem(id) {
        const { error } = await this.client.from('inventory').delete().eq('id', id);
        if (error) console.error("Error deleting inventory:", error);
    }

    // ==========================================
    // SALES / BILLS
    // ==========================================
    
    static async getCredits() {
        const sales = await this.getSales();
        return sales.filter(s => s.balance > 0);
    }
    
    static async getSales() {
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
    }

    static async saveSale(saleData, isEdit = false) {
        let saleId = saleData.id;

        if (isEdit && saleId) {
            const { error } = await this.client.from('sales').update({
                date: saleData.date,
                buyer_name: saleData.buyerName,
                mobile: saleData.mobile,
                address: saleData.address,
                gstn: saleData.gstn,
                subtotal: saleData.subtotal || saleData.total,
                discount: saleData.discount || 0,
                grand_total: saleData.grandTotal || saleData.total,
                received_amt: saleData.receivedAmt || saleData.paidAmount,
                balance: saleData.balance || saleData.dueAmount,
                payment_mode: saleData.paymentMode || saleData.paymentMethod,
                remarks: saleData.remarks || ''
            }).eq('id', saleId);
            
            // Delete old items and insert new ones
            await this.client.from('sale_items').delete().eq('sale_id', saleId);
        } else {
            const { data, error } = await this.client.from('sales').insert([{
                invoice_no: saleData.invoiceNo,
                date: saleData.date,
                buyer_name: saleData.buyerName,
                mobile: saleData.mobile,
                address: saleData.address,
                gstn: saleData.gstn,
                subtotal: saleData.subtotal || saleData.total,
                discount: saleData.discount || 0,
                grand_total: saleData.grandTotal || saleData.total,
                received_amt: saleData.receivedAmt || saleData.paidAmount,
                balance: saleData.balance || saleData.dueAmount,
                payment_mode: saleData.paymentMode || saleData.paymentMethod,
                remarks: saleData.remarks || ''
            }]).select();
            
            if (error) {
                console.error("Error creating sale:", error);
                return;
            }
            saleId = data[0].id;
        }

        // Insert sale items
        if (saleData.items && saleData.items.length > 0) {
            const itemsToInsert = saleData.items.map(item => ({
                sale_id: saleId,
                category: item.category,
                brand: item.brand,
                variant: item.variant,
                quantity: item.qty,
                unit: item.unit || 'pcs',
                price: item.price,
                total: item.total || item.amount
            }));
            await this.client.from('sale_items').insert(itemsToInsert);
        }

        await this.autoRegisterParty(saleData.buyerName, saleData.mobile, saleData.address, saleData.gstn);
    }

    
    static async deductStock(category, brand, variant, qty) {
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
    }

    static async revertSaleStock(invoiceNo) {
        const sales = await this.getSales();
        const sale = sales.find(s => s.invoice_no === invoiceNo || s.invoiceNo === invoiceNo);
        if (sale && sale.sale_items) {
            for (const item of sale.sale_items) {
                const inventory = await this.getInventory();
                const invItem = inventory.find(i => i.category === item.category && i.brand === item.brand && i.variant === item.variant);
                if (invItem) {
                    await this.client.from('inventory').update({
                        quantity: invItem.quantity + parseFloat(item.quantity)
                    }).eq('id', invItem.id);
                }
            }
        }
    }
    
    
    static async updateCreditStatus(creditId, status) {
        // Mock for now until full credit module is built
        console.log('Update credit status:', creditId, status);
    }
    
    static async getNextInvoiceNo() {
        const { data, error } = await this.client.from('sales')
            .select('invoice_no')
            .order('created_at', { ascending: false })
            .limit(1);
            
        if (data && data.length > 0) {
            const lastNo = data[0].invoice_no;
            const match = lastNo.match(/\d+$/);
            if (match) {
                const nextNum = parseInt(match[0]) + 1;
                return `INV-${new Date().getFullYear()}-${String(nextNum).padStart(4, '0')}`;
            }
        }
        return `INV-${new Date().getFullYear()}-0001`;
    }

    // ==========================================
    // PURCHASES
    // ==========================================
    static async getPurchases() {
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
    }

    static async savePurchase(purchaseData) {
        const { data, error } = await this.client.from('purchases').insert([{
            bill_no: purchaseData.billNo,
            date: purchaseData.date,
            vendor_name: purchaseData.vendorName,
            mobile: purchaseData.mobile,
            total_amount: purchaseData.totalAmount,
            paid_amount: purchaseData.paidAmount,
            balance: purchaseData.balance
        }]).select();

        if (error) {
            console.error("Error saving purchase:", error);
            return;
        }
        const purchaseId = data[0].id;

        if (purchaseData.items && purchaseData.items.length > 0) {
            const itemsToInsert = purchaseData.items.map(item => ({
                purchase_id: purchaseId,
                category: item.category,
                brand: item.brand,
                variant: item.variant,
                quantity: item.qty,
                unit: item.unit,
                price: item.price,
                total: item.total
            }));
            await this.client.from('purchase_items').insert(itemsToInsert);

            // Update inventory quantities
            const inventory = await this.getInventory();
            for (let item of purchaseData.items) {
                const existing = inventory.find(i => 
                    i.category === item.category && 
                    i.brand === item.brand && 
                    i.variant === item.variant
                );
                if (existing) {
                    await this.client.from('inventory').update({
                        quantity: existing.quantity + parseFloat(item.qty)
                    }).eq('id', existing.id);
                } else {
                    await this.client.from('inventory').insert([{
                        category: item.category,
                        brand: item.brand,
                        variant: item.variant,
                        quantity: item.qty,
                        unit: item.unit,
                        price: item.price,
                        min_stock: 0
                    }]);
                }
            }
        }

        await this.autoRegisterParty(purchaseData.vendorName, purchaseData.mobile, '', '');
    }
}
