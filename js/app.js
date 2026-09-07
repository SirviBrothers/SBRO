let currentInventoryFilter = 'all';
// Core UI Logic and State Management

const HSN_MAP = {
    'Wires': '8544', 'House Wires': '8544', 'Cable': '8544',
    'Bulb': '8539', 'Tubelight': '8539',
    'Panel': '9405', 'Rope Light': '9405',
    'Fan': '8414', 'Regulator': '8414',
    'Mixer': '8509',
    'Induction': '8516', 'Geyser': '8516', 'Iron': '8516',
    'Batter': '8507',
    'MCB': '8536', 'Switch': '8536', 'Socket': '8536', 'Bell': '8536', 'Isolator': '8536',
    'Modular': '8538', 'Plate': '8538'
};

function getHsnForCategory(category) {
    if (!category) return '';
    const lowerCat = category.toLowerCase();
    for (const key in HSN_MAP) {
        if (lowerCat.includes(key.toLowerCase())) {
            return HSN_MAP[key];
        }
    }
    return '';
}

document.addEventListener('DOMContentLoaded', async () => {

    // === ONE-TIME CLOUD MIGRATION LOGIC ===
    const migrateBtn = document.getElementById('migrate-btn');
    if (migrateBtn) {
        migrateBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if(!confirm("Are you sure you want to upload all your old offline data to the cloud? This will overwrite the cloud database.")) return;
            
            migrateBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Uploading...';
            migrateBtn.style.pointerEvents = 'none';

            try {
                const oldInv = JSON.parse(localStorage.getItem('sb_inventory_v2') || '[]');
                if (oldInv.length > 0) {
                    for (const item of oldInv) {
                        await StorageManager.saveInventoryItem({
                            category: item.category, brand: item.brand, variant: item.variant,
                            quantity: item.quantity, unit: item.unit || 'pcs', price: item.price || 0, minStock: item.minStock || 0
                        });
                    }
                }
                
                const oldSales = JSON.parse(localStorage.getItem('sb_sales_history') || '[]');
                if (oldSales.length > 0) {
                    for (const sale of oldSales) {
                        await StorageManager.saveSale({
                            invoiceNo: sale.invoiceNo, date: sale.date, buyerName: sale.buyerName,
                            mobile: sale.mobile, address: sale.address, gstn: sale.gstn,
                            subtotal: sale.subtotal, discount: sale.discount, grandTotal: sale.grandTotal,
                            receivedAmt: sale.receivedAmt, balance: sale.dueAmount || sale.balance || 0,
                            paymentMode: sale.paymentMethod, remarks: sale.remarks,
                            items: sale.items
                        });
                    }
                }
                
                const oldParties = JSON.parse(localStorage.getItem('sb_parties') || '[]');
                if (oldParties.length > 0) {
                    for (const party of oldParties) {
                        await StorageManager.saveParty(party);
                    }
                }
                
                alert("SUCCESS! All your offline data is now secure in the cloud. You will never lose it again.");
                migrateBtn.style.display = 'none'; // hide it after success
                
                // Refresh dashboard
                document.querySelector('.nav-item[data-target="home-tab"]').click();
            } catch(err) {
                console.error(err);
                alert("Error during migration: " + err.message);
                migrateBtn.innerHTML = '<i class="ph ph-cloud-arrow-up"></i> Try Again';
                migrateBtn.style.pointerEvents = 'auto';
            }
        });
    }
    // ======================================

    // Initialize Inventory on first load if empty
    try {
        let inventory = await StorageManager.getInventory();
        if (Array.isArray(inventory)) {
            let updated = false;
            inventory = inventory.map(item => {
                if (!item.hsn) {
                    item.hsn = getHsnForCategory(item.category);
                    updated = true;
                }
                return item;
            });
        }
    } catch (err) {
        console.warn("Inventory pre-load warning:", err);
    }

    // Set default date
    document.getElementById('bill-date').valueAsDate = new Date();
    if(document.getElementById('purchase-date')) document.getElementById('purchase-date').valueAsDate = new Date();
    
    let editingInvoiceNo = null;

    // Helper to format dates as DD/MM/YY
    function formatDateDDMMYY(dateStr) {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = String(d.getFullYear()).slice(-2);
        return `${day}/${month}/${year}`;
    }

    // Restrict mobile inputs to a maximum of 10 digits
    ['buyer-mobile', 'purchase-vendor-mobile', 'party-mobile-input'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', (e) => {
                let val = e.target.value.replace(/\D/g, '');
                if (val.length > 10) val = val.slice(0, 10);
                e.target.value = val;
            });
        }
    });

    // Sidebar Toggle
    const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
    const sidebar = document.querySelector('.sidebar');
    if (sidebarToggleBtn && sidebar) {
        sidebarToggleBtn.addEventListener('click', async () => {
            sidebar.classList.toggle('collapsed');
        });
    }

    // Tab Navigation
    const navItems = document.querySelectorAll('.nav-item');
    const tabPanes = document.querySelectorAll('.tab-pane');

    navItems.forEach(item => {
        item.addEventListener('click', async (e) => {
            e.preventDefault();
            const targetId = item.getAttribute('data-target');

            // Update active states
            navItems.forEach(nav => nav.classList.remove('active'));
            tabPanes.forEach(tab => tab.classList.remove('active'));

            item.classList.add('active');
            document.getElementById(targetId).classList.add('active');

            // Refresh data if specific tabs are opened
            if (targetId === 'home-tab') renderHomeDashboard();
            if (targetId === 'sales-tab') renderSalesTable();
            if (targetId === 'credit-tab') renderCreditTable();
            if (targetId === 'inventory-tab') renderInventoryTable();
            if (targetId === 'parties-tab') renderPartiesTable();
            if (targetId === 'purchases-tab') renderPurchaseHistoryTable();

            // Auto-collapse sidebar on mobile after clicking a link
            if (window.innerWidth <= 768 && sidebar) {
                sidebar.classList.add('collapsed');
            }
        });
    });

    // --- HOME DASHBOARD UI ---
    async function renderHomeDashboard() {
        const sales = await StorageManager.getSales();
        const credits = await StorageManager.getCredits();
        
        let todaySales = 0;
        let weeklySales = 0;
        let monthlySales = 0;
        let totalRevenue = 0;
        
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const startOfWeek = startOfDay - (now.getDay() * 24 * 60 * 60 * 1000); // Rough start of week
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

        sales.forEach(sale => {
            const saleDate = new Date(sale.date).getTime();
            totalRevenue += (sale.total || 0);
            
            if (saleDate >= startOfDay) todaySales += sale.total;
            if (saleDate >= startOfWeek) weeklySales += sale.total;
            if (saleDate >= startOfMonth) monthlySales += sale.total;
        });

        const avgOrder = sales.length > 0 ? (totalRevenue / sales.length) : 0;
        
        let totalDue = 0;
        credits.forEach(credit => {
            if (credit.status !== 'Paid') {
                const totalPaid = credit.payments ? credit.payments.reduce((sum, p) => sum + p.amount, 0) : 0;
                totalDue += ((credit.total || 0) - totalPaid);
            }
        });

        const eToday = document.getElementById('dash-daily-sales');
        if(eToday) eToday.textContent = `₹ ${todaySales.toFixed(2)}`;
        
        const eWeek = document.getElementById('dash-weekly-sales');
        if(eWeek) eWeek.textContent = `₹ ${weeklySales.toFixed(2)}`;
        
        const eMonth = document.getElementById('dash-monthly-sales');
        if(eMonth) eMonth.textContent = `₹ ${monthlySales.toFixed(2)}`;
        
        const eAvg = document.getElementById('dash-avg-order');
        if(eAvg) eAvg.textContent = `₹ ${avgOrder.toFixed(2)}`;
        
        const eDue = document.getElementById('dash-total-due');
        if(eDue) eDue.textContent = `₹ ${totalDue.toFixed(2)}`;

        // Hero Product
        let itemCounts = {};
        sales.forEach(sale => {
            if(sale.items) {
                sale.items.forEach(item => {
                    const key = `${item.brand} ${item.variant}`;
                    itemCounts[key] = (itemCounts[key] || 0) + item.qty;
                });
            }
        });
        let heroProduct = 'No Sales Yet';
        let maxQty = 0;
        for (let key in itemCounts) {
            if (itemCounts[key] > maxQty) {
                maxQty = itemCounts[key];
                heroProduct = `${key} <br><span style="font-size: 0.85rem; color:#FCD34D;">(${maxQty} units)</span>`;
            }
        }
        const eHero = document.getElementById('dash-hero-product');
        if(eHero) eHero.innerHTML = heroProduct;

        // Chart.js Cash Flow
        const purchases = await StorageManager.getPurchases();
        let totalPurchases = 0;
        purchases.forEach(p => totalPurchases += p.totalAmount);
        
        const ctx = document.getElementById('cashflow-chart');
        if (ctx) {
            if (window.cashFlowChart) {
                window.cashFlowChart.destroy();
            }
            // Add a slight delay to ensure canvas is painted before Chart.js takes over
            setTimeout(() => {
                window.cashFlowChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: ['Overall Cash Flow'],
                        datasets: [
                            {
                                label: 'Total Sales (Revenue)',
                                data: [totalRevenue],
                                backgroundColor: 'rgba(16, 185, 129, 0.8)',
                                borderColor: '#059669',
                                borderWidth: 1,
                                borderRadius: 4
                            },
                            {
                                label: 'Total Purchases (Expense)',
                                data: [totalPurchases],
                                backgroundColor: 'rgba(239, 68, 68, 0.8)',
                                borderColor: '#DC2626',
                                borderWidth: 1,
                                borderRadius: 4
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'bottom' }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    callback: function(value) { return '₹ ' + value; }
                                }
                            }
                        }
                    }
                });
            }, 100);
        }
    }
    
    renderHomeDashboard();

    // Paid Amount, Due Amount and GST Logic
    const paidAmountInput = document.getElementById('paid-amount');
    const dueDateGroup = document.querySelector('.due-date-group');
    const dueAmountContainer = document.getElementById('due-amount-container');
    const dueAmountDisplay = document.getElementById('due-amount');
    
    let isPaidAmountManuallyEdited = false;

    // GST Bill Controls
    const isGstCheckbox = document.getElementById('is-gst-bill');
    const gstRateGroup = document.getElementById('gst-rate-group');
    const customGstInput = document.getElementById('custom-gst-rate');
    const selectedGstInput = document.getElementById('selected-gst-rate');
    const subtotalDisplayGroup = document.getElementById('subtotal-display-group');
    const taxDisplayGroup = document.getElementById('tax-display-group');
    const billSubtotalSpan = document.getElementById('bill-subtotal');
    const billTaxSpan = document.getElementById('bill-tax');
    const taxLabelSpan = document.getElementById('tax-label');

    if (isGstCheckbox) {
        isGstCheckbox.addEventListener('change', () => {
            const isChecked = isGstCheckbox.checked;
            if (gstRateGroup) gstRateGroup.style.display = isChecked ? 'block' : 'none';
            if (subtotalDisplayGroup) subtotalDisplayGroup.style.display = isChecked ? 'flex' : 'none';
            if (taxDisplayGroup) taxDisplayGroup.style.display = isChecked ? 'flex' : 'none';
            calculateGrandTotal();
        });
    }

    document.querySelectorAll('.gst-preset-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.gst-preset-btn').forEach(b => {
                b.classList.remove('btn-primary');
                b.classList.add('btn-secondary');
            });
            btn.classList.remove('btn-secondary');
            btn.classList.add('btn-primary');
            const rate = btn.dataset.rate;
            if (selectedGstInput) selectedGstInput.value = rate;
            if (customGstInput) customGstInput.value = '';
            calculateGrandTotal();
        });
    });

    if (customGstInput) {
        customGstInput.addEventListener('input', (e) => {
            document.querySelectorAll('.gst-preset-btn').forEach(b => {
                b.classList.remove('btn-primary');
                b.classList.add('btn-secondary');
            });
            const rate = parseFloat(e.target.value) || 0;
            if (selectedGstInput) selectedGstInput.value = rate;
            calculateGrandTotal();
        });
    }

    paidAmountInput.addEventListener('input', async () => {
        isPaidAmountManuallyEdited = true;
        recalculateDueAmount();
    });

    function recalculateDueAmount() {
        const total = parseFloat(document.getElementById('grand-total').dataset.value || 0);
        let paid = parseFloat(paidAmountInput.value);
        if (isNaN(paid)) paid = 0;
        
        const due = total - paid;
        
        if (due > 0) {
            dueAmountContainer.style.display = 'block';
            dueAmountDisplay.textContent = `₹ ${due.toFixed(2)}`;
            dueDateGroup.style.display = 'flex';
            
            // Set default due date to 1 month from now if empty
            if (!document.getElementById('due-date').value) {
                const nextMonth = new Date();
                nextMonth.setMonth(nextMonth.getMonth() + 1);
                document.getElementById('due-date').valueAsDate = nextMonth;
            }
        } else {
            dueAmountContainer.style.display = 'none';
            dueDateGroup.style.display = 'none';
        }
    }

    // Billing Form Dynamic Rows
    const addRowBtn = document.getElementById('add-row-btn');
    const itemsTbody = document.querySelector('#items-table tbody');

    async function createRow(itemData = null) {
        const inventory = await StorageManager.getInventory();
        let categories = [...new Set(inventory.map(i => i.category))];
        if (categories.length === 0 && typeof CATEGORIES !== 'undefined') {
            categories = CATEGORIES;
        }

        const tr = document.createElement('tr');
        
        // Category Select
        const catSelect = document.createElement('select');
        catSelect.innerHTML = `<option value="">Select</option>` + 
            categories.map(c => `<option value="${c}">${c}</option>`).join('');
        
        // Brand Select
        const brandSelect = document.createElement('select');
        brandSelect.innerHTML = `<option value="">Select</option>`;
        
        // Variant Select
        const varSelect = document.createElement('select');
        varSelect.innerHTML = `<option value="">Select</option>`;

        // HSN Input
        const hsnInput = document.createElement('input');
        hsnInput.type = 'text'; hsnInput.placeholder = 'HSN';
        hsnInput.className = 'b-hsn'; hsnInput.style.width = '80px';
        hsnInput.disabled = true;

        // Inputs
        const priceInput = document.createElement('input');
        priceInput.type = 'number'; priceInput.min = '0'; priceInput.value = '0';
        
        const qtyInput = document.createElement('input');
        qtyInput.type = 'number'; qtyInput.min = '1'; qtyInput.value = '1';

        const amountDisplay = document.createElement('span');
        amountDisplay.className = 'item-amount-display';
        amountDisplay.textContent = '₹ 0.00';

        // Delete Button
        const delBtn = document.createElement('button');
        delBtn.className = 'btn btn-icon';
        delBtn.innerHTML = '<i class="ph ph-trash"></i>';
        delBtn.onclick = () => {
            tr.remove();
            calculateGrandTotal();
        };

        // Event Listeners for dependent dropdowns
        catSelect.addEventListener('change', async (e) => {
            const cat = e.target.value;
            brandSelect.innerHTML = `<option value="">Select</option>`;
            varSelect.innerHTML = `<option value="">Select</option>`;
            if (cat) {
                let brands = [...new Set(inventory.filter(i => i.category === cat).map(i => i.brand))];
                if (brands.length === 0 && typeof INVENTORY !== 'undefined' && INVENTORY[cat]) {
                    brands = INVENTORY[cat].brands || [];
                }
                brands.forEach(b => brandSelect.innerHTML += `<option value="${b}">${b}</option>`);
            }
        });

        brandSelect.addEventListener('change', async (e) => {
            const cat = catSelect.value;
            const brand = e.target.value;
            varSelect.innerHTML = `<option value="">Select</option>`;
            hsnInput.value = '';
            if (cat && brand) {
                const variants = inventory.filter(i => i.category === cat && i.brand === brand);
                if (variants.length > 0) {
                    const uniqueVariants = {};
                    variants.forEach(v => {
                        if (!uniqueVariants[v.variant]) uniqueVariants[v.variant] = { ...v, quantity: 0 };
                        uniqueVariants[v.variant].quantity += parseFloat(v.quantity) || 0;
                    });
                    Object.values(uniqueVariants).forEach(v => {
                        varSelect.innerHTML += `<option value="${v.variant}">${v.variant} (Stock: ${v.quantity})</option>`;
                    });
                } else if (typeof INVENTORY !== 'undefined' && INVENTORY[cat] && INVENTORY[cat].variants) {
                    INVENTORY[cat].variants.forEach(v => {
                        varSelect.innerHTML += `<option value="${v}">${v} (Stock: 0)</option>`;
                    });
                }
            }
        });

        varSelect.addEventListener('change', async (e) => {
            const cat = catSelect.value;
            const brand = brandSelect.value;
            const variant = e.target.value;
            if (cat && brand && variant) {
                const item = inventory.find(i => i.category === cat && i.brand === brand && i.variant === variant);
                if (item) {
                    hsnInput.value = item.hsn || getHsnForCategory(cat);
                } else {
                    hsnInput.value = getHsnForCategory(cat);
                }
            } else {
                hsnInput.value = '';
            }
        });

        // Event listeners for calculations
        [priceInput, qtyInput].forEach(input => {
            input.addEventListener('input', async () => {
                const price = parseFloat(priceInput.value) || 0;
                const qty = parseInt(qtyInput.value) || 0;
                
                const amount = price * qty;
                amountDisplay.textContent = `₹ ${Math.max(0, amount).toFixed(2)}`;
                amountDisplay.dataset.value = Math.max(0, amount);
                calculateGrandTotal();
            });
        });

        // Append to row
        [catSelect, brandSelect, varSelect, hsnInput, priceInput, qtyInput].forEach(el => {
            const td = document.createElement('td');
            td.appendChild(el);
            tr.appendChild(td);
        });
        
        let tdAmount = document.createElement('td'); tdAmount.appendChild(amountDisplay); tr.appendChild(tdAmount);
        let tdAction = document.createElement('td'); tdAction.appendChild(delBtn); tr.appendChild(tdAction);

        if (itemData) {
            catSelect.value = itemData.category;
            catSelect.dispatchEvent(new Event('change'));
            brandSelect.value = itemData.brand;
            brandSelect.dispatchEvent(new Event('change'));
            varSelect.value = itemData.variant;
            varSelect.dispatchEvent(new Event('change'));
            priceInput.value = itemData.price || 0;
            qtyInput.value = itemData.qty || 1;
            const itemAmt = parseFloat(itemData.amount || itemData.total) || ((parseFloat(itemData.price) || 0) * (parseFloat(itemData.qty) || 1));
            amountDisplay.textContent = `₹ ${itemAmt.toFixed(2)}`;
            amountDisplay.dataset.value = itemAmt;
        }

        itemsTbody.appendChild(tr);
    }

    addRowBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        createRow();
    });

    // Initial empty row
    createRow();

    // Autofill Buyer Info and render history
    const buyerNameInput = document.getElementById('buyer-name');
    const buyerMobileInput = document.getElementById('buyer-mobile');
    const buyerGstnInput = document.getElementById('buyer-gstn');
    const buyerAddressInput = document.getElementById('buyer-address');
    const buyerHistoryContainer = document.getElementById('buyer-history-container');
    const buyerHistoryList = document.getElementById('buyer-history-list');
    const buyerHistoryDue = document.getElementById('buyer-history-due');

    async function updateBuyerHistory() {
        const typedName = buyerNameInput ? buyerNameInput.value.toLowerCase().trim() : '';
        const typedMobile = buyerMobileInput ? buyerMobileInput.value.trim() : '';
        if (!typedName && !typedMobile) {
            if (buyerHistoryContainer) buyerHistoryContainer.style.display = 'none';
            return;
        }

        try {
            const [allSales, allCredits, parties] = await Promise.all([
                StorageManager.getSales(),
                StorageManager.getCredits(),
                StorageManager.getParties()
            ]);

            const party = parties.find(p => 
                (typedName && p.name && p.name.toLowerCase() === typedName) ||
                (typedMobile && p.mobile && p.mobile === typedMobile)
            );

            if (party) {
                if (!buyerMobileInput.value && party.mobile) buyerMobileInput.value = party.mobile;
                if (!buyerGstnInput.value && party.gstn) buyerGstnInput.value = party.gstn;
                if (!buyerAddressInput.value && party.address) buyerAddressInput.value = party.address;
            }

            const partySales = allSales.filter(s => 
                (typedName && s.buyerName && s.buyerName.toLowerCase() === typedName) ||
                (typedMobile && s.mobile && s.mobile === typedMobile)
            ).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

            const partyCredits = allCredits.filter(c => 
                (typedName && c.buyerName && c.buyerName.toLowerCase() === typedName) ||
                (typedMobile && c.mobile && c.mobile === typedMobile)
            );
            const totalDue = partyCredits.reduce((sum, c) => sum + (c.dueAmount || c.balance || 0), 0);

            if (buyerHistoryList) {
                if (partySales.length > 0) {
                    buyerHistoryList.innerHTML = partySales.map(s => {
                        const itemsStr = (s.items && s.items.length > 0) 
                            ? s.items.map(i => `${i.category} - ${i.brand} (${i.variant}) x ${i.qty} - ₹${i.price}`).join('<br>') 
                            : 'No items';
                        const amount = s.totalAmount || s.total || 0;
                        const dueVal = (s.dueAmount || s.balance || 0);
                        const dueStr = (dueVal > 0) 
                            ? ` <span style="color: var(--danger-color); font-weight: bold;">(Due: ₹ ${dueVal.toFixed(2)})</span>` 
                            : ` <span style="color: var(--success-color); font-weight: 500;">(Paid)</span>`;
                        return `<li style="margin-bottom: 0.5rem; padding-bottom: 0.5rem; border-bottom: 1px dashed #e5e7eb;"><strong>${formatDateDDMMYY(s.date)}</strong>: Invoice #${s.invoiceNo} - <strong style="color: var(--secondary-color);">₹ ${amount.toFixed(2)}</strong>${dueStr}<br><small style="color: var(--text-muted); display: block; margin-top: 0.2rem;">${itemsStr}</small></li>`;
                    }).join('');
                } else {
                    buyerHistoryList.innerHTML = '<li>No previous purchases or sales found for this buyer.</li>';
                }
            }

            if (buyerHistoryDue) buyerHistoryDue.textContent = `₹ ${Math.max(0, totalDue).toFixed(2)}`;
            if (buyerHistoryContainer) buyerHistoryContainer.style.display = 'block';
        } catch (err) {
            console.error("Error updating buyer history:", err);
        }
    }

    if (buyerNameInput) {
        buyerNameInput.addEventListener('input', updateBuyerHistory);
        buyerNameInput.addEventListener('blur', updateBuyerHistory);
    }
    if (buyerMobileInput) {
        buyerMobileInput.addEventListener('input', updateBuyerHistory);
        buyerMobileInput.addEventListener('blur', updateBuyerHistory);
    }

    function calculateGrandTotal() {
        let subtotal = 0;
        document.querySelectorAll('.item-amount-display').forEach(el => {
            subtotal += parseFloat(el.dataset.value || 0);
        });

        let grandTotal = subtotal;
        const isGst = isGstCheckbox && isGstCheckbox.checked;

        if (isGst) {
            const rate = parseFloat(selectedGstInput ? selectedGstInput.value : 18) || 0;
            const taxAmt = (subtotal * rate) / 100;
            grandTotal = subtotal + taxAmt;

            if (billSubtotalSpan) billSubtotalSpan.textContent = `₹ ${subtotal.toFixed(2)}`;
            if (taxLabelSpan) taxLabelSpan.textContent = `GST (${rate}%):`;
            if (billTaxSpan) billTaxSpan.textContent = `₹ ${taxAmt.toFixed(2)}`;
        }

        const grandTotalEl = document.getElementById('grand-total');
        if (grandTotalEl) {
            grandTotalEl.textContent = `₹ ${grandTotal.toFixed(2)}`;
            grandTotalEl.dataset.value = grandTotal;
            grandTotalEl.dataset.subtotal = subtotal;
        }
        
        if (!isPaidAmountManuallyEdited && paidAmountInput) {
            paidAmountInput.value = grandTotal.toFixed(2);
        }
        recalculateDueAmount();
    }

    async function collectBillData() {
        const date = document.getElementById('bill-date').value;
        const buyerName = document.getElementById('buyer-name').value.trim();
        const mobile = document.getElementById('buyer-mobile').value.trim();
        const gstn = document.getElementById('buyer-gstn').value.trim();
        const address = document.getElementById('buyer-address').value.trim();
        
        if (!buyerName) {
            alert('Please enter Buyer Name');
            return null;
        }
        if (!mobile) {
            alert('Please enter Mobile Number');
            return null;
        }

        const items = [];
        let subtotal = 0;
        let valid = true;
        let stockError = '';

        const rows = document.querySelectorAll('#items-table tbody tr');
        for(let i=0; i<rows.length; i++) {
            const tr = rows[i];
            const selects = tr.querySelectorAll('select');
            const inputs = tr.querySelectorAll('input');
            const amtDisplay = tr.querySelector('.item-amount-display');
            const hsnInput = tr.querySelector('.b-hsn');
            
            const cat = selects[0].value;
            if (cat) {
                const brand = selects[1].value;
                const variant = selects[2].value;
                const hsn = hsnInput ? hsnInput.value : '';
                const price = parseFloat(inputs[1].value) || 0;
                const qty = parseInt(inputs[2].value) || 0;
                const amount = parseFloat(amtDisplay.dataset.value || 0);

                if (!brand || !variant) valid = false;

                if (!await StorageManager.checkStock(cat, brand, variant, qty)) {
                    stockError += `\n- Not enough stock for ${brand} (${variant}). Requested: ${qty}`;
                }

                items.push({ category: cat, brand, variant, hsn, price, qty, amount });
                subtotal += amount;
            }
        }

        if (items.length === 0) {
            alert('Please add at least one valid item');
            return null;
        }
        if (!valid) {
            alert('Please select Brand and Variant for all added items');
            return null;
        }
        if (stockError) {
            alert('Stock Error!' + stockError);
            return null;
        }

        const isGst = isGstCheckbox && isGstCheckbox.checked;
        const gstRate = isGst ? (parseFloat(selectedGstInput ? selectedGstInput.value : 18) || 0) : 0;
        const taxAmount = isGst ? ((subtotal * gstRate) / 100) : 0;
        const grandTotal = subtotal + taxAmount;

        const invoiceNo = editingInvoiceNo !== null ? editingInvoiceNo : await StorageManager.getNextInvoiceNo();
        let paidAmount = parseFloat(paidAmountInput.value);
        if (isNaN(paidAmount)) paidAmount = 0;
        const dueAmount = Math.max(0, grandTotal - paidAmount);
        const dueDateInput = document.getElementById('due-date');
        const dueDate = (dueDateInput && dueAmount > 0) ? dueDateInput.value : '';

        return {
            invoiceNo,
            date,
            buyerName,
            mobile,
            gstn,
            address,
            paymentMethod: dueAmount > 0 ? 'Credit' : 'Cash/Online',
            paidAmount,
            dueAmount,
            dueDate,
            items,
            subtotal,
            isGstBill: isGst,
            gstRate,
            taxAmount,
            total: grandTotal,
            grandTotal: grandTotal
        };
    }

    async function processBillData(preparedBillData = null) {
        const billData = preparedBillData || await collectBillData();
        if (!billData) return null;

        // Deduct Stock
        if (editingInvoiceNo !== null) {
            await StorageManager.revertSaleStock(editingInvoiceNo);
        }

        for (const item of billData.items) {
            await StorageManager.deductStock(item.category, item.brand, item.variant, item.qty);
        }

        // Save Data
        await StorageManager.saveSale(billData, editingInvoiceNo !== null);

        editingInvoiceNo = null;
        document.querySelector('#billing-tab .page-header h1').textContent = 'New Bill';
        
        return billData;
    }

    function resetForm() {
        document.getElementById('buyer-name').value = '';
        document.getElementById('buyer-mobile').value = '';
        document.getElementById('buyer-gstn').value = '';
        document.getElementById('buyer-address').value = '';
        if (buyerHistoryContainer) buyerHistoryContainer.style.display = 'none';
        if (isGstCheckbox) {
            isGstCheckbox.checked = false;
            if (gstRateGroup) gstRateGroup.style.display = 'none';
            if (subtotalDisplayGroup) subtotalDisplayGroup.style.display = 'none';
            if (taxDisplayGroup) taxDisplayGroup.style.display = 'none';
        }
        itemsTbody.innerHTML = '';
        isPaidAmountManuallyEdited = false;
        editingInvoiceNo = null;
        document.querySelector('#billing-tab .page-header h1').textContent = 'New Bill';
        createRow();
        calculateGrandTotal();
    }

    // Bill Preview and Save / Download
    let currentPreviewBillData = null;
    const downloadBtn = document.getElementById('download-bill-btn');
    const previewModal = document.getElementById('bill-preview-modal');
    const closePreviewBtn = document.getElementById('close-bill-preview-modal-btn');
    const editPreviewBtn = document.getElementById('edit-bill-preview-btn');
    const confirmSaveDownloadBtn = document.getElementById('confirm-save-download-btn');
    const previewContainer = document.getElementById('preview-invoice-container');

    if (downloadBtn) {
        downloadBtn.addEventListener('click', async () => {
            const billData = await collectBillData();
            if (!billData) return;

            currentPreviewBillData = billData;
            PDFGenerator._prepareTemplate(billData);

            if (previewContainer) {
                const templateEl = document.getElementById('invoice-template');
                previewContainer.innerHTML = templateEl ? templateEl.innerHTML : '';
            }

            if (previewModal) previewModal.style.display = 'flex';
        });
    }

    if (closePreviewBtn) {
        closePreviewBtn.addEventListener('click', () => {
            if (previewModal) previewModal.style.display = 'none';
        });
    }

    if (editPreviewBtn) {
        editPreviewBtn.addEventListener('click', () => {
            if (previewModal) previewModal.style.display = 'none';
        });
    }

    if (confirmSaveDownloadBtn) {
        confirmSaveDownloadBtn.addEventListener('click', async () => {
            if (!currentPreviewBillData) return;

            confirmSaveDownloadBtn.disabled = true;
            confirmSaveDownloadBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Saving & Downloading...';

            try {
                const savedBill = await processBillData(currentPreviewBillData);
                if (savedBill) {
                    await PDFGenerator.generate(savedBill);
                    if (previewModal) previewModal.style.display = 'none';
                    resetForm();
                    alert('Bill saved and downloaded successfully!');
                    renderSalesTable();
                    renderHomeDashboard();
                }
            } catch (err) {
                console.error("Save & download error:", err);
                alert('Error saving or downloading bill: ' + err.message);
            } finally {
                confirmSaveDownloadBtn.disabled = false;
                confirmSaveDownloadBtn.innerHTML = '<i class="ph ph-floppy-disk"></i> Confirm & Save / Download';
                currentPreviewBillData = null;
            }
        });
    }

    // Render Sales Table
    async function renderSalesTable() {
        const sales = await StorageManager.getSales();
        const tbody = document.querySelector('#sales-history-table tbody');
        tbody.innerHTML = '';
        
        let todayTotal = 0, weekTotal = 0, monthTotal = 0;
        const now = new Date();

        // Sort Newest to Oldest
        const sortedSales = sales.slice().sort((a, b) => new Date(b.date) - new Date(a.date) || b.id - a.id);

        sortedSales.forEach(sale => {
            const saleDate = new Date(sale.date);
            const diffTime = Math.abs(now - saleDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            
            if (diffDays <= 1) todayTotal += (sale.total || 0);
            if (diffDays <= 7) weekTotal += (sale.total || 0);
            if (saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear()) {
                monthTotal += (sale.total || 0);
            }

            const due = parseFloat(sale.dueAmount || sale.balance) || 0;
            const tr = document.createElement('tr');
            tr.style.fontSize = '0.85rem';
            tr.innerHTML = `
                <td style="white-space: nowrap;">${formatDateDDMMYY(sale.date)}</td>
                <td style="font-weight: 600; white-space: nowrap;">#${sale.invoiceNo}</td>
                <td style="white-space: nowrap;">
                    <a href="tel:${sale.mobile || ''}" class="btn btn-sm" style="background:#f3f4f6; color:#1f2937; text-decoration:none; display:inline-flex; align-items:center; gap:0.25rem; font-size:0.8rem; padding:0.2rem 0.5rem; border-radius:4px;" title="Call Buyer">
                        <i class="ph ph-phone"></i> ${sale.mobile || '-'}
                    </a>
                </td>
                <td style="font-weight: 500;">${sale.buyerName}</td>
                <td style="color: #4B5563; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${sale.address || ''}">${sale.address || '-'}</td>
                <td style="font-weight: 600; white-space: nowrap;">₹ ${(sale.total || 0).toFixed(2)}</td>
                <td style="font-weight: 600; white-space: nowrap; color: ${due > 0 ? 'var(--danger-color)' : 'var(--success-color)'};">₹ ${due.toFixed(2)}</td>
                <td style="white-space: nowrap;">
                    <div style="display: flex; gap: 0.4rem;">
                        <button class="btn btn-icon edit-sale-btn" data-id="${sale.invoiceNo}" title="Edit"><i class="ph ph-pencil"></i></button>
                        <button class="btn btn-icon download-sale-btn" data-id="${sale.invoiceNo}" title="Download PDF"><i class="ph ph-download-simple"></i></button>
                        <button class="btn btn-icon wa-share-btn" data-id="${sale.invoiceNo}" title="Share via WhatsApp" style="color: #25D366; border-color: #25D366;"><i class="ph ph-whatsapp-logo"></i></button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.download-sale-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const invoiceNo = e.currentTarget.dataset.id;
                const sale = (await StorageManager.getSales()).find(s => s.invoiceNo === invoiceNo);
                if (sale) {
                    const btn = e.currentTarget;
                    const originalHtml = btn.innerHTML;
                    btn.innerHTML = '<i class="ph ph-spinner ph-spin"></i>';
                    btn.disabled = true;
                    try {
                        await PDFGenerator.generate(sale);
                    } catch (error) {
                        console.error("Download failed", error);
                    } finally {
                        btn.innerHTML = originalHtml;
                        btn.disabled = false;
                    }
                }
            });
        });

        document.querySelectorAll('.wa-share-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const invoiceNo = e.currentTarget.dataset.id;
                const sale = (await StorageManager.getSales()).find(s => s.invoiceNo === invoiceNo);
                if (sale) {
                    let itemsText = (sale.items || []).map((i, idx) => {
                        const p = parseFloat(i.price) || 0;
                        const q = parseFloat(i.qty || i.quantity) || 0;
                        const a = parseFloat(i.amount || i.total) || (p * q);
                        return `${idx + 1}. ${i.category || ''} - ${i.brand || ''} (${i.variant || ''}) x ${q} - ₹${a.toFixed(2)}`;
                    }).join('\n');
                    
                    const sTotal = parseFloat(sale.total || sale.grandTotal) || 0;
                    const sPaid = parseFloat(sale.paidAmount || sale.receivedAmt) || 0;
                    const sDue = parseFloat(sale.dueAmount || sale.balance) || 0;

                    let text = `*Sirvi Brothers - Invoice #${sale.invoiceNo}*\n`;
                    text += `Date: ${formatDateDDMMYY(sale.date)}\n`;
                    text += `Customer: ${sale.buyerName}\n`;
                    if (sale.address) text += `Address: ${sale.address}\n`;
                    text += `\n*Items:*\n${itemsText}\n\n`;
                    text += `*Total Amount:* ₹${sTotal.toFixed(2)}\n`;
                    if (sDue > 0) {
                        text += `*Paid:* ₹${sPaid.toFixed(2)}\n`;
                        text += `*Due Amount:* ₹${sDue.toFixed(2)}\n`;
                    }
                    text += `\nThank you for your business!`;
                    
                    const encodedText = encodeURIComponent(text);
                    let waUrl = `https://wa.me/`;
                    if (sale.mobile) {
                        let mobileStr = sale.mobile.replace(/\D/g, '');
                        if (mobileStr.length === 10) mobileStr = '91' + mobileStr;
                        waUrl += mobileStr;
                    }
                    waUrl += `?text=${encodedText}`;
                    window.open(waUrl, '_blank');
                }
            });
        });

        document.querySelectorAll('.edit-sale-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const invoiceNo = e.currentTarget.dataset.id;
                loadBillIntoForm(invoiceNo);
            });
        });

        document.getElementById('sales-today').textContent = `₹ ${todayTotal.toFixed(2)}`;
        document.getElementById('sales-week').textContent = `₹ ${weekTotal.toFixed(2)}`;
        document.getElementById('sales-month').textContent = `₹ ${monthTotal.toFixed(2)}`;
    }

    async function loadBillIntoForm(invoiceNo) {
        const sale = (await StorageManager.getSales()).find(s => s.invoiceNo === invoiceNo);
        if (!sale) return;

        // Switch to billing tab
        document.querySelector('.nav-item[data-target="billing-tab"]').click();
        
        editingInvoiceNo = invoiceNo;
        document.querySelector('#billing-tab .page-header h1').textContent = `Editing Invoice #${invoiceNo}`;

        document.getElementById('bill-date').value = sale.date;
        document.getElementById('buyer-name').value = sale.buyerName;
        document.getElementById('buyer-mobile').value = sale.mobile;
        document.getElementById('buyer-gstn').value = sale.gstn || '';
        document.getElementById('buyer-address').value = sale.address || '';
        
        isPaidAmountManuallyEdited = true;
        paidAmountInput.value = sale.paidAmount;

        itemsTbody.innerHTML = '';
        for (const item of (sale.items || [])) {
            item.amount = parseFloat(item.amount || item.total) || ((parseFloat(item.price) || 0) * (parseFloat(item.qty) || 1));
            await createRow(item);
        }

        calculateGrandTotal();

        if (sale.dueAmount > 0) {
            const credit = (await StorageManager.getCredits()).find(c => c.invoiceNo === invoiceNo);
            if (credit && credit.dueDate) {
                document.getElementById('due-date').value = credit.dueDate;
            }
        }
    }

    // Render Credit Table
    async function renderCreditTable() {
        const credits = await StorageManager.getCredits();
        const tbody = document.querySelector('#credit-history-table tbody');
        tbody.innerHTML = '';

        for (const credit of credits) {
            const remaining = Math.max(0, credit.dueAmount || credit.balance || 0);
            const original = credit.originalDue || credit.total || 0;
            
            // Auto update status if math shows paid but status doesn't
            if (remaining <= 0 && credit.status !== 'Paid') {
                await StorageManager.updateCreditStatus(credit.id, 'Paid');
                credit.status = 'Paid';
            }

            const tr = document.createElement('tr');
            tr.style.fontSize = '0.85rem';
            tr.innerHTML = `
                <td style="white-space: nowrap; font-size: 0.85rem;">${formatDateDDMMYY(credit.date)}</td>
                <td style="font-weight: 500; font-size: 0.85rem;">${credit.buyerName || 'N/A'} <span style="font-size:0.75rem; color:#6B7280;">(${credit.type || 'Sale'})</span></td>
                <td style="white-space: nowrap; font-size: 0.85rem;"><a href="tel:${credit.mobile || ''}" style="color: inherit; text-decoration: none;"><i class="ph ph-phone"></i> ${credit.mobile || '-'}</a></td>
                <td style="color: #4B5563; font-size: 0.85rem; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${credit.address || ''}">${credit.address || '-'}</td>
                <td style="white-space: nowrap; font-size: 0.85rem;">${credit.dueDate ? formatDateDDMMYY(credit.dueDate) : '-'}</td>
                <td style="font-weight: 600; white-space: nowrap; font-size: 0.85rem;">₹ ${original.toFixed(2)}</td>
                <td style="font-weight: 600; white-space: nowrap; font-size: 0.85rem; color: ${remaining > 0 ? 'var(--danger-color)' : 'var(--success-color)'};">₹ ${remaining.toFixed(2)}</td>
                <td style="white-space: nowrap; font-size: 0.85rem;">
                    <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
                        <button class="btn btn-secondary btn-sm edit-due-btn" data-id="${credit.id}" data-type="${credit.type || 'Sale'}" data-balance="${remaining.toFixed(2)}" title="Edit Current Due Amount"><i class="ph ph-pencil"></i> Edit Due</button>
                        ${remaining > 0 ? `
                            <button class="btn btn-success btn-sm mark-paid-btn" data-id="${credit.id}" data-type="${credit.type || 'Sale'}">Mark Paid</button>
                            <button class="btn btn-secondary btn-sm part-pay-btn" data-id="${credit.id}" data-type="${credit.type || 'Sale'}">Part Pay</button>
                            <button class="btn btn-secondary btn-sm edit-date-btn" data-id="${credit.id}" data-type="${credit.type || 'Sale'}">Edit Date</button>
                        ` : ''}
                        <button class="btn btn-secondary btn-sm view-history-btn" data-id="${credit.id}" title="Payment History"><i class="ph ph-clock-counter-clockwise"></i></button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        }

        document.querySelectorAll('.edit-due-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                const type = e.currentTarget.dataset.type || 'Sale';
                const bal = e.currentTarget.dataset.balance || '0';

                document.getElementById('edit-due-credit-id').value = id;
                document.getElementById('edit-due-credit-type').value = type;
                document.getElementById('edit-due-amount-input').value = bal;
                document.getElementById('edit-due-modal').style.display = 'flex';
            });
        });

        document.querySelectorAll('.mark-paid-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                const type = e.currentTarget.dataset.type || 'Sale';
                document.getElementById('payment-modal-title').textContent = 'Mark as Fully Paid';
                document.getElementById('payment-credit-id').value = id;
                let typeInput = document.getElementById('payment-credit-type');
                if (!typeInput) {
                    typeInput = document.createElement('input');
                    typeInput.type = 'hidden';
                    typeInput.id = 'payment-credit-type';
                    document.getElementById('payment-modal').appendChild(typeInput);
                }
                typeInput.value = type;
                document.getElementById('payment-type').value = 'full';
                document.getElementById('payment-date').valueAsDate = new Date();
                document.getElementById('payment-amount-group').style.display = 'none';
                document.getElementById('payment-modal').style.display = 'flex';
            });
        });

        document.querySelectorAll('.part-pay-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                const type = e.currentTarget.dataset.type || 'Sale';
                document.getElementById('payment-modal-title').textContent = 'Record Part Payment';
                document.getElementById('payment-credit-id').value = id;
                let typeInput = document.getElementById('payment-credit-type');
                if (!typeInput) {
                    typeInput = document.createElement('input');
                    typeInput.type = 'hidden';
                    typeInput.id = 'payment-credit-type';
                    document.getElementById('payment-modal').appendChild(typeInput);
                }
                typeInput.value = type;
                document.getElementById('payment-type').value = 'part';
                document.getElementById('payment-date').valueAsDate = new Date();
                document.getElementById('payment-amount-group').style.display = 'block';
                document.getElementById('payment-amount').value = '';
                document.getElementById('payment-modal').style.display = 'flex';
            });
        });

        document.querySelectorAll('.edit-date-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                const type = e.currentTarget.dataset.type || 'Sale';
                const credits = await StorageManager.getCredits();
                const credit = credits.find(c => String(c.id) === String(id));
                if (credit) {
                    document.getElementById('edit-date-credit-id').value = id;
                    let editTypeInput = document.getElementById('edit-date-credit-type');
                    if (!editTypeInput) {
                        editTypeInput = document.createElement('input');
                        editTypeInput.type = 'hidden';
                        editTypeInput.id = 'edit-date-credit-type';
                        document.getElementById('edit-date-modal').appendChild(editTypeInput);
                    }
                    editTypeInput.value = type;
                    document.getElementById('edit-target-date').value = credit.dueDate || '';
                    document.getElementById('edit-date-modal').style.display = 'flex';
                }
            });
        });

        document.querySelectorAll('.view-history-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                renderPaymentHistory(id);
                document.getElementById('payment-history-modal').style.display = 'flex';
            });
        });
        
        renderPassbook();
    }

    async function renderPaymentHistory(creditId) {
        const credits = await StorageManager.getCredits();
        const credit = credits.find(c => String(c.id) === String(creditId));
        const tbody = document.querySelector('#payment-history-table tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        
        if (!credit || !credit.payments || credit.payments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align: center;">No payment history found.</td></tr>';
            return;
        }

        credit.payments.forEach((payment, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${payment.date}</td>
                <td>₹ ${(parseFloat(payment.amount) || 0).toFixed(2)}</td>
                <td>
                    <button class="btn btn-secondary btn-sm delete-payment-btn" data-credit-id="${creditId}" data-index="${index}"><i class="ph ph-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.delete-payment-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if (confirm('Are you sure you want to delete this payment?')) {
                    const cId = e.currentTarget.dataset.creditId;
                    const pIdx = parseInt(e.currentTarget.dataset.index, 10);
                    await StorageManager.removePaymentFromCredit(cId, pIdx);
                    renderPaymentHistory(cId);
                    renderCreditTable();
                    renderHomeDashboard();
                }
            });
        });
    }

    // --- PARTIES DATALIST ---
    async function updatePartiesDatalist() {
        const parties = await StorageManager.getParties();
        const datalist = document.getElementById('parties-list');
        if (datalist) {
            datalist.innerHTML = '';
            parties.forEach(p => {
                const option = document.createElement('option');
                option.value = p.name;
                datalist.appendChild(option);
            });
        }
    }
    updatePartiesDatalist();

    // --- PURCHASES UI ---
    // Autofill Vendor Info and render history
    const purchaseVendorNameInput = document.getElementById('purchase-vendor-name');
    const purchaseVendorMobileInput = document.getElementById('purchase-vendor-mobile');
    const vendorHistoryContainer = document.getElementById('vendor-history-container');
    const vendorHistoryList = document.getElementById('vendor-history-list');

    if (purchaseVendorNameInput) {
        purchaseVendorNameInput.addEventListener('input', async (e) => {
            const typedName = e.target.value.toLowerCase().trim();
            if (!typedName) {
                vendorHistoryContainer.style.display = 'none';
                return;
            }

            const parties = await StorageManager.getParties();
            const party = parties.find(p => p.name.toLowerCase() === typedName);

            if (party) {
                purchaseVendorMobileInput.value = party.mobile || '';

                // Fetch past purchases from this vendor
                const purchases = await StorageManager.getPurchases()
                    .filter(p => p.vendorName.toLowerCase() === typedName)
                    .sort((a, b) => b.id - a.id) // Newest first
                    .slice(0, 3); // Last 3 purchases

                if (purchases.length > 0) {
                    vendorHistoryList.innerHTML = purchases.map(p => {
                        const itemsStr = (p.items && p.items.length > 0) 
                            ? p.items.map(i => `${i.category} - ${i.brand} - ${i.variant} - Qty: ${i.qty} - ₹${i.price}`).join('<br>') 
                            : 'No items';
                        const amount = p.totalAmount || p.total || 0;
                        return `<li>${p.date}: <strong style="color: var(--secondary-color);">₹ ${amount.toFixed(2)}</strong><br><small style="color: var(--text-muted); display: block; margin-bottom: 0.25rem;">Items: ${itemsStr}</small></li>`;
                    }).join('');
                } else {
                    vendorHistoryList.innerHTML = '<li>No previous purchases found from this vendor.</li>';
                }
                
                vendorHistoryContainer.style.display = 'block';
            } else {
                vendorHistoryContainer.style.display = 'none';
            }
        });
    }

    let purchaseItemsCount = 0;
    
    async function createPurchaseRow() {
        purchaseItemsCount++;
        const inventory = await StorageManager.getInventory();
        const categories = [...new Set(inventory.map(i => i.category))];

        const tr = document.createElement('tr');
        tr.className = 'item-row';
        
        const catSelect = document.createElement('select');
        catSelect.className = 'p-category';
        catSelect.innerHTML = `<option value="">Select</option>` + categories.map(c => `<option value="${c}">${c}</option>`).join('');
        
        const brandSelect = document.createElement('select');
        brandSelect.className = 'p-brand';
        brandSelect.innerHTML = `<option value="">Select</option>`;
        
        const varSelect = document.createElement('select');
        varSelect.className = 'p-variant';
        varSelect.innerHTML = `<option value="">Select</option>`;
        
        const hsnInput = document.createElement('input');
        hsnInput.type = 'text'; hsnInput.className = 'p-hsn'; hsnInput.placeholder = 'HSN'; hsnInput.style.width = '80px';
        
        const priceInput = document.createElement('input');
        priceInput.type = 'number'; priceInput.className = 'p-price'; priceInput.placeholder = '0.00'; priceInput.min = '0'; priceInput.step = '0.01';
        
        const qtyInput = document.createElement('input');
        qtyInput.type = 'number'; qtyInput.className = 'p-qty'; qtyInput.placeholder = '0'; qtyInput.min = '1';
        
        const amountDisplay = document.createElement('span');
        amountDisplay.className = 'item-amount-display p-amount-disp';
        amountDisplay.textContent = '₹ 0.00';
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn btn-icon p-remove-row-btn';
        removeBtn.innerHTML = '<i class="ph ph-trash"></i>';
        
        // Append to row
        [catSelect, brandSelect, varSelect, hsnInput, priceInput, qtyInput].forEach(el => {
            const td = document.createElement('td');
            td.appendChild(el);
            tr.appendChild(td);
        });
        let tdAmount = document.createElement('td'); tdAmount.appendChild(amountDisplay); tr.appendChild(tdAmount);
        let tdAction = document.createElement('td'); tdAction.appendChild(removeBtn); tr.appendChild(tdAction);

        // Event Listeners for cascading
        catSelect.addEventListener('change', async (e) => {
            const cat = e.target.value;
            brandSelect.innerHTML = `<option value="">Select</option>`;
            varSelect.innerHTML = `<option value="">Select</option>`;
            hsnInput.value = '';
            if (cat) {
                const brands = [...new Set(inventory.filter(i => i.category === cat).map(i => i.brand))];
                brands.forEach(b => brandSelect.innerHTML += `<option value="${b}">${b}</option>`);
                hsnInput.value = getHsnForCategory(cat);
            }
        });

        brandSelect.addEventListener('change', async (e) => {
            const cat = catSelect.value;
            const brand = e.target.value;
            varSelect.innerHTML = `<option value="">Select</option>`;
            if (cat && brand) {
                const variants = inventory.filter(i => i.category === cat && i.brand === brand);
                variants.forEach(v => {
                    varSelect.innerHTML += `<option value="${v.variant}">${v.variant}</option>`;
                });
            }
        });

        varSelect.addEventListener('change', async (e) => {
            const cat = catSelect.value;
            const brand = brandSelect.value;
            const variant = e.target.value;
            if (cat && brand && variant) {
                const item = inventory.find(i => i.category === cat && i.brand === brand && i.variant === variant);
                if (item && item.hsn) {
                    hsnInput.value = item.hsn;
                }
            }
        });

        const calcAmount = () => {
            const qty = parseFloat(qtyInput.value) || 0;
            const price = parseFloat(priceInput.value) || 0;
            const amt = qty * price;
            amountDisplay.textContent = `₹ ${amt.toFixed(2)}`;
            calculatePurchaseTotal();
        };

        qtyInput.addEventListener('input', calcAmount);
        priceInput.addEventListener('input', calcAmount);
        
        removeBtn.addEventListener('click', async () => {
            tr.remove();
            calculatePurchaseTotal();
        });

        document.querySelector('#purchase-items-table tbody').appendChild(tr);
    }

    function calculatePurchaseTotal() {
        let total = 0;
        document.querySelectorAll('#purchase-items-table .item-row').forEach(row => {
            const qty = parseFloat(row.querySelector('.p-qty').value) || 0;
            const price = parseFloat(row.querySelector('.p-price').value) || 0;
            total += (qty * price);
        });
        const gTotal = document.getElementById('purchase-grand-total');
        if(gTotal) gTotal.textContent = `₹ ${total.toFixed(2)}`;
        return total;
    }

    const addPurchaseRowBtn = document.getElementById('add-purchase-row-btn');
    if (addPurchaseRowBtn) {
        addPurchaseRowBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            createPurchaseRow();
        });
        // Add initial row
        createPurchaseRow();
    }

    const savePurchaseBtn = document.getElementById('save-purchase-btn');
    if (savePurchaseBtn) {
        savePurchaseBtn.addEventListener('click', async () => {
            const vendorName = document.getElementById('purchase-vendor-name').value;
            const date = document.getElementById('purchase-date').value;
            
            if (!vendorName || !date) {
                alert('Please fill Vendor Name and Date');
                return;
            }

            const items = [];
            document.querySelectorAll('#purchase-items-table .item-row').forEach(row => {
                const cat = row.querySelector('.p-category').value;
                const brand = row.querySelector('.p-brand').value;
                const variant = row.querySelector('.p-variant').value;
                const hsn = row.querySelector('.p-hsn').value || getHsnForCategory(cat);
                const price = parseFloat(row.querySelector('.p-price').value) || 0;
                const qty = parseInt(row.querySelector('.p-qty').value) || 0;

                if (cat && brand && variant && qty > 0) {
                    items.push({ category: cat, brand, variant, hsn, price, qty });
                }
            });

            if (items.length === 0) {
                alert('Please add at least one valid item');
                return;
            }

            const totalAmount = calculatePurchaseTotal();
            const paidAmount = parseFloat(document.getElementById('purchase-paid-amount').value) || 0;
            const balance = totalAmount - paidAmount;
            const gstn = document.getElementById('purchase-vendor-gstn').value || '';
            
            await StorageManager.savePurchase({
                billNo: 'PUR-' + Date.now().toString().slice(-6),
                vendorName,
                date,
                mobile: document.getElementById('purchase-vendor-mobile').value || '',
                gstn,
                items,
                totalAmount,
                paidAmount,
                balance
            });

            // Immediately reload inventory and refresh views
            await StorageManager.getInventory();
            updatePartiesDatalist();
            renderPurchaseHistoryTable();
            renderInventoryTable();
            
            // Refresh billing form items to include new items in dropdowns
            itemsTbody.innerHTML = '';
            createRow();
            
            alert('Purchase saved successfully and inventory updated!');
            
            // Reset form
            document.getElementById('purchase-vendor-name').value = '';
            document.getElementById('purchase-vendor-mobile').value = '';
            document.getElementById('purchase-vendor-gstn').value = '';
            document.getElementById('purchase-paid-amount').value = '';
            document.getElementById('purchase-date').valueAsDate = new Date();
            document.querySelector('#purchase-items-table tbody').innerHTML = '';
            createPurchaseRow();
            calculatePurchaseTotal();
        });
    }

    async function renderPurchaseHistoryTable() {
        const tbody = document.querySelector('#purchase-history-table tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        const purchases = (await StorageManager.getPurchases()).slice().reverse(); // Newest first

        if (purchases.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No purchases found.</td></tr>';
            return;
        }

        purchases.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${p.date}</td>
                <td>${p.vendorName}</td>
                <td>${(p.items || []).length}</td>
                <td>₹ ${(parseFloat(p.totalAmount || p.total) || 0).toFixed(2)}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    // --- INVENTORY MANAGEMENT UI ---
    const inventoryModal = document.getElementById('inventory-modal');
    const closeBtn = document.getElementById('close-modal-btn');
    const saveInvBtn = document.getElementById('save-inv-btn');
    const addInvBtn = document.getElementById('add-inventory-btn');



    document.querySelectorAll('#inventory-filters .filter-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            document.querySelectorAll('#inventory-filters .filter-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            currentInventoryFilter = e.currentTarget.dataset.filter;
            renderInventoryTable();
        });
    });

    async function renderInventoryTable() {
        let inventory = await StorageManager.getInventory();
        
        if (currentInventoryFilter !== 'all') {
            inventory = inventory.filter(item => {
                if (currentInventoryFilter === '0') return item.quantity === 0;
                if (currentInventoryFilter === '1-3') return item.quantity >= 1 && item.quantity <= 3;
                if (currentInventoryFilter === '4-10') return item.quantity >= 4 && item.quantity <= 10;
                if (currentInventoryFilter === '11-30') return item.quantity >= 11 && item.quantity <= 30;
                if (currentInventoryFilter === '31-50') return item.quantity >= 31 && item.quantity <= 50;
                if (currentInventoryFilter === '51-100') return item.quantity >= 51 && item.quantity <= 100;
                return true;
            });
        }

        const container = document.getElementById('inventory-container');
        container.innerHTML = '';

        // Group by Category -> Brand -> Variant = Item
        const grouped = {};
        inventory.forEach(item => {
            if (!grouped[item.category]) grouped[item.category] = { brands: new Set(), variants: new Set(), items: {} };
            grouped[item.category].brands.add(item.brand);
            grouped[item.category].variants.add(item.variant);
            
            if (!grouped[item.category].items[item.brand]) {
                grouped[item.category].items[item.brand] = {};
            }
            grouped[item.category].items[item.brand][item.variant] = item;
        });

        for (const cat in grouped) {
            const brands = Array.from(grouped[cat].brands);
            const variants = Array.from(grouped[cat].variants);

            const catSection = document.createElement('div');
            catSection.style.marginBottom = '3rem';
            
            const catTitle = document.createElement('h4');
            catTitle.textContent = cat;
            catTitle.style.fontSize = '1.3rem';
            catTitle.style.color = 'var(--primary-color)';
            catTitle.style.marginBottom = '1rem';
            catTitle.style.borderBottom = '2px solid var(--border-color)';
            catTitle.style.paddingBottom = '0.5rem';
            catSection.appendChild(catTitle);

            const tableWrap = document.createElement('div');
            tableWrap.className = 'table-responsive';

            const table = document.createElement('table');
            table.className = 'data-table';
            table.style.width = '100%';
            table.style.borderCollapse = 'collapse';

            // Header Row (Variants)
            const thead = document.createElement('thead');
            const trHead = document.createElement('tr');
            const thEmpty = document.createElement('th');
            thEmpty.textContent = 'Brand / Variant';
            thEmpty.style.backgroundColor = '#F3F4F6';
            trHead.appendChild(thEmpty);

            variants.forEach(variant => {
                const th = document.createElement('th');
                
                // Extract HSN for this variant
                let hsn = '';
                for (const b of brands) {
                    if (grouped[cat].items[b] && grouped[cat].items[b][variant]) {
                        hsn = grouped[cat].items[b][variant].hsn || getHsnForCategory(cat);
                        break;
                    }
                }

                th.innerHTML = `${variant}<br><span style="font-size: 0.85em; color: #888; font-weight: normal;">HSN: ${hsn}</span>`;
                th.style.textAlign = 'center';
                th.style.backgroundColor = '#F9FAFB';
                trHead.appendChild(th);
            });
            thead.appendChild(trHead);
            table.appendChild(thead);

            // Body Rows (Brands)
            const tbody = document.createElement('tbody');
            brands.forEach(brand => {
                const tr = document.createElement('tr');
                const tdBrand = document.createElement('td');
                tdBrand.textContent = brand;
                tdBrand.style.fontWeight = '600';
                tdBrand.style.backgroundColor = '#F9FAFB';
                tr.appendChild(tdBrand);

                variants.forEach(variant => {
                    const td = document.createElement('td');
                    td.style.textAlign = 'center';
                    const item = grouped[cat].items[brand]?.[variant];
                    
                    if (item) {
                        let stockColor = '#10B981'; // Green
                        if (item.quantity < 10) stockColor = '#EF4444'; // Red
                        else if (item.quantity <= 30) stockColor = '#F59E0B'; // Orange
                        
                        td.innerHTML = `
                            <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                                <span style="color: ${stockColor}; font-weight: bold; font-size: 1.1em;">${item.quantity}</span>
                                <button class="btn btn-icon stock-cell" data-id="${item.id}" title="Edit Item" style="padding: 0.25rem; font-size: 0.9rem; border: 1px solid #E5E7EB; border-radius: 4px; background: #fff;">
                                    <i class="ph ph-pencil"></i>
                                </button>
                            </div>
                        `;
                    } else {
                        td.innerHTML = `<span style="color: #ccc;">-</span>`;
                    }
                    tr.appendChild(td);
                });
                tbody.appendChild(tr);
            });

            table.appendChild(tbody);
            tableWrap.appendChild(table);
            catSection.appendChild(tableWrap);
            container.appendChild(catSection);
        }

        // Add event listeners for editing stock cells
        document.querySelectorAll('.stock-cell').forEach(cell => {
            cell.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                const item = (await StorageManager.getInventory()).find(i => i.id === id);
                if (item) {
                    document.getElementById('modal-title').textContent = 'Edit Inventory Item';
                    document.getElementById('inv-id-input').value = item.id;
                    document.getElementById('inv-cat-input').value = item.category;
                    document.getElementById('inv-brand-input').value = item.brand;
                    document.getElementById('inv-var-input').value = item.variant;
                    document.getElementById('inv-hsn-input').value = item.hsn || getHsnForCategory(item.category);
                    document.getElementById('inv-stock-input').value = item.quantity;
                    
                    document.getElementById('inv-cat-input').disabled = true;
                    document.getElementById('inv-brand-input').disabled = true;
                    document.getElementById('inv-var-input').disabled = true;
                    
                    document.getElementById('delete-inv-btn').style.display = 'inline-flex';
                    inventoryModal.style.display = 'flex';
                }
            });
        });
    }

    addInvBtn.addEventListener('click', async () => {
        document.getElementById('modal-title').textContent = 'Add Inventory Item';
        document.getElementById('inv-id-input').value = '';
        document.getElementById('inv-cat-input').value = '';
        document.getElementById('inv-brand-input').value = '';
        document.getElementById('inv-var-input').value = '';
        document.getElementById('inv-hsn-input').value = '';
        document.getElementById('inv-stock-input').value = '3';
        
        document.getElementById('inv-cat-input').disabled = false;
        document.getElementById('inv-brand-input').disabled = false;
        document.getElementById('inv-var-input').disabled = false;
        
        document.getElementById('delete-inv-btn').style.display = 'none';
        inventoryModal.style.display = 'flex';
    });
    
    document.getElementById('delete-inv-btn').addEventListener('click', async () => {
        const id = document.getElementById('inv-id-input').value;
        if (id && confirm('Are you sure you want to delete this item?')) {
            await StorageManager.deleteInventoryItem(id);
            inventoryModal.style.display = 'none';
            renderInventoryTable();
        }
    });

    closeBtn.addEventListener('click', async () => {
        inventoryModal.style.display = 'none';
    });

    saveInvBtn.addEventListener('click', async () => {
        const id = document.getElementById('inv-id-input').value;
        const category = document.getElementById('inv-cat-input').value.trim();
        const brand = document.getElementById('inv-brand-input').value.trim();
        const variant = document.getElementById('inv-var-input').value.trim();
        let hsn = document.getElementById('inv-hsn-input').value.trim();
        const stock = parseInt(document.getElementById('inv-stock-input').value) || 0;

        if (!category || !brand || !variant) {
            alert('Please fill out all fields.');
            return;
        }
        if (!hsn) hsn = getHsnForCategory(category);

        const itemData = {
            category, brand, variant, hsn, quantity: stock
        };
        if (id) itemData.id = id;

        await StorageManager.saveInventoryItem(itemData);
        inventoryModal.style.display = 'none';
        renderInventoryTable();

        // Refresh billing form to show new items
        itemsTbody.innerHTML = '';
        createRow();
    });

    // --- PARTIES / CUSTOMERS UI ---
    let currentSortByDue = false;
    
    async function renderPartiesTable() {
        const [parties, sales, purchases, credits] = await Promise.all([
            StorageManager.getParties(),
            StorageManager.getSales(),
            StorageManager.getPurchases(),
            StorageManager.getCredits()
        ]);
        const tbody = document.querySelector('#parties-table tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        // Calculate Total Trade (Sales + Purchases) and Clubbed Dues for each party
        const enrichedParties = parties.map(party => {
            const pName = (party.name || '').toLowerCase().trim();
            const pMobile = (party.mobile || '').trim();

            const matchesParty = (item) => {
                const iName = (item.buyerName || item.vendorName || item.partyName || item.name || '').toLowerCase().trim();
                const iMobile = (item.mobile || '').trim();
                return (pMobile && iMobile && pMobile === iMobile) || (pName && iName && pName === iName);
            };

            const partySales = sales.filter(matchesParty);
            const partyPurchases = purchases.filter(matchesParty);

            const totalSalesAmt = partySales.reduce((sum, s) => sum + (parseFloat(s.total || s.grandTotal) || 0), 0);
            const totalPurchasesAmt = partyPurchases.reduce((sum, p) => sum + (parseFloat(p.totalAmount || p.total) || 0), 0);
            const totalTrade = totalSalesAmt + totalPurchasesAmt;

            // Club all dues regarding customer or vendor
            const partyCredits = credits.filter(c => matchesParty(c) && c.status !== 'Paid');
            const clubbedDue = partyCredits.reduce((sum, c) => sum + (parseFloat(c.dueAmount || c.balance) || 0), 0);

            return { ...party, totalTrade, dueAmount: clubbedDue };
        });
        
        if (currentSortByDue) {
            enrichedParties.sort((a, b) => b.dueAmount - a.dueAmount);
        } else {
            enrichedParties.sort((a, b) => b.totalTrade - a.totalTrade);
        }
        
        enrichedParties.forEach(party => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-weight: 500;">${party.name}</td>
                <td><a href="tel:${party.mobile || ''}" style="color: inherit; text-decoration: none;"><i class="ph ph-phone"></i> ${party.mobile || '-'}</a></td>
                <td>${party.gstn || '-'}</td>
                <td>${party.address || '-'}</td>
                <td style="font-weight: bold; color: var(--success-color);">₹ ${party.totalTrade.toFixed(2)}</td>
                <td style="font-weight: bold; color: ${party.dueAmount > 0 ? 'var(--danger-color)' : 'var(--text-muted)'};">₹ ${party.dueAmount.toFixed(2)}</td>
                <td>
                    <button class="btn btn-icon edit-party-btn" data-id="${party.id}" title="Edit Party">
                        <i class="ph ph-pencil"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        document.querySelectorAll('.edit-party-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                const party = (await StorageManager.getParties()).find(p => String(p.id) === String(id));
                if (party) {
                    document.getElementById('party-modal-title').textContent = 'Edit Customer';
                    document.getElementById('party-id-input').value = party.id;
                    document.getElementById('party-name-input').value = party.name;
                    document.getElementById('party-mobile-input').value = party.mobile;
                    document.getElementById('party-gstn-input').value = party.gstn || '';
                    document.getElementById('party-address-input').value = party.address || '';
                    
                    document.getElementById('party-modal').style.display = 'flex';
                }
            });
        });
    }

    const sortDueBtn = document.getElementById('sort-due-btn');
    if (sortDueBtn) {
        sortDueBtn.addEventListener('click', async () => {
            currentSortByDue = !currentSortByDue;
            if (currentSortByDue) {
                sortDueBtn.classList.add('btn-primary');
                sortDueBtn.classList.remove('btn-secondary');
            } else {
                sortDueBtn.classList.remove('btn-primary');
                sortDueBtn.classList.add('btn-secondary');
            }
            renderPartiesTable();
        });
    }

    const partyModal = document.getElementById('party-modal');
    const closePartyBtn = document.getElementById('close-party-modal-btn');
    const savePartyBtn = document.getElementById('save-party-btn');

    if (closePartyBtn) {
        closePartyBtn.addEventListener('click', async () => {
            partyModal.style.display = 'none';
        });
    }

    if (savePartyBtn) {
        savePartyBtn.addEventListener('click', async () => {
            const id = document.getElementById('party-id-input').value;
            const name = document.getElementById('party-name-input').value.trim();
            const mobile = document.getElementById('party-mobile-input').value.trim();
            const gstn = document.getElementById('party-gstn-input').value.trim();
            const address = document.getElementById('party-address-input').value.trim();
            
            if (!name || !mobile) {
                alert('Name and Mobile are required!');
                return;
            }
            
            await StorageManager.saveParty({
                id: id ? id : undefined,
                name,
                mobile,
                gstn,
                address
            });
            
            partyModal.style.display = 'none';
            renderPartiesTable();
        });
    }

    const addPartyBtn = document.getElementById('add-party-btn');
    if (addPartyBtn) {
        addPartyBtn.addEventListener('click', async () => {
            document.getElementById('party-modal-title').textContent = 'Add New Customer';
            document.getElementById('party-id-input').value = '';
            document.getElementById('party-name-input').value = '';
            document.getElementById('party-mobile-input').value = '';
            document.getElementById('party-gstn-input').value = '';
            document.getElementById('party-address-input').value = '';
            partyModal.style.display = 'flex';
        });
    }

    // --- PASSBOOK & MODALS LOGIC ---
    async function renderPassbook() {
        const [sales, purchases, credits] = await Promise.all([
            StorageManager.getSales(),
            StorageManager.getPurchases(),
            StorageManager.getCredits()
        ]);
        const tbody = document.querySelector('#passbook-table tbody');
        if(!tbody) return;
        tbody.innerHTML = '';
        
        let totalSalesAmount = 0;
        let totalPurchasesAmount = 0;
        let ledger = [];
        
        sales.forEach(sale => {
            const amt = parseFloat(sale.total || sale.grandTotal) || 0;
            totalSalesAmount += amt;
            ledger.push({
                timestamp: new Date(sale.date).getTime(),
                dateStr: sale.date,
                ref: `Sale: #${sale.invoiceNo} (${sale.buyerName})`,
                isSale: true,
                debit: 0,
                credit: amt
            });
        });

        purchases.forEach(purchase => {
            const amt = parseFloat(purchase.totalAmount || purchase.total) || 0;
            totalPurchasesAmount += amt;
            ledger.push({
                timestamp: new Date(purchase.date).getTime(),
                dateStr: purchase.date,
                ref: `Purchase: #${purchase.billNo} (${purchase.vendorName})`,
                isPurchase: true,
                debit: amt,
                credit: 0
            });
        });

        // Credit payments
        credits.forEach(credit => {
            if (credit.payments) {
                credit.payments.forEach(p => {
                    ledger.push({
                        timestamp: new Date(p.date).getTime(),
                        dateStr: p.date,
                        ref: `Khata Payment: #${credit.invoiceNo || credit.billNo} (${credit.buyerName || credit.vendorName})`,
                        isPayment: true,
                        debit: 0,
                        credit: parseFloat(p.amount) || 0
                    });
                });
            }
        });

        // Compute running balance chronologically
        ledger.sort((a, b) => a.timestamp - b.timestamp);
        let runningBalance = 0;
        ledger.forEach(entry => {
            runningBalance += (entry.credit - entry.debit);
            entry.balance = runningBalance;
        });

        // Display Newest to Oldest in table
        ledger.sort((a, b) => b.timestamp - a.timestamp);

        // Display summary cards
        const passbookSalesCard = document.getElementById('passbook-total-sales');
        if (passbookSalesCard) passbookSalesCard.textContent = `₹ ${totalSalesAmount.toFixed(2)}`;

        const passbookPurchasesCard = document.getElementById('passbook-total-purchases');
        if (passbookPurchasesCard) passbookPurchasesCard.textContent = `₹ ${totalPurchasesAmount.toFixed(2)}`;

        const topLiveBalance = document.getElementById('top-live-balance');
        if (topLiveBalance) {
            topLiveBalance.textContent = `₹ ${(totalSalesAmount - totalPurchasesAmount).toFixed(2)}`;
        }

        ledger.forEach(entry => {
            const tr = document.createElement('tr');
            let refHtml = entry.ref;
            if (entry.isSale) {
                refHtml = `<span style="color: #059669; font-weight: 600;"><i class="ph ph-arrow-down-left"></i> ${entry.ref}</span>`;
            } else if (entry.isPurchase) {
                refHtml = `<span style="color: #dc2626; font-weight: 600;"><i class="ph ph-arrow-up-right"></i> ${entry.ref}</span>`;
            } else if (entry.isPayment) {
                refHtml = `<span style="color: #2563eb; font-weight: 500;"><i class="ph ph-hand-coins"></i> ${entry.ref}</span>`;
            }

            tr.innerHTML = `
                <td style="white-space: nowrap;">${formatDateDDMMYY(entry.dateStr)}</td>
                <td>${refHtml}</td>
                <td style="font-weight: 600; color: #dc2626;">${entry.debit > 0 ? '₹ ' + entry.debit.toFixed(2) : '-'}</td>
                <td style="font-weight: 600; color: #059669;">${entry.credit > 0 ? '₹ ' + entry.credit.toFixed(2) : '-'}</td>
                <td style="font-weight: 600;">₹ ${(entry.balance || 0).toFixed(2)}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Edit Due Modal Actions
    document.getElementById('cancel-edit-due-btn')?.addEventListener('click', () => {
        document.getElementById('edit-due-modal').style.display = 'none';
    });

    document.getElementById('save-edit-due-btn')?.addEventListener('click', async () => {
        const id = document.getElementById('edit-due-credit-id').value;
        const type = document.getElementById('edit-due-credit-type').value || 'Sale';
        const newBal = parseFloat(document.getElementById('edit-due-amount-input').value);

        if (isNaN(newBal) || newBal < 0) {
            alert('Please enter a valid due amount.');
            return;
        }

        await StorageManager.updateCreditBalance(id, newBal, type);
        document.getElementById('edit-due-modal').style.display = 'none';
        renderCreditTable();
        renderHomeDashboard();
    });

    // Payment Modal Actions
    document.getElementById('cancel-payment-btn')?.addEventListener('click', async () => {
        document.getElementById('payment-modal').style.display = 'none';
    });

    document.getElementById('save-payment-btn')?.addEventListener('click', async () => {
        const id = document.getElementById('payment-credit-id').value;
        const type = document.getElementById('payment-type').value;
        const date = document.getElementById('payment-date').value;
        const creditType = document.getElementById('payment-credit-type')?.value || 'Sale';
        
        if (!date) {
            alert('Please select a date.');
            return;
        }

        if (type === 'full') {
            await StorageManager.markCreditAsPaid(id, date, creditType);
        } else if (type === 'part') {
            const amount = parseFloat(document.getElementById('payment-amount').value);
            if (isNaN(amount) || amount <= 0) {
                alert('Please enter a valid amount.');
                return;
            }
            await StorageManager.addPaymentToCredit(id, amount, date, 'Cash', '', creditType);
        }
        
        document.getElementById('payment-modal').style.display = 'none';
        renderCreditTable();
        renderHomeDashboard();
    });

    // Edit Date Modal Actions
    document.getElementById('cancel-edit-date-btn')?.addEventListener('click', async () => {
        document.getElementById('edit-date-modal').style.display = 'none';
    });

    document.getElementById('save-edit-date-btn')?.addEventListener('click', async () => {
        const id = document.getElementById('edit-date-credit-id').value;
        const newDate = document.getElementById('edit-target-date').value;
        const creditType = document.getElementById('edit-date-credit-type')?.value || 'Sale';
        
        if (!newDate) {
            alert('Please select a date.');
            return;
        }
        
        await StorageManager.updateCreditDueDate(id, newDate, creditType);
        document.getElementById('edit-date-modal').style.display = 'none';
        renderCreditTable();
    });

    document.getElementById('close-history-modal-btn')?.addEventListener('click', async () => {
        document.getElementById('payment-history-modal').style.display = 'none';
    });

    // --- MANTRA ROTATION LOGIC ---
    const mantras = [
        "\"सर्वाबाधा विनिर्मुक्तो धन धान्य सुतान्वितः। मनुष्यो मत्प्रसादेन भविष्यति न संशयः॥\"",
        "\"या देवी सर्वभूतेषु बुद्धिरूपेण संस्थिता। नमस्तस्यै नमस्तस्यै नमस्तस्यै नमो नमः॥\"",
        "\"दुर्गे स्मृता हरसि भीतिमशेषजन्तोः स्वस्थैः स्मृता मतिमतीव शुभां ददासि।\"",
        "\"दारिद्र्यदुःखभयहारिणि का त्वदन्या सर्वोपकारकरणाय सदार्द्रचित्ता॥\"",
        "\"देहि सौभाग्यमारोग्यं देहि मे परमं सुखम्। रूपं देहि जयं देहि यशो देहि द्विषो जहि॥\""
    ];
    
    const mantraContainer = document.getElementById('mantra-container');
    if (mantraContainer) {
        let currentMantraIndex = 0;
        mantraContainer.textContent = mantras[currentMantraIndex];
        
        setInterval(() => {
            // Fade out
            mantraContainer.style.opacity = '0';
            
            setTimeout(() => {
                // Change text and fade in
                currentMantraIndex = (currentMantraIndex + 1) % mantras.length;
                mantraContainer.textContent = mantras[currentMantraIndex];
                mantraContainer.style.opacity = '1';
            }, 1000); // Wait 1 second for fade out transition before changing text
            
        }, 10000); // 10 seconds interval
    }

    // Initial renders
    try {
        if (typeof renderHomeDashboard === 'function') renderHomeDashboard();
        if (typeof renderSalesTable === 'function') renderSalesTable();
        if (typeof renderCreditTable === 'function') renderCreditTable();
        if (typeof renderPartiesTable === 'function') renderPartiesTable();
    } catch (err) {
        console.warn("Initial render error:", err);
    }
});
