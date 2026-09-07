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

    static async increaseStock(category, brand, variant, qty, unit = 'pcs', price = 0) {
        if (!this.client) return;
        const cat = (category || '').trim();
        const brd = (brand || '').trim();
        const varnt = (variant || '').trim();
        const addQty = parseFloat(qty) || 0;
        if (addQty <= 0) return;

        const inventory = await this.getInventory();
        const matchingItems = inventory.filter(i => 
            (i.category || '').trim().toLowerCase() === cat.toLowerCase() &&
            (i.brand || '').trim().toLowerCase() === brd.toLowerCase() &&
            (i.variant || '').trim().toLowerCase() === varnt.toLowerCase()
        );

        if (matchingItems.length > 0) {
            const canonical = matchingItems[0];
            const currentTotal = matchingItems.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
            const newQty = currentTotal + addQty;
            
            const updatePayload = { quantity: newQty };
            if (parseFloat(price) > 0) updatePayload.price = parseFloat(price);

            const { error } = await this.client.from('inventory').update(updatePayload).eq('id', canonical.id);
            if (error) console.error("Error increasing inventory stock:", error);

            // Clean up any duplicate rows if they existed
            if (matchingItems.length > 1) {
                for (let j = 1; j < matchingItems.length; j++) {
                    await this.client.from('inventory').delete().eq('id', matchingItems[j].id);
                }
            }
        } else {
            // Insert new item
            const { error } = await this.client.from('inventory').insert([{
                category: cat,
                brand: brd,
                variant: varnt,
                quantity: addQty,
                unit: unit || 'pcs',
                price: parseFloat(price) || 0,
                min_stock: 0
            }]);
            if (error) console.error("Error inserting new inventory item from purchase:", error);
        }
    }

    static async deductStock(category, brand, variant, qty) {
        const inventory = await this.getInventory();
        const cat = (category || '').trim().toLowerCase();
        const brd = (brand || '').trim().toLowerCase();
        const varnt = (variant || '').trim().toLowerCase();
        
        const items = inventory.filter(i => 
            (i.category || '').trim().toLowerCase() === cat && 
            (i.brand || '').trim().toLowerCase() === brd && 
            (i.variant || '').trim().toLowerCase() === varnt
        );
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
                await this.increaseStock(item.category, item.brand, item.variant, item.qty);
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

        // Sync with Supabase dedicated 'credits' table if credit/due applies
        if (due > 0 || salePayload.payment_mode === 'Credit') {
            await this.syncCreditRecord({
                referenceNo: saleData.invoiceNo,
                saleId: saleId,
                type: 'Sale',
                partyName: saleData.buyerName,
                mobile: saleData.mobile,
                address: saleData.address,
                date: saleData.date,
                dueDate: saleData.dueDate,
                originalDue: total,
                currentDue: due,
                remarks: remarks
            });
        }
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

            // Automatically increase inventory stock for every purchase item
            for (let item of purchaseData.items) {
                await this.increaseStock(
                    item.category,
                    item.brand,
                    item.variant,
                    item.qty,
                    item.unit || 'pcs',
                    item.price || 0
                );
            }
        }

        await this.autoRegisterParty(purchaseData.vendorName, purchaseData.mobile, '', purchaseData.gstn);

        // Sync with Supabase dedicated 'credits' table if credit/due applies
        if (balance > 0) {
            await this.syncCreditRecord({
                referenceNo: billNo,
                purchaseId: purchaseId,
                type: 'Purchase',
                partyName: purchaseData.vendorName,
                mobile: purchaseData.mobile || '',
                address: '',
                date: purchaseData.date,
                dueDate: purchaseData.dueDate || null,
                originalDue: total,
                currentDue: balance,
                remarks: purchaseData.remarks || ''
            });
        }
    }

    // ==========================================
    // CREDITS & PAYMENTS (KHATA) - SUPABASE 'credits' TABLE
    // ==========================================
    static isUUID(str) {
        return typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    }

    static async syncCreditRecord({ referenceNo, saleId = null, purchaseId = null, type = 'Sale', partyName, mobile = '', address = '', date, dueDate = null, originalDue, currentDue, remarks = '' }) {
        if (!this.client || !referenceNo) return;
        try {
            const original = Math.max(0, parseFloat(originalDue) || 0);
            const current = Math.max(0, parseFloat(currentDue) || 0);
            const status = current <= 0 ? 'Paid' : (current < original ? 'Partial' : 'Pending');
            
            const payload = {
                reference_no: referenceNo,
                type: type,
                party_name: partyName || 'N/A',
                mobile: mobile || '',
                address: address || '',
                date: date || new Date().toISOString().split('T')[0],
                due_date: dueDate || null,
                original_due: original,
                current_due: current,
                status: status,
                remarks: remarks || '',
                updated_at: new Date().toISOString()
            };
            if (saleId && this.isUUID(saleId)) payload.sale_id = saleId;
            if (purchaseId && this.isUUID(purchaseId)) payload.purchase_id = purchaseId;

            // Check if record exists in credits table
            const { data: existing, error } = await this.client
                .from('credits')
                .select('id, original_due')
                .eq('reference_no', referenceNo)
                .maybeSingle();

            if (error) {
                // Table might not exist yet before SQL migration is executed
                return;
            }

            if (existing) {
                await this.client.from('credits').update(payload).eq('reference_no', referenceNo);
            } else {
                await this.client.from('credits').insert([payload]);
            }
        } catch (e) {
            console.warn("syncCreditRecord notice (credits table may need creation):", e);
        }
    }

    static async syncCreditsToDatabase() {
        if (!this.client) return;
        try {
            const [sales, purchases] = await Promise.all([
                this.getSales(),
                this.getPurchases()
            ]);

            const promises = [];

            for (const s of sales) {
                if (s.balance > 0 || s.paymentMethod === 'Credit') {
                    promises.push(this.syncCreditRecord({
                        referenceNo: s.invoiceNo,
                        saleId: s.id,
                        type: 'Sale',
                        partyName: s.buyerName,
                        mobile: s.mobile,
                        address: s.address,
                        date: s.date,
                        dueDate: s.dueDate,
                        originalDue: s.total,
                        currentDue: s.balance,
                        remarks: s.remarks
                    }));
                }
            }

            for (const p of purchases) {
                if (p.balance > 0) {
                    promises.push(this.syncCreditRecord({
                        referenceNo: p.billNo,
                        purchaseId: p.id,
                        type: 'Purchase',
                        partyName: p.vendorName,
                        mobile: p.mobile,
                        address: p.address || '',
                        date: p.date,
                        dueDate: p.dueDate,
                        originalDue: p.total,
                        currentDue: p.balance,
                        remarks: p.remarks
                    }));
                }
            }

            await Promise.all(promises);
            console.log(`Synced ${promises.length} credit records to Supabase 'credits' table.`);
        } catch (e) {
            console.warn("syncCreditsToDatabase warning:", e);
        }
    }

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
        const [allPayments, parties] = await Promise.all([
            this.getCreditPayments(),
            this.getParties()
        ]);

        const partyAddressMap = new Map();
        parties.forEach(p => {
            if (p.name && p.address) partyAddressMap.set(p.name.toLowerCase().trim(), p.address);
            if (p.mobile && p.address) partyAddressMap.set(p.mobile.trim(), p.address);
        });

        // 1. Try querying the dedicated Supabase 'credits' table first
        try {
            const { data: dbCredits, error } = await this.client
                .from('credits')
                .select('*')
                .order('date', { ascending: false });

            if (!error && Array.isArray(dbCredits) && dbCredits.length > 0) {
                return dbCredits.map(c => {
                    const payments = allPayments.filter(p => 
                        (c.id && String(p.creditId) === String(c.id)) ||
                        (c.sale_id && String(p.creditId) === String(c.sale_id)) ||
                        (c.purchase_id && String(p.creditId) === String(c.purchase_id)) ||
                        (c.reference_no && String(p.referenceNo) === String(c.reference_no))
                    );
                    const originalDue = parseFloat(c.original_due) || 0;
                    const currentDue = parseFloat(c.current_due) || 0;
                    const addr = c.address || partyAddressMap.get((c.party_name || '').toLowerCase().trim()) || partyAddressMap.get((c.mobile || '').trim()) || '';
                    
                    return {
                        id: c.sale_id || c.purchase_id || c.id,
                        creditDbId: c.id,
                        saleId: c.sale_id,
                        purchaseId: c.purchase_id,
                        referenceNo: c.reference_no,
                        invoiceNo: c.type === 'Sale' ? c.reference_no : undefined,
                        billNo: c.type === 'Purchase' ? c.reference_no : undefined,
                        type: c.type || 'Sale',
                        buyerName: c.party_name,
                        vendorName: c.party_name,
                        partyName: c.party_name,
                        mobile: c.mobile || '',
                        address: addr,
                        date: c.date,
                        dueDate: c.due_date || '',
                        originalDue: originalDue,
                        total: originalDue,
                        grandTotal: originalDue,
                        totalAmount: originalDue,
                        balance: currentDue,
                        dueAmount: currentDue,
                        status: c.status || (currentDue <= 0 ? 'Paid' : 'Pending'),
                        remarks: c.remarks || '',
                        payments: payments
                    };
                });
            }
        } catch (err) {
            console.warn("Could not fetch from 'credits' table, using dynamic fallback:", err);
        }

        // 2. Dynamic fallback from sales & purchases
        const [sales, purchases] = await Promise.all([
            this.getSales(),
            this.getPurchases()
        ]);

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

    static async addPaymentToCredit(creditId, amount, date, paymentMode = 'Cash', remarks = '', type = null) {
        const numAmount = parseFloat(amount) || 0;
        if (numAmount <= 0) return;

        let isSale = type ? (type === 'Sale') : true;
        let creditRow = null;
        let refNo = '';
        let party = '';

        // 1. Check if creditId exists in credits table
        try {
            let query = this.client.from('credits').select('*');
            if (this.isUUID(creditId)) {
                query = query.or(`id.eq.${creditId},sale_id.eq.${creditId},purchase_id.eq.${creditId}`);
            } else {
                query = query.eq('reference_no', creditId);
            }
            const { data: directCredit } = await query.maybeSingle();

            if (directCredit) {
                isSale = directCredit.type === 'Sale';
                refNo = directCredit.reference_no;
                party = directCredit.party_name;
                const newDue = Math.max(0, (parseFloat(directCredit.current_due) || 0) - numAmount);
                const newStatus = newDue <= 0 ? 'Paid' : 'Partial';
                await this.client.from('credits').update({
                    current_due: newDue,
                    status: newStatus,
                    updated_at: new Date().toISOString()
                }).eq('id', directCredit.id);
            }
        } catch (e) {
            console.warn("Notice: updating credits table payment:", e);
        }

        // 2. Update sales or purchases table to keep both in sync
        try {
            let { data: saleRow } = await this.client.from('sales').select('*').eq('id', creditId).maybeSingle();
            if (saleRow) {
                isSale = true;
                creditRow = saleRow;
                refNo = creditRow.invoice_no;
                party = creditRow.buyer_name;
            } else {
                const { data: purRow } = await this.client.from('purchases').select('*').eq('id', creditId).maybeSingle();
                if (purRow) {
                    isSale = false;
                    creditRow = purRow;
                    refNo = creditRow.bill_no;
                    party = creditRow.vendor_name;
                }
            }

            if (creditRow) {
                const currentBalance = parseFloat(creditRow.balance) || 0;
                const currentReceived = parseFloat(isSale ? creditRow.received_amt : creditRow.paid_amount) || 0;
                const newBalance = Math.max(0, currentBalance - numAmount);
                const newReceived = currentReceived + numAmount;

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
            }
        } catch (e) {
            console.warn("Notice: updating sales/purchases on payment:", e);
        }

        // 3. Log to credit_payments
        try {
            await this.client.from('credit_payments').insert([{
                credit_id: creditId,
                reference_no: refNo,
                party_name: party,
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

        // Revert balance on sales/purchases
        let isSale = true;
        let { data: creditRow } = await this.client.from('sales').select('*').eq('id', creditId).maybeSingle();
        if (!creditRow) {
            isSale = false;
            const res = await this.client.from('purchases').select('*').eq('id', creditId).maybeSingle();
            creditRow = res ? res.data : null;
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

        // Revert in credits table
        try {
            let query = this.client.from('credits').select('*');
            if (this.isUUID(creditId)) {
                query = query.or(`id.eq.${creditId},sale_id.eq.${creditId},purchase_id.eq.${creditId}`);
            } else if (paymentToRemove.referenceNo) {
                query = query.eq('reference_no', paymentToRemove.referenceNo);
            }
            const { data: directCredit } = await query.maybeSingle();
            if (directCredit) {
                const newDue = (parseFloat(directCredit.current_due) || 0) + amount;
                const newStatus = newDue <= 0 ? 'Paid' : 'Pending';
                await this.client.from('credits').update({
                    current_due: newDue,
                    status: newStatus,
                    updated_at: new Date().toISOString()
                }).eq('id', directCredit.id);
            }
        } catch (e) {
            console.warn("Notice: could not revert in credits table:", e);
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
        let refNo = null;

        try {
            const { data } = await this.client.from(table).select('remarks, invoice_no, bill_no').eq('id', id).maybeSingle();
            if (data) {
                refNo = type === 'Sale' ? data.invoice_no : data.bill_no;
                let remarks = data.remarks || '';
                remarks = remarks.replace(/DueDate:[^\s]+/, '').trim();
                remarks = (remarks ? remarks + ' ' : '') + `DueDate:${newDate}`;
                await this.client.from(table).update({ remarks: remarks.trim(), due_date: newDate }).eq('id', id);
            }
        } catch (e) {
            console.warn("Notice: updating source table due date:", e);
        }

        // Also update dedicated Supabase 'credits' table
        try {
            const updatePayload = {
                due_date: newDate,
                updated_at: new Date().toISOString()
            };
            if (this.isUUID(id)) {
                await this.client.from('credits').update(updatePayload).or(`id.eq.${id},sale_id.eq.${id},purchase_id.eq.${id}`);
            } else if (refNo) {
                await this.client.from('credits').update(updatePayload).eq('reference_no', refNo);
            }
        } catch (e) {
            console.warn("Notice: updating credits table due date:", e);
        }
    }
    
    static async markCreditAsPaid(id, date, type = 'Sale') {
        let refNo = '';
        let party = '';
        let remaining = 0;

        if (type === 'Sale') {
            const { data } = await this.client.from('sales').select('grand_total, buyer_name, invoice_no, balance').eq('id', id).maybeSingle();
            if (data) {
                const total = parseFloat(data.grand_total) || 0;
                remaining = parseFloat(data.balance) || total;
                refNo = data.invoice_no;
                party = data.buyer_name;
                await this.client.from('sales').update({ balance: 0, received_amt: total }).eq('id', id);
            }
        } else {
            const { data } = await this.client.from('purchases').select('total_amount, vendor_name, bill_no, balance').eq('id', id).maybeSingle();
            if (data) {
                const total = parseFloat(data.total_amount) || 0;
                remaining = parseFloat(data.balance) || total;
                refNo = data.bill_no;
                party = data.vendor_name;
                await this.client.from('purchases').update({ balance: 0, paid_amount: total }).eq('id', id);
            }
        }

        // Also update dedicated Supabase 'credits' table
        try {
            const updatePayload = {
                current_due: 0,
                status: 'Paid',
                updated_at: new Date().toISOString()
            };
            if (this.isUUID(id)) {
                await this.client.from('credits').update(updatePayload).or(`id.eq.${id},sale_id.eq.${id},purchase_id.eq.${id}`);
            } else if (refNo) {
                await this.client.from('credits').update(updatePayload).eq('reference_no', refNo);
            }
        } catch (e) {
            console.warn("Notice: could not mark paid in 'credits' table:", e);
        }

        // Insert settlement payment row
        if (remaining > 0) {
            try {
                await this.client.from('credit_payments').insert([{
                    credit_id: id,
                    reference_no: refNo,
                    party_name: party,
                    party_type: type === 'Sale' ? 'Customer' : 'Vendor',
                    amount: remaining,
                    payment_date: date || new Date().toISOString().split('T')[0],
                    payment_mode: 'Cash',
                    remarks: 'Full Settlement'
                }]);
            } catch (e) {}
        }
    }

    static async updateCreditBalance(creditId, newBalance, type = 'Sale') {
        const bal = Math.max(0, parseFloat(newBalance) || 0);
        const isSale = type === 'Sale';
        const table = isSale ? 'sales' : 'purchases';
        
        if (!this.client) return;
        let refNo = null;

        try {
            const { data, error } = await this.client.from(table).select('*').eq('id', creditId).maybeSingle();
            if (data) {
                refNo = isSale ? data.invoice_no : data.bill_no;
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
            console.error("Error updating credit balance in source table:", e);
        }

        // Also update dedicated Supabase 'credits' table
        try {
            const status = bal <= 0 ? 'Paid' : 'Pending';
            const updatePayload = {
                current_due: bal,
                status: status,
                updated_at: new Date().toISOString()
            };

            if (this.isUUID(creditId)) {
                await this.client.from('credits').update(updatePayload).or(`id.eq.${creditId},sale_id.eq.${creditId},purchase_id.eq.${creditId}`);
            } else if (refNo) {
                await this.client.from('credits').update(updatePayload).eq('reference_no', refNo);
            }
        } catch (e) {
            console.warn("Notice: could not update 'credits' table balance:", e);
        }
    }

    static async updateCreditStatus(creditId, status) {
        if (status === 'Paid') {
            await this.markCreditAsPaid(creditId, new Date().toISOString().split('T')[0]);
        }
    }
}
