// Supabase Cloud Storage Manager
// Completely replaces localStorage with Supabase async calls and handles credit payments & RLS

class StorageManager {
    static get client() {
        if (!window.supabaseClient) {
            const fallbackUrl = 'https://ztlrayekobgcllnxmqft.supabase.co';
            const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0bHJheWVrb2JnY2xsbnhtcWZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNzc4NTIsImV4cCI6MjEwMzk1Mzg1Mn0.SCv_r5KOQIN0RTvEEQrZLCOGaaneWsPlJuIMnyxYXkE';
            if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
                const url = (window.__ENV__ && window.__ENV__.SUPABASE_URL) || fallbackUrl;
                const key = (window.__ENV__ && window.__ENV__.SUPABASE_ANON_KEY) || fallbackKey;
                window.supabaseClient = window.supabase.createClient(url, key);
            }
        }
        return window.supabaseClient || null;
    }

    // ==========================================
    // PARTIES (Customers / Vendors)
    // ==========================================
    static async getParties() {
        if (!this.client) return [];
        try {
            const { data, error } = await this.client.from('parties').select('*').order('created_at', { ascending: false });
            if (error) console.error("Error fetching parties:", error);
            return data || [];
        } catch (e) {
            console.error("Error fetching parties:", e);
            return [];
        }
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
        if (items.length === 0) {
            // Item not yet registered in inventory; return true if inventory is empty to allow billing
            if (inventory.length === 0) return true;
            return false;
        }
        const totalQty = items.reduce((sum, i) => sum + (parseFloat(i.quantity) || 0), 0);
        return totalQty >= qty;
    }
    
    static async getInventory() {
        if (!this.client) return [];
        try {
            const { data, error } = await this.client.from('inventory').select('*').order('category', { ascending: true });
            if (error) console.error("Error fetching inventory:", error);
            return data || [];
        } catch (e) {
            console.error("Error fetching inventory:", e);
            return [];
        }
    }

    static async saveInventoryItem(itemData) {
        if (itemData.id) {
            const updatePayload = {
                category: itemData.category,
                brand: itemData.brand,
                variant: itemData.variant,
                quantity: parseFloat(itemData.quantity) || 0,
                unit: itemData.unit || 'pcs',
                price: parseFloat(itemData.price) || 0,
                min_stock: parseFloat(itemData.minStock || itemData.min_stock) || 0
            };
            const { error } = await this.client.from('inventory').update(updatePayload).eq('id', itemData.id);
            if (error) console.error("Error updating inventory:", error);
        } else {
            const insertPayload = {
                category: itemData.category,
                brand: itemData.brand,
                variant: itemData.variant,
                quantity: parseFloat(itemData.quantity) || 0,
                unit: itemData.unit || 'pcs',
                price: parseFloat(itemData.price) || 0,
                min_stock: parseFloat(itemData.minStock || itemData.min_stock) || 0
            };
            const { error } = await this.client.from('inventory').insert([insertPayload]);
            if (error) console.error("Error creating inventory:", error);
        }
    }

    static async deleteInventoryItem(id) {
        const { error } = await this.client.from('inventory').delete().eq('id', id);
        if (error) console.error("Error deleting inventory:", error);
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
        const sale = sales.find(s => s.invoiceNo === invoiceNo);
        if (sale && sale.items) {
            for (const item of sale.items) {
                const inventory = await this.getInventory();
                const invItem = inventory.find(i => i.category === item.category && i.brand === item.brand && i.variant === item.variant);
                if (invItem) {
                    await this.client.from('inventory').update({
                        quantity: parseFloat(invItem.quantity) + (parseFloat(item.qty) || 0)
                    }).eq('id', invItem.id);
                }
            }
        }
    }

    // ==========================================
    // SALES / BILLS
    // ==========================================
    static async getSales() {
        if (!this.client) return [];
        let data, error;
        try {
            const res = await this.client.from('sales').select(`
                *,
                sale_items (*)
            `).order('created_at', { ascending: false });
            data = res.data;
            error = res.error;
        } catch (e) {
            console.error("Exception in getSales:", e);
            return [];
        }
        
        if (error) {
            console.error("Error fetching sales:", error);
            return [];
        }
        
        return (data || []).map(s => {
            let dueDate = s.due_date || '';
            let isGstBill = false;
            let gstRate = 0;

            if (s.remarks) {
                const match = s.remarks.match(/DueDate:([^\s]+)/);
                if (match) dueDate = match[1];

                const gstMatch = s.remarks.match(/GST:([0-9.]+)%/);
                if (gstMatch) {
                    isGstBill = true;
                    gstRate = parseFloat(gstMatch[1]) || 0;
                }
            }
            if (!dueDate && s.balance > 0 && s.date) {
                // Default due date to 30 days after sale date
                const d = new Date(s.date);
                d.setDate(d.getDate() + 30);
                dueDate = d.toISOString().split('T')[0];
            }

            const grandTotal = parseFloat(s.grand_total) || 0;
            const receivedAmt = parseFloat(s.received_amt) || 0;
            const balance = parseFloat(s.balance) || Math.max(0, grandTotal - receivedAmt);

            return {
                id: s.id,
                invoiceNo: s.invoice_no,
                date: s.date,
                buyerName: s.buyer_name,
                mobile: s.mobile,
                address: s.address || '',
                gstn: s.gstn || '',
                subtotal: parseFloat(s.subtotal) || grandTotal,
                discount: parseFloat(s.discount) || 0,
                grandTotal: grandTotal,
                total: grandTotal,
                receivedAmt: receivedAmt,
                paidAmount: receivedAmt,
                dueAmount: balance,
                balance: balance,
                dueDate: dueDate,
                isGstBill: isGstBill,
                gstRate: gstRate,
                paymentMethod: s.payment_mode || (balance > 0 ? 'Credit' : 'Cash/Online'),
                status: balance <= 0 ? 'Paid' : 'Pending',
                remarks: s.remarks || '',
                items: (s.sale_items || []).map(i => {
                    const price = parseFloat(i.price) || 0;
                    const qty = parseFloat(i.quantity) || 0;
                    const total = parseFloat(i.total) || (price * qty);
                    return {
                        id: i.id,
                        category: i.category,
                        brand: i.brand,
                        variant: i.variant,
                        hsn: i.hsn || '',
                        qty: qty,
                        unit: i.unit || 'pcs',
                        price: price,
                        total: total,
                        amount: total // map both total and amount for PDF/WhatsApp compatibility
                    };
                })
            };
        });
    }

    static async saveSale(saleData, isEdit = false) {
        let saleId = saleData.id;
        const total = parseFloat(saleData.total || saleData.grandTotal) || 0;
        const paid = parseFloat(saleData.paidAmount || saleData.receivedAmt) || 0;
        const due = parseFloat(saleData.dueAmount || saleData.balance) || Math.max(0, total - paid);
        
        let remarks = (saleData.remarks || '').trim();
        if (saleData.dueDate) {
            remarks = remarks.replace(/DueDate:[^\s]+/, '').trim();
            remarks = (remarks ? remarks + ' ' : '') + `DueDate:${saleData.dueDate}`;
        }
        if (saleData.isGstBill) {
            remarks = remarks.replace(/GST:[0-9.]+%/g, '').trim();
            remarks = (remarks ? remarks + ' ' : '') + `GST:${saleData.gstRate || 0}%`;
        }

        const salePayload = {
            date: saleData.date,
            buyer_name: saleData.buyerName,
            mobile: saleData.mobile,
            address: saleData.address || '',
            gstn: saleData.gstn || '',
            subtotal: parseFloat(saleData.subtotal) || total,
            discount: parseFloat(saleData.discount) || 0,
            grand_total: total,
            received_amt: paid,
            balance: due,
            payment_mode: saleData.paymentMethod || saleData.payment_mode || (due > 0 ? 'Credit' : 'Cash/Online'),
            remarks: remarks
        };

        if (isEdit && saleId) {
            const { error } = await this.client.from('sales').update(salePayload).eq('id', saleId);
            if (error) console.error("Error updating sale:", error);
            await this.client.from('sale_items').delete().eq('sale_id', saleId);
        } else {
            salePayload.invoice_no = saleData.invoiceNo;
            const { data, error } = await this.client.from('sales').insert([salePayload]).select();
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
                quantity: parseFloat(item.qty) || 0,
                unit: item.unit || 'pcs',
                price: parseFloat(item.price) || 0,
                total: parseFloat(item.amount || item.total) || (parseFloat(item.price) * parseFloat(item.qty))
            }));
            await this.client.from('sale_items').insert(itemsToInsert);
        }

        await this.autoRegisterParty(saleData.buyerName, saleData.mobile, saleData.address, saleData.gstn);
    }

    static async getNextInvoiceNo() {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const prefix = `SB-${yy}-${mm}-`;
        
        if (!this.client) return `${prefix}00001`;

        try {
            const { data, error } = await this.client.from('sales')
                .select('invoice_no')
                .order('created_at', { ascending: false })
                .limit(50);
                
            if (data && data.length > 0) {
                let maxSeq = 0;
                for (const row of data) {
                    if (row.invoice_no && row.invoice_no.startsWith(prefix)) {
                        const numPart = row.invoice_no.slice(prefix.length);
                        const num = parseInt(numPart, 10);
                        if (!isNaN(num) && num > maxSeq) {
                            maxSeq = num;
                        }
                    }
                }
                if (maxSeq > 0) {
                    return `${prefix}${String(maxSeq + 1).padStart(5, '0')}`;
                }
            }
        } catch (e) {
            console.error("Error generating invoice number:", e);
        }
        return `${prefix}00001`;
    }

    // ==========================================
    // PURCHASES
    // ==========================================
    static async getPurchases() {
        if (!this.client) return [];
        let data, error;
        try {
            const res = await this.client.from('purchases').select(`
                *,
                purchase_items (*)
            `).order('created_at', { ascending: false });
            data = res.data;
            error = res.error;
        } catch (e) {
            console.error("Exception in getPurchases:", e);
            return [];
        }
        
        if (error) {
            console.error("Error fetching purchases:", error);
            return [];
        }
        
        return (data || []).map(p => {
            const total = parseFloat(p.total_amount) || 0;
            const paid = parseFloat(p.paid_amount) || 0;
            const balance = parseFloat(p.balance) || Math.max(0, total - paid);
            
            let dueDate = p.due_date || '';
            if (!dueDate && p.remarks) {
                const match = p.remarks.match(/DueDate:([^\s]+)/);
                if (match) dueDate = match[1];
            }
            if (!dueDate && balance > 0 && p.date) {
                const d = new Date(p.date);
                d.setDate(d.getDate() + 30);
                dueDate = d.toISOString().split('T')[0];
            }

            return {
                id: p.id,
                billNo: p.bill_no || 'BILL-' + (p.id ? String(p.id).slice(-4) : '0000'),
                date: p.date,
                vendorName: p.vendor_name,
                mobile: p.mobile,
                gstn: p.gstn || '',
                totalAmount: total,
                total: total,
                paidAmount: paid,
                balance: balance,
                dueDate: dueDate,
                status: balance <= 0 ? 'Paid' : 'Pending',
                remarks: p.remarks || '',
                items: (p.purchase_items || []).map(i => ({
                    id: i.id,
                    category: i.category,
                    brand: i.brand,
                    variant: i.variant,
                    qty: parseFloat(i.quantity) || 0,
                    unit: i.unit || 'pcs',
                    price: parseFloat(i.price) || 0,
                    total: parseFloat(i.total) || 0,
                    amount: parseFloat(i.total) || 0
                }))
            };
        });
    }

    static async savePurchase(purchaseData) {
        const billNo = purchaseData.billNo || ('BILL-' + Date.now().toString().slice(-6));
        const total = parseFloat(purchaseData.totalAmount) || 0;
        const paid = parseFloat(purchaseData.paidAmount) || 0;
        const balance = parseFloat(purchaseData.balance) || Math.max(0, total - paid);

        const { data, error } = await this.client.from('purchases').insert([{
            bill_no: billNo,
            date: purchaseData.date,
            vendor_name: purchaseData.vendorName,
            mobile: purchaseData.mobile || '',
            total_amount: total,
            paid_amount: paid,
            balance: balance
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
                quantity: parseFloat(item.qty) || 0,
                unit: item.unit || 'pcs',
                price: parseFloat(item.price) || 0,
                total: (parseFloat(item.price) || 0) * (parseFloat(item.qty) || 0)
            }));
            await this.client.from('purchase_items').insert(itemsToInsert);

            // Automatically increase inventory stock
            const inventory = await this.getInventory();
            for (let item of purchaseData.items) {
                const cat = (item.category || '').trim().toLowerCase();
                const brd = (item.brand || '').trim().toLowerCase();
                const varnt = (item.variant || '').trim().toLowerCase();
                const qty = parseFloat(item.qty) || 0;
                const price = parseFloat(item.price) || 0;

                const existing = inventory.find(i => 
                    (i.category || '').trim().toLowerCase() === cat && 
                    (i.brand || '').trim().toLowerCase() === brd && 
                    (i.variant || '').trim().toLowerCase() === varnt
                );
                if (existing) {
                    await this.client.from('inventory').update({
                        quantity: (parseFloat(existing.quantity) || 0) + qty
                    }).eq('id', existing.id);
                } else {
                    await this.client.from('inventory').insert([{
                        category: (item.category || '').trim(),
                        brand: (item.brand || '').trim(),
                        variant: (item.variant || '').trim(),
                        quantity: qty,
                        unit: item.unit || 'pcs',
                        price: price,
                        min_stock: 0
                    }]);
                }
            }
        }

        await this.autoRegisterParty(purchaseData.vendorName, purchaseData.mobile, '', purchaseData.gstn);
    }

    // ==========================================
    // CREDITS & PAYMENTS (KHATA)
    // ==========================================
    static async getCreditPayments(creditId = null) {
        try {
            let query = this.client.from('credit_payments').select('*').order('payment_date', { ascending: true });
            if (creditId) {
                query = query.eq('credit_id', creditId);
            }
            const { data, error } = await query;
            if (error) {
                // Table might not exist yet before migration
                return [];
            }
            return (data || []).map(p => ({
                id: p.id,
                creditId: p.credit_id,
                referenceNo: p.reference_no,
                partyName: p.party_name,
                partyType: p.party_type,
                amount: parseFloat(p.amount) || 0,
                date: p.payment_date,
                paymentMode: p.payment_mode || 'Cash',
                remarks: p.remarks || ''
            }));
        } catch (e) {
            console.warn("Could not fetch credit_payments:", e);
            return [];
        }
    }

    static async getCredits() {
        const [sales, purchases, allPayments, parties] = await Promise.all([
            this.getSales(),
            this.getPurchases(),
            this.getCreditPayments(),
            this.getParties()
        ]);

        const partyAddressMap = new Map();
        parties.forEach(p => {
            if (p.name && p.address) partyAddressMap.set(p.name.toLowerCase().trim(), p.address);
            if (p.mobile && p.address) partyAddressMap.set(p.mobile.trim(), p.address);
        });

        const salesCredits = sales.filter(s => s.balance > 0 || (s.paymentMethod === 'Credit')).map(s => {
            const payments = allPayments.filter(p => String(p.creditId) === String(s.id));
            const totalPaid = (s.paidAmount || 0) + payments.reduce((sum, p) => sum + p.amount, 0);
            const remaining = Math.max(0, s.total - totalPaid);
            const addr = s.address || partyAddressMap.get((s.buyerName || '').toLowerCase().trim()) || partyAddressMap.get((s.mobile || '').trim()) || '';
            return {
                ...s,
                type: 'Sale',
                address: addr,
                payments: payments,
                originalDue: s.total,
                balance: remaining,
                dueAmount: remaining,
                status: remaining <= 0 ? 'Paid' : 'Pending'
            };
        });
        
        const purchaseCredits = purchases.filter(p => p.balance > 0).map(p => {
            const payments = allPayments.filter(pay => String(pay.creditId) === String(p.id));
            const totalPaid = (p.paidAmount || 0) + payments.reduce((sum, pay) => sum + pay.amount, 0);
            const remaining = Math.max(0, p.total - totalPaid);
            const addr = p.address || partyAddressMap.get((p.vendorName || '').toLowerCase().trim()) || partyAddressMap.get((p.mobile || '').trim()) || '';
            return {
                ...p,
                buyerName: p.vendorName,
                address: addr,
                type: 'Purchase',
                payments: payments,
                originalDue: p.total,
                balance: remaining,
                dueAmount: remaining,
                status: remaining <= 0 ? 'Paid' : 'Pending'
            };
        });
        
        return [...salesCredits, ...purchaseCredits].sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    static async addPaymentToCredit(creditId, amount, date, paymentMode = 'Cash', remarks = '') {
        const numAmount = parseFloat(amount) || 0;
        if (numAmount <= 0) return;

        // 1. Locate credit in sales or purchases
        let isSale = true;
        let { data: creditRow, error } = await this.client.from('sales').select('*').eq('id', creditId).single();
        if (!creditRow || error) {
            isSale = false;
            const res = await this.client.from('purchases').select('*').eq('id', creditId).single();
            creditRow = res.data;
        }

        if (!creditRow) {
            console.error("Credit not found for id:", creditId);
            return;
        }

        const table = isSale ? 'sales' : 'purchases';
        const currentBalance = parseFloat(creditRow.balance) || 0;
        const currentReceived = parseFloat(isSale ? creditRow.received_amt : creditRow.paid_amount) || 0;
        const newBalance = Math.max(0, currentBalance - numAmount);
        const newReceived = currentReceived + numAmount;

        // 2. Update table balance
        if (isSale) {
            await this.client.from('sales').update({
                balance: newBalance,
                received_amt: newReceived
            }).eq('id', creditId);
        } else {
            await this.client.from('purchases').update({
                balance: newBalance,
                paid_amount: newReceived
            }).eq('id', creditId);
        }

        // 3. Log to credit_payments
        try {
            await this.client.from('credit_payments').insert([{
                credit_id: creditId,
                reference_no: isSale ? creditRow.invoice_no : creditRow.bill_no,
                party_name: isSale ? creditRow.buyer_name : creditRow.vendor_name,
                party_type: isSale ? 'Customer' : 'Vendor',
                amount: numAmount,
                payment_date: date || new Date().toISOString().split('T')[0],
                payment_mode: paymentMode,
                remarks: remarks
            }]);
        } catch (e) {
            console.warn("Could not insert credit_payment row:", e);
        }
    }

    static async removePaymentFromCredit(creditId, paymentIndexOrId) {
        // Find payment to remove
        const payments = await this.getCreditPayments(creditId);
        let paymentToRemove = null;
        if (typeof paymentIndexOrId === 'number' && payments[paymentIndexOrId]) {
            paymentToRemove = payments[paymentIndexOrId];
        } else {
            paymentToRemove = payments.find(p => String(p.id) === String(paymentIndexOrId));
        }

        if (!paymentToRemove) return;

        const amount = paymentToRemove.amount;

        // Revert balance on sale/purchase
        let isSale = true;
        let { data: creditRow } = await this.client.from('sales').select('*').eq('id', creditId).single();
        if (!creditRow) {
            isSale = false;
            const res = await this.client.from('purchases').select('*').eq('id', creditId).single();
            creditRow = res.data;
        }

        if (creditRow) {
            const currentBalance = parseFloat(creditRow.balance) || 0;
            const currentReceived = parseFloat(isSale ? creditRow.received_amt : creditRow.paid_amount) || 0;
            const newBalance = currentBalance + amount;
            const newReceived = Math.max(0, currentReceived - amount);

            if (isSale) {
                await this.client.from('sales').update({ balance: newBalance, received_amt: newReceived }).eq('id', creditId);
            } else {
                await this.client.from('purchases').update({ balance: newBalance, paid_amount: newReceived }).eq('id', creditId);
            }
        }

        // Delete payment row
        try {
            await this.client.from('credit_payments').delete().eq('id', paymentToRemove.id);
        } catch (e) {
            console.warn("Could not delete from credit_payments:", e);
        }
    }

    static async updateCreditDueDate(id, newDate, type = 'Sale') {
        const table = type === 'Sale' ? 'sales' : 'purchases';
        const { data } = await this.client.from(table).select('remarks').eq('id', id).single();
        if (data) {
            let remarks = data.remarks || '';
            remarks = remarks.replace(/DueDate:[^\s]+/, '').trim();
            remarks = (remarks ? remarks + ' ' : '') + `DueDate:${newDate}`;
            await this.client.from(table).update({ remarks: remarks.trim() }).eq('id', id);
        }
    }
    
    static async markCreditAsPaid(id, date, type = 'Sale') {
        if (type === 'Sale') {
            const { data } = await this.client.from('sales').select('grand_total, buyer_name, invoice_no, balance').eq('id', id).single();
            if (data) {
                const total = parseFloat(data.grand_total) || 0;
                const remaining = parseFloat(data.balance) || total;
                await this.client.from('sales').update({ balance: 0, received_amt: total }).eq('id', id);
                if (remaining > 0) {
                    try {
                        await this.client.from('credit_payments').insert([{
                            credit_id: id,
                            reference_no: data.invoice_no,
                            party_name: data.buyer_name,
                            party_type: 'Customer',
                            amount: remaining,
                            payment_date: date || new Date().toISOString().split('T')[0],
                            payment_mode: 'Cash',
                            remarks: 'Full Settlement'
                        }]);
                    } catch (e) {}
                }
            }
        } else {
            const { data } = await this.client.from('purchases').select('total_amount, vendor_name, bill_no, balance').eq('id', id).single();
            if (data) {
                const total = parseFloat(data.total_amount) || 0;
                const remaining = parseFloat(data.balance) || total;
                await this.client.from('purchases').update({ balance: 0, paid_amount: total }).eq('id', id);
                if (remaining > 0) {
                    try {
                        await this.client.from('credit_payments').insert([{
                            credit_id: id,
                            reference_no: data.bill_no,
                            party_name: data.vendor_name,
                            party_type: 'Vendor',
                            amount: remaining,
                            payment_date: date || new Date().toISOString().split('T')[0],
                            payment_mode: 'Cash',
                            remarks: 'Full Settlement'
                        }]);
                    } catch (e) {}
                }
            }
        }
    }

    static async updateCreditBalance(creditId, newBalance, type = 'Sale') {
        const bal = Math.max(0, parseFloat(newBalance) || 0);
        const isSale = type === 'Sale';
        const table = isSale ? 'sales' : 'purchases';
        
        if (!this.client) return;
        try {
            const { data, error } = await this.client.from(table).select('*').eq('id', creditId).single();
            if (data) {
                const total = parseFloat(isSale ? data.grand_total : data.total_amount) || 0;
                const updatedReceived = Math.max(0, total - bal);
                if (isSale) {
                    await this.client.from('sales').update({
                        balance: bal,
                        received_amt: updatedReceived
                    }).eq('id', creditId);
                } else {
                    await this.client.from('purchases').update({
                        balance: bal,
                        paid_amount: updatedReceived
                    }).eq('id', creditId);
                }
            }
        } catch (e) {
            console.error("Error updating credit balance:", e);
        }
    }

    static async updateCreditStatus(creditId, status) {
        if (status === 'Paid') {
            await this.markCreditAsPaid(creditId, new Date().toISOString().split('T')[0]);
        }
    }
}
