// Simple wrapper for LocalStorage to manage Sales and Credit data

const STORAGE_KEYS = {
    SALES: 'sb_sales_history',
    CREDITS: 'sb_credit_history',
    INVOICE_SEQ: 'sb_invoice_sequence',
    INVENTORY: 'sb_inventory_v2',
    PARTIES: 'sb_parties',
    PURCHASES: 'sb_purchases_history'
};

class StorageManager {
    static getParties() {
        const data = localStorage.getItem(STORAGE_KEYS.PARTIES);
        return data ? JSON.parse(data) : [];
    }

    static saveParty(partyData) {
        const parties = this.getParties();
        if (partyData.id) {
            const index = parties.findIndex(p => p.id === partyData.id);
            if (index !== -1) {
                parties[index] = { ...parties[index], ...partyData };
            }
        } else {
            const newId = parties.length > 0 ? Math.max(...parties.map(p => p.id)) + 1 : 1;
            parties.push({ ...partyData, id: newId });
        }
        localStorage.setItem(STORAGE_KEYS.PARTIES, JSON.stringify(parties));
    }

    static deleteParty(id) {
        let parties = this.getParties();
        parties = parties.filter(p => p.id !== id);
        localStorage.setItem(STORAGE_KEYS.PARTIES, JSON.stringify(parties));
    }

    static autoRegisterParty(name, mobile, address, gstn) {
        if (!name) return;
        const parties = this.getParties();
        const existingParty = parties.find(p => 
            (mobile && p.mobile === mobile) || 
            p.name.toLowerCase() === name.toLowerCase()
        );
        
        if (!existingParty) {
            this.saveParty({
                name: name,
                mobile: mobile || '',
                address: address || '',
                gstn: gstn || ''
            });
        } else {
            let updated = false;
            if (gstn && !existingParty.gstn) { existingParty.gstn = gstn; updated = true; }
            if (mobile && !existingParty.mobile) { existingParty.mobile = mobile; updated = true; }
            if (address && !existingParty.address) { existingParty.address = address; updated = true; }
            if (updated) this.saveParty(existingParty);
        }
    }

    static getSales() {
        const data = localStorage.getItem(STORAGE_KEYS.SALES);
        return data ? JSON.parse(data) : [];
    }

    static saveSale(saleData, isEdit = false) {
        let sales = this.getSales();
        if (isEdit) {
            const index = sales.findIndex(s => s.invoiceNo === saleData.invoiceNo);
            if (index !== -1) {
                sales[index] = { ...sales[index], ...saleData };
            } else {
                sales.push({ ...saleData, id: Date.now() });
            }
        } else {
            sales.push({ ...saleData, id: Date.now() });
        }
        localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
        
        this.autoRegisterParty(saleData.buyerName, saleData.mobile, saleData.address, saleData.gstn);
    }

    static getPurchases() {
        const data = localStorage.getItem(STORAGE_KEYS.PURCHASES);
        return data ? JSON.parse(data) : [];
    }

    static savePurchase(purchaseData) {
        let purchases = this.getPurchases();
        purchases.push({ ...purchaseData, id: Date.now() });
        localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));

        this.autoRegisterParty(purchaseData.vendorName, purchaseData.mobile, '', '');

        // Update Inventory Stock
        let inventory = this.getInventory();
        purchaseData.items.forEach(item => {
            const index = inventory.findIndex(i => i.category === item.category && i.brand === item.brand && i.variant === item.variant);
            if (index !== -1) {
                inventory[index].stock += item.qty;
                // Optionally update cost price here if needed: inventory[index].price = item.price
            } else {
                // If it's a completely new item, we add it to inventory
                inventory.push({
                    id: Date.now() + Math.random(),
                    category: item.category,
                    brand: item.brand,
                    variant: item.variant,
                    stock: item.qty,
                    price: item.price // Assuming this is selling price or cost price based on context
                });
            }
        });
        localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
    }

    static getCredits() {
        const data = localStorage.getItem(STORAGE_KEYS.CREDITS);
        const credits = data ? JSON.parse(data) : [];
        credits.forEach(c => {
            if (!c.payments) c.payments = [];
        });
        return credits;
    }

    static saveCredit(creditData, isEdit = false) {
        let credits = this.getCredits();
        if (!creditData.payments) creditData.payments = [];
        
        if (isEdit) {
            const index = credits.findIndex(c => c.invoiceNo === creditData.invoiceNo);
            if (index !== -1) {
                credits[index] = { ...credits[index], ...creditData };
            } else {
                credits.push({ ...creditData, id: Date.now(), status: 'Pending' });
            }
        } else {
            credits.push({ ...creditData, id: Date.now(), status: 'Pending' });
        }
        localStorage.setItem(STORAGE_KEYS.CREDITS, JSON.stringify(credits));
    }

    static removeCredit(invoiceNo) {
        let credits = this.getCredits();
        credits = credits.filter(c => c.invoiceNo !== invoiceNo);
        localStorage.setItem(STORAGE_KEYS.CREDITS, JSON.stringify(credits));
    }

    static updateCreditStatus(id, newStatus) {
        const credits = this.getCredits();
        const index = credits.findIndex(c => c.id === id);
        if (index !== -1) {
            credits[index].status = newStatus;
            localStorage.setItem(STORAGE_KEYS.CREDITS, JSON.stringify(credits));
        }
    }

    static addPaymentToCredit(id, paymentAmount, paymentDate) {
        const credits = this.getCredits();
        const index = credits.findIndex(c => c.id === id);
        if (index !== -1) {
            credits[index].payments.push({
                amount: parseFloat(paymentAmount),
                date: paymentDate
            });
            const totalPaid = credits[index].payments.reduce((sum, p) => sum + p.amount, 0);
            if (totalPaid >= credits[index].total) {
                credits[index].status = 'Paid';
            }
            localStorage.setItem(STORAGE_KEYS.CREDITS, JSON.stringify(credits));
        }
    }

    static markCreditAsPaid(id, paymentDate) {
        const credits = this.getCredits();
        const index = credits.findIndex(c => c.id === id);
        if (index !== -1) {
            const totalPaid = credits[index].payments.reduce((sum, p) => sum + p.amount, 0);
            const remaining = credits[index].total - totalPaid;
            if (remaining > 0) {
                credits[index].payments.push({
                    amount: remaining,
                    date: paymentDate
                });
            }
            credits[index].status = 'Paid';
            localStorage.setItem(STORAGE_KEYS.CREDITS, JSON.stringify(credits));
        }
    }

    static updateCreditDueDate(id, newDueDate) {
        const credits = this.getCredits();
        const index = credits.findIndex(c => c.id === id);
        if (index !== -1) {
            credits[index].dueDate = newDueDate;
            localStorage.setItem(STORAGE_KEYS.CREDITS, JSON.stringify(credits));
        }
    }

    static removePaymentFromCredit(creditId, paymentIndex) {
        const credits = this.getCredits();
        const index = credits.findIndex(c => c.id === creditId);
        if (index !== -1 && credits[index].payments) {
            credits[index].payments.splice(paymentIndex, 1);
            
            // Recalculate status
            const totalPaid = credits[index].payments.reduce((sum, p) => sum + p.amount, 0);
            if (totalPaid < credits[index].total) {
                credits[index].status = 'Pending';
            }
            
            localStorage.setItem(STORAGE_KEYS.CREDITS, JSON.stringify(credits));
        }
    }

    static getNextInvoiceNumber() {
        let seq = localStorage.getItem(STORAGE_KEYS.INVOICE_SEQ);
        if (!seq) {
            seq = 1;
        } else {
            seq = parseInt(seq) + 1;
        }
        localStorage.setItem(STORAGE_KEYS.INVOICE_SEQ, seq);
        return seq;
    }

    // --- Inventory Management ---
    static getInventory() {
        const data = localStorage.getItem(STORAGE_KEYS.INVENTORY);
        if (!data) {
            return this.initInventory();
        }
        return JSON.parse(data);
    }

    static initInventory() {
        // Flatten the INVENTORY constant from inventory.js to a list of items
        const flatInventory = [];
        let idCounter = 1;

        if (typeof INVENTORY !== 'undefined') {
            for (const cat in INVENTORY) {
                const brands = INVENTORY[cat].brands;
                const variants = INVENTORY[cat].variants;
                
                brands.forEach(brand => {
                    variants.forEach(variant => {
                        flatInventory.push({
                            id: idCounter++,
                            category: cat,
                            brand: brand,
                            variant: variant,
                            stock: 3
                        });
                    });
                });
            }
        }
        
        localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(flatInventory));
        return flatInventory;
    }

    static saveInventoryItem(itemData) {
        const inventory = this.getInventory();
        if (itemData.id) {
            // Update existing
            const index = inventory.findIndex(i => i.id == itemData.id);
            if (index !== -1) {
                inventory[index] = { ...inventory[index], ...itemData };
            }
        } else {
            // Add new
            const newId = inventory.length > 0 ? Math.max(...inventory.map(i => i.id)) + 1 : 1;
            inventory.push({ ...itemData, id: newId });
        }
        localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
    }

    static deleteInventoryItem(id) {
        let inventory = this.getInventory();
        inventory = inventory.filter(i => i.id != id);
        localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
    }

    static checkStock(category, brand, variant, qty) {
        const inventory = this.getInventory();
        const item = inventory.find(i => i.category === category && i.brand === brand && i.variant === variant);
        if (!item) return false;
        return item.stock >= qty;
    }

    static deductStock(category, brand, variant, qty) {
        const inventory = this.getInventory();
        const index = inventory.findIndex(i => i.category === category && i.brand === brand && i.variant === variant);
        if (index !== -1) {
            inventory[index].stock -= qty;
            localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
        }
    }

    static addStock(category, brand, variant, qty) {
        const inventory = this.getInventory();
        const index = inventory.findIndex(i => i.category === category && i.brand === brand && i.variant === variant);
        if (index !== -1) {
            inventory[index].stock += qty;
            localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
        }
    }

    static revertSaleStock(invoiceNo) {
        const sales = this.getSales();
        const sale = sales.find(s => s.invoiceNo === invoiceNo);
        if (sale && sale.items) {
            sale.items.forEach(item => {
                this.addStock(item.category, item.brand, item.variant, item.qty);
            });
        }
    }
}
