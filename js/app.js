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

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Inventory on first load if empty
    let inventory = StorageManager.getInventory();
    
    // One-time migration: Apply HSN to existing inventory items if missing
    let updated = false;
    inventory = inventory.map(item => {
        if (!item.hsn) {
            item.hsn = getHsnForCategory(item.category);
            updated = true;
        }
        return item;
    });
    if (updated) {
        localStorage.setItem('sb_inventory_v2', JSON.stringify(inventory));
    }

    // Set default date
    document.getElementById('bill-date').valueAsDate = new Date();
    if(document.getElementById('purchase-date')) document.getElementById('purchase-date').valueAsDate = new Date();
    
    let editingInvoiceNo = null;

    // Sidebar Toggle
    const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
    const sidebar = document.querySelector('.sidebar');
    if (sidebarToggleBtn && sidebar) {
        sidebarToggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }

    // Tab Navigation
    const navItems = document.querySelectorAll('.nav-item');
    const tabPanes = document.querySelectorAll('.tab-pane');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
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
    function renderHomeDashboard() {
        const sales = StorageManager.getSales();
        const credits = StorageManager.getCredits();
        
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
            totalRevenue += sale.total;
            
            if (saleDate >= startOfDay) todaySales += sale.total;
            if (saleDate >= startOfWeek) weeklySales += sale.total;
            if (saleDate >= startOfMonth) monthlySales += sale.total;
        });

        const avgOrder = sales.length > 0 ? (totalRevenue / sales.length) : 0;
        
        let totalDue = 0;
        credits.forEach(credit => {
            if (credit.status !== 'Paid') {
                const totalPaid = credit.payments ? credit.payments.reduce((sum, p) => sum + p.amount, 0) : 0;
                totalDue += (credit.total - totalPaid);
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
    }
    
    renderHomeDashboard();

    // Paid Amount and Due Amount Logic
    const paidAmountInput = document.getElementById('paid-amount');
    const dueDateGroup = document.querySelector('.due-date-group');
    const dueAmountContainer = document.getElementById('due-amount-container');
    const dueAmountDisplay = document.getElementById('due-amount');
    
    let isPaidAmountManuallyEdited = false;

    paidAmountInput.addEventListener('input', () => {
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

    function createRow(itemData = null) {
        const inventory = StorageManager.getInventory();
        const categories = [...new Set(inventory.map(i => i.category))];

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
        catSelect.addEventListener('change', (e) => {
            const cat = e.target.value;
            brandSelect.innerHTML = `<option value="">Select</option>`;
            varSelect.innerHTML = `<option value="">Select</option>`;
            if (cat) {
                const brands = [...new Set(inventory.filter(i => i.category === cat).map(i => i.brand))];
                brands.forEach(b => brandSelect.innerHTML += `<option value="${b}">${b}</option>`);
            }
        });

        brandSelect.addEventListener('change', (e) => {
            const cat = catSelect.value;
            const brand = e.target.value;
            varSelect.innerHTML = `<option value="">Select</option>`;
            hsnInput.value = '';
            if (cat && brand) {
                const variants = inventory.filter(i => i.category === cat && i.brand === brand);
                variants.forEach(v => {
                    varSelect.innerHTML += `<option value="${v.variant}">${v.variant} (Stock: ${v.stock})</option>`;
                });
            }
        });

        varSelect.addEventListener('change', (e) => {
            const cat = catSelect.value;
            const brand = brandSelect.value;
            const variant = e.target.value;
            if (cat && brand && variant) {
                const item = inventory.find(i => i.category === cat && i.brand === brand && i.variant === variant);
                if (item) {
                    hsnInput.value = item.hsn || getHsnForCategory(cat);
                }
            } else {
                hsnInput.value = '';
            }
        });

        // Event listeners for calculations
        [priceInput, qtyInput].forEach(input => {
            input.addEventListener('input', () => {
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
            priceInput.value = itemData.price;
            qtyInput.value = itemData.qty;
            amountDisplay.textContent = `₹ ${itemData.amount.toFixed(2)}`;
            amountDisplay.dataset.value = itemData.amount;
        }

        itemsTbody.appendChild(tr);
    }

    addRowBtn.addEventListener('click', (e) => {
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

    if (buyerNameInput) {
        buyerNameInput.addEventListener('input', (e) => {
            const typedName = e.target.value.toLowerCase().trim();
            if (!typedName) {
                buyerHistoryContainer.style.display = 'none';
                return;
            }

            const parties = StorageManager.getParties();
            const party = parties.find(p => p.name.toLowerCase() === typedName);

            if (party) {
                buyerMobileInput.value = party.mobile || '';
                buyerGstnInput.value = party.gstn || '';
                buyerAddressInput.value = party.address || '';

                // Fetch history
                const sales = StorageManager.getSales()
                    .filter(s => s.buyerName.toLowerCase() === typedName)
                    .sort((a, b) => b.id - a.id) // Newest first
                    .slice(0, 3); // Last 3 purchases

                const credits = StorageManager.getCredits().filter(c => c.buyerName.toLowerCase() === typedName);
                const totalDue = credits.reduce((sum, c) => {
                    const paid = c.payments.reduce((pSum, p) => pSum + p.amount, 0);
                    return sum + (c.dueAmount - paid);
                }, 0);

                if (sales.length > 0) {
                    buyerHistoryList.innerHTML = sales.map(s => {
                        const itemsStr = (s.items && s.items.length > 0) 
                            ? s.items.map(i => `${i.category} - ${i.brand} - ${i.variant} - Qty: ${i.qty} - ₹${i.price}`).join('<br>') 
                            : 'No items';
                        const amount = s.totalAmount || s.total || 0;
                        const credit = credits.find(c => c.invoiceNo === s.invoiceNo);
                        let dueStr = '';
                        if (credit) {
                            const paid = credit.payments ? credit.payments.reduce((pSum, p) => pSum + p.amount, 0) : 0;
                            const remaining = credit.dueAmount - paid;
                            if (remaining > 0) {
                                dueStr = ` <span style="color: var(--danger-color); font-weight: bold;">(Due: ₹ ${remaining.toFixed(2)})</span>`;
                            }
                        }
                        return `<li>${s.date}: Invoice #${s.invoiceNo} - <strong style="color: var(--secondary-color);">₹ ${amount.toFixed(2)}</strong>${dueStr}<br><small style="color: var(--text-muted); display: block; margin-bottom: 0.25rem;">Items:<br>${itemsStr}</small></li>`;
                    }).join('');
                } else {
                    buyerHistoryList.innerHTML = '<li>No previous purchases found.</li>';
                }

                buyerHistoryDue.textContent = `₹ ${Math.max(0, totalDue).toFixed(2)}`;
                buyerHistoryContainer.style.display = 'block';
            } else {
                buyerHistoryContainer.style.display = 'none';
            }
        });
    }

    function calculateGrandTotal() {
        let total = 0;
        document.querySelectorAll('.item-amount-display').forEach(el => {
            total += parseFloat(el.dataset.value || 0);
        });
        document.getElementById('grand-total').textContent = `₹ ${total.toFixed(2)}`;
        document.getElementById('grand-total').dataset.value = total;
        
        if (!isPaidAmountManuallyEdited) {
            paidAmountInput.value = total;
        }
        recalculateDueAmount();
    }

    function processBillData() {
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
        let totalAmount = 0;
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

                if (!StorageManager.checkStock(cat, brand, variant, qty)) {
                    stockError += `\n- Not enough stock for ${brand} (${variant}). Requested: ${qty}`;
                }

                items.push({ category: cat, brand, variant, hsn, price, qty, amount });
                totalAmount += amount;
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

        // Deduct Stock
        if (editingInvoiceNo !== null) {
            StorageManager.revertSaleStock(editingInvoiceNo);
        }

        items.forEach(item => {
            StorageManager.deductStock(item.category, item.brand, item.variant, item.qty);
        });

        const invoiceNo = editingInvoiceNo !== null ? editingInvoiceNo : StorageManager.getNextInvoiceNumber();
        const total = totalAmount;
        let paidAmount = parseFloat(paidAmountInput.value);
        if (isNaN(paidAmount)) paidAmount = 0;
        const dueAmount = total - paidAmount;

        const billData = {
            invoiceNo,
            date,
            buyerName,
            mobile,
            gstn,
            address,
            paymentMethod: dueAmount > 0 ? 'Credit' : 'Cash/Online',
            paidAmount,
            dueAmount,
            items,
            total
        };

        // Save Data
        StorageManager.saveSale(billData, editingInvoiceNo !== null);

        if (dueAmount > 0) {
            const dueDate = document.getElementById('due-date').value;
            StorageManager.saveCredit({
                ...billData,
                total: dueAmount, // Override total for the credit section
                dueDate
            }, editingInvoiceNo !== null);
        } else if (editingInvoiceNo !== null) {
            StorageManager.removeCredit(editingInvoiceNo);
        }
        
        editingInvoiceNo = null;
        document.querySelector('#billing-tab .page-header h1').textContent = 'New Bill';
        
        return billData;
    }

    function resetForm() {
        document.getElementById('buyer-name').value = '';
        document.getElementById('buyer-mobile').value = '';
        document.getElementById('buyer-gstn').value = '';
        document.getElementById('buyer-address').value = '';
        itemsTbody.innerHTML = '';
        isPaidAmountManuallyEdited = false;
        editingInvoiceNo = null;
        document.querySelector('#billing-tab .page-header h1').textContent = 'New Bill';
        createRow();
        calculateGrandTotal();
    }

    // Save Bill Button
    const saveBtn = document.getElementById('save-bill-btn');
    saveBtn.addEventListener('click', () => {
        const billData = processBillData();
        if (billData) {
            resetForm();
            alert('Bill saved successfully!');
        }
    });

    // Download Bill Button
    const downloadBtn = document.getElementById('download-bill-btn');
    downloadBtn.addEventListener('click', async () => {
        const billData = processBillData();
        if (billData) {
            downloadBtn.disabled = true;
            downloadBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Downloading...';
            
            await PDFGenerator.generate(billData);
            
            downloadBtn.disabled = false;
            downloadBtn.innerHTML = '<i class="ph ph-download-simple"></i> Download';
            
            resetForm();
            alert('Bill downloaded and saved successfully!');
        }
    });

    // Share Bill Button
    const shareBtn = document.getElementById('share-bill-btn');
    shareBtn.addEventListener('click', async () => {
        const billData = processBillData();
        if (billData) {
            shareBtn.disabled = true;
            shareBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Preparing...';
            
            try {
                const pdfBlob = await PDFGenerator.generateBlob(billData);
                const file = new File([pdfBlob], `Invoice_${billData.invoiceNo}.pdf`, { type: 'application/pdf' });
                
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: `Invoice #${billData.invoiceNo}`,
                        text: `Please find attached your invoice from Sirvi Brothers.`
                    });
                } else {
                    // Fallback: Download
                    alert('Sharing not supported on this device. Downloading instead...');
                    await PDFGenerator.generate(billData);
                }
            } catch (error) {
                console.error("Share failed", error);
                // User may have just cancelled the share dialog
            } finally {
                shareBtn.disabled = false;
                shareBtn.innerHTML = '<i class="ph ph-share-network"></i> Share';
                resetForm();
            }
        }
    });

    // Render Sales Table
    function renderSalesTable() {
        const sales = StorageManager.getSales();
        const tbody = document.querySelector('#sales-history-table tbody');
        tbody.innerHTML = '';
        
        let todayTotal = 0, weekTotal = 0, monthTotal = 0;
        const now = new Date();

        sales.slice().reverse().forEach(sale => {
            const saleDate = new Date(sale.date);
            const diffTime = Math.abs(now - saleDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            
            if (diffDays <= 1) todayTotal += sale.total;
            if (diffDays <= 7) weekTotal += sale.total;
            if (saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear()) {
                monthTotal += sale.total;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${sale.date}</td>
                <td>#${sale.invoiceNo}</td>
                <td>${sale.buyerName}</td>
                <td><span class="badge ${sale.paymentMethod === 'Credit' ? 'warning' : 'success'}">${sale.paymentMethod}</span></td>
                <td>₹ ${sale.total.toFixed(2)}</td>
                <td>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-icon edit-sale-btn" data-id="${sale.invoiceNo}" title="Edit"><i class="ph ph-pencil"></i></button>
                        <button class="btn btn-icon download-sale-btn" data-id="${sale.invoiceNo}" title="Download PDF"><i class="ph ph-download-simple"></i></button>
                        <button class="btn btn-icon share-sale-btn" data-id="${sale.invoiceNo}" title="Share PDF"><i class="ph ph-share-network"></i></button>
                        <button class="btn btn-icon wa-share-btn" data-id="${sale.invoiceNo}" title="Share via WhatsApp" style="color: #25D366; border-color: #25D366;"><i class="ph ph-whatsapp-logo"></i></button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.share-sale-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const invoiceNo = parseInt(e.currentTarget.dataset.id);
                const sale = StorageManager.getSales().find(s => s.invoiceNo === invoiceNo);
                if (sale) {
                    const btn = e.currentTarget;
                    const originalHtml = btn.innerHTML;
                    btn.innerHTML = '<i class="ph ph-spinner ph-spin"></i>';
                    btn.disabled = true;
                    
                    try {
                        const pdfBlob = await PDFGenerator.generateBlob(sale);
                        const file = new File([pdfBlob], `Invoice_${sale.invoiceNo}.pdf`, { type: 'application/pdf' });
                        if (navigator.canShare && navigator.canShare({ files: [file] })) {
                            await navigator.share({
                                files: [file],
                                title: `Invoice #${sale.invoiceNo}`,
                                text: `Invoice from Sirvi Brothers\nThank you for your business!`
                            });
                        } else {
                            alert('Sharing not supported on this device. Downloading instead...');
                            await PDFGenerator.generate(sale);
                        }
                    } catch (error) {
                        console.error("Share failed", error);
                    } finally {
                        btn.innerHTML = originalHtml;
                        btn.disabled = false;
                    }
                }
            });
        });

        document.querySelectorAll('.download-sale-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const invoiceNo = parseInt(e.currentTarget.dataset.id);
                const sale = StorageManager.getSales().find(s => s.invoiceNo === invoiceNo);
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
            btn.addEventListener('click', (e) => {
                const invoiceNo = parseInt(e.currentTarget.dataset.id);
                const sale = StorageManager.getSales().find(s => s.invoiceNo === invoiceNo);
                if (sale) {
                    let itemsText = sale.items.map((i, idx) => `${idx + 1}. ${i.category} - ${i.brand} (${i.variant}) x ${i.qty} - ₹${i.amount.toFixed(2)}`).join('\n');
                    
                    let text = `*Sirvi Brothers - Invoice #${sale.invoiceNo}*\n`;
                    text += `Date: ${sale.date}\n`;
                    text += `Customer: ${sale.buyerName}\n\n`;
                    text += `*Items:*\n${itemsText}\n\n`;
                    text += `*Total Amount:* ₹${sale.total.toFixed(2)}\n`;
                    if (sale.dueAmount > 0) {
                        text += `*Paid:* ₹${sale.paidAmount.toFixed(2)}\n`;
                        text += `*Due Amount:* ₹${sale.dueAmount.toFixed(2)}\n`;
                    }
                    text += `\nThank you for your business!`;
                    
                    const encodedText = encodeURIComponent(text);
                    
                    let waUrl = `https://wa.me/`;
                    if (sale.mobile) {
                        // Ensure 91 prefix if not present (assuming Indian mobile numbers)
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
            btn.addEventListener('click', (e) => {
                const invoiceNo = parseInt(e.currentTarget.dataset.id);
                loadBillIntoForm(invoiceNo);
            });
        });

        document.getElementById('sales-today').textContent = `₹ ${todayTotal.toFixed(2)}`;
        document.getElementById('sales-week').textContent = `₹ ${weekTotal.toFixed(2)}`;
        document.getElementById('sales-month').textContent = `₹ ${monthTotal.toFixed(2)}`;
    }

    function loadBillIntoForm(invoiceNo) {
        const sale = StorageManager.getSales().find(s => s.invoiceNo === invoiceNo);
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
        sale.items.forEach(item => {
            createRow(item);
        });

        calculateGrandTotal();

        if (sale.dueAmount > 0) {
            const credit = StorageManager.getCredits().find(c => c.invoiceNo === invoiceNo);
            if (credit && credit.dueDate) {
                document.getElementById('due-date').value = credit.dueDate;
            }
        }
    }

    // Render Credit Table
    function renderCreditTable() {
        const credits = StorageManager.getCredits();
        const tbody = document.querySelector('#credit-history-table tbody');
        tbody.innerHTML = '';

        credits.slice().reverse().forEach(credit => {
            const totalPaid = credit.payments ? credit.payments.reduce((sum, p) => sum + p.amount, 0) : 0;
            const remaining = credit.total - totalPaid;
            
            // Auto update status if math shows paid but status doesn't
            if (remaining <= 0 && credit.status !== 'Paid') {
                StorageManager.updateCreditStatus(credit.id, 'Paid');
                credit.status = 'Paid';
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${credit.date}</td>
                <td>${credit.buyerName}</td>
                <td>${credit.mobile || 'N/A'}</td>
                <td class="amount-red">₹ ${remaining.toFixed(2)}</td>
                <td>${credit.dueDate}</td>
                <td><span class="badge ${credit.status === 'Paid' ? 'success' : 'warning'}">${credit.status}</span></td>
                <td>
                    ${credit.status === 'Pending' ? `
                        <button class="btn btn-success btn-sm mark-paid-btn" data-id="${credit.id}">Mark Paid</button>
                        <button class="btn btn-secondary btn-sm part-pay-btn" data-id="${credit.id}">Part Pay</button>
                        <button class="btn btn-secondary btn-sm edit-date-btn" data-id="${credit.id}">Edit Date</button>
                    ` : ''}
                    <button class="btn btn-secondary btn-sm view-history-btn" data-id="${credit.id}"><i class="ph ph-clock-counter-clockwise"></i> History</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.mark-paid-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                document.getElementById('payment-modal-title').textContent = 'Mark as Fully Paid';
                document.getElementById('payment-credit-id').value = id;
                document.getElementById('payment-type').value = 'full';
                document.getElementById('payment-date').valueAsDate = new Date();
                document.getElementById('payment-amount-group').style.display = 'none';
                document.getElementById('payment-modal').style.display = 'flex';
            });
        });

        document.querySelectorAll('.part-pay-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                document.getElementById('payment-modal-title').textContent = 'Record Part Payment';
                document.getElementById('payment-credit-id').value = id;
                document.getElementById('payment-type').value = 'part';
                document.getElementById('payment-date').valueAsDate = new Date();
                document.getElementById('payment-amount-group').style.display = 'block';
                document.getElementById('payment-amount').value = '';
                document.getElementById('payment-modal').style.display = 'flex';
            });
        });

        document.querySelectorAll('.edit-date-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.dataset.id);
                const credit = StorageManager.getCredits().find(c => c.id === id);
                if (credit) {
                    document.getElementById('edit-date-credit-id').value = id;
                    document.getElementById('edit-target-date').value = credit.dueDate;
                    document.getElementById('edit-date-modal').style.display = 'flex';
                }
            });
        });

        document.querySelectorAll('.view-history-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.dataset.id);
                renderPaymentHistory(id);
                document.getElementById('payment-history-modal').style.display = 'flex';
            });
        });
        
        renderPassbook();
    }

    function renderPaymentHistory(creditId) {
        const credit = StorageManager.getCredits().find(c => c.id === creditId);
        const tbody = document.querySelector('#payment-history-table tbody');
        tbody.innerHTML = '';
        
        if (!credit || !credit.payments || credit.payments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align: center;">No payment history found.</td></tr>';
            return;
        }

        credit.payments.forEach((payment, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${payment.date}</td>
                <td>₹ ${payment.amount.toFixed(2)}</td>
                <td>
                    <button class="btn btn-secondary btn-sm delete-payment-btn" data-credit-id="${creditId}" data-index="${index}"><i class="ph ph-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.delete-payment-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (confirm('Are you sure you want to delete this payment?')) {
                    const cId = parseInt(e.currentTarget.dataset.creditId);
                    const pIdx = parseInt(e.currentTarget.dataset.index);
                    StorageManager.removePaymentFromCredit(cId, pIdx);
                    renderPaymentHistory(cId);
                    renderCreditTable();
                    renderHomeDashboard();
                }
            });
        });
    }

    // --- PARTIES DATALIST ---
    function updatePartiesDatalist() {
        const parties = StorageManager.getParties();
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
        purchaseVendorNameInput.addEventListener('input', (e) => {
            const typedName = e.target.value.toLowerCase().trim();
            if (!typedName) {
                vendorHistoryContainer.style.display = 'none';
                return;
            }

            const parties = StorageManager.getParties();
            const party = parties.find(p => p.name.toLowerCase() === typedName);

            if (party) {
                purchaseVendorMobileInput.value = party.mobile || '';

                // Fetch past purchases from this vendor
                const purchases = StorageManager.getPurchases()
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
    
    function createPurchaseRow() {
        purchaseItemsCount++;
        const inventory = StorageManager.getInventory();
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
        catSelect.addEventListener('change', (e) => {
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

        brandSelect.addEventListener('change', (e) => {
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

        varSelect.addEventListener('change', (e) => {
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
        
        removeBtn.addEventListener('click', () => {
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
        addPurchaseRowBtn.addEventListener('click', (e) => {
            e.preventDefault();
            createPurchaseRow();
        });
        // Add initial row
        createPurchaseRow();
    }

    const savePurchaseBtn = document.getElementById('save-purchase-btn');
    if (savePurchaseBtn) {
        savePurchaseBtn.addEventListener('click', () => {
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
            
            StorageManager.savePurchase({
                vendorName,
                date,
                mobile: document.getElementById('purchase-vendor-mobile').value || '',
                items,
                totalAmount
            });

            updatePartiesDatalist();
            renderPurchaseHistoryTable();
            renderInventoryTable(); // Refresh inventory
            
            alert('Purchase saved successfully!');
            
            // Reset form
            document.getElementById('purchase-vendor-name').value = '';
            document.getElementById('purchase-vendor-mobile').value = '';
            document.getElementById('purchase-date').valueAsDate = new Date();
            document.querySelector('#purchase-items-table tbody').innerHTML = '';
            createPurchaseRow();
            calculatePurchaseTotal();
        });
    }

    function renderPurchaseHistoryTable() {
        const tbody = document.querySelector('#purchase-history-table tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        const purchases = StorageManager.getPurchases().reverse(); // Newest first

        if (purchases.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No purchases found.</td></tr>';
            return;
        }

        purchases.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${p.date}</td>
                <td>${p.vendorName}</td>
                <td>${p.items.length}</td>
                <td>₹ ${p.totalAmount.toFixed(2)}</td>
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
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('#inventory-filters .filter-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            currentInventoryFilter = e.currentTarget.dataset.filter;
            renderInventoryTable();
        });
    });

    function renderInventoryTable() {
        let inventory = StorageManager.getInventory();
        
        if (currentInventoryFilter !== 'all') {
            inventory = inventory.filter(item => {
                if (currentInventoryFilter === '0') return item.stock === 0;
                if (currentInventoryFilter === '1-3') return item.stock >= 1 && item.stock <= 3;
                if (currentInventoryFilter === '4-10') return item.stock >= 4 && item.stock <= 10;
                if (currentInventoryFilter === '11-30') return item.stock >= 11 && item.stock <= 30;
                if (currentInventoryFilter === '31-50') return item.stock >= 31 && item.stock <= 50;
                if (currentInventoryFilter === '51-100') return item.stock >= 51 && item.stock <= 100;
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
                        if (item.stock < 10) stockColor = '#EF4444'; // Red
                        else if (item.stock <= 30) stockColor = '#F59E0B'; // Orange
                        
                        td.innerHTML = `
                            <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                                <span style="color: ${stockColor}; font-weight: bold; font-size: 1.1em;">${item.stock}</span>
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
            cell.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.dataset.id);
                const item = StorageManager.getInventory().find(i => i.id === id);
                if (item) {
                    document.getElementById('modal-title').textContent = 'Edit Inventory Item';
                    document.getElementById('inv-id-input').value = item.id;
                    document.getElementById('inv-cat-input').value = item.category;
                    document.getElementById('inv-brand-input').value = item.brand;
                    document.getElementById('inv-var-input').value = item.variant;
                    document.getElementById('inv-hsn-input').value = item.hsn || getHsnForCategory(item.category);
                    document.getElementById('inv-stock-input').value = item.stock;
                    
                    document.getElementById('inv-cat-input').disabled = true;
                    document.getElementById('inv-brand-input').disabled = true;
                    document.getElementById('inv-var-input').disabled = true;
                    
                    document.getElementById('delete-inv-btn').style.display = 'inline-flex';
                    inventoryModal.style.display = 'flex';
                }
            });
        });
    }

    addInvBtn.addEventListener('click', () => {
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
    
    document.getElementById('delete-inv-btn').addEventListener('click', () => {
        const id = document.getElementById('inv-id-input').value;
        if (id && confirm('Are you sure you want to delete this item?')) {
            StorageManager.deleteInventoryItem(parseInt(id));
            inventoryModal.style.display = 'none';
            renderInventoryTable();
        }
    });

    closeBtn.addEventListener('click', () => {
        inventoryModal.style.display = 'none';
    });

    saveInvBtn.addEventListener('click', () => {
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
            category, brand, variant, hsn, stock
        };
        if (id) itemData.id = parseInt(id);

        StorageManager.saveInventoryItem(itemData);
        inventoryModal.style.display = 'none';
        renderInventoryTable();

        // Refresh billing form to show new items
        itemsTbody.innerHTML = '';
        createRow();
    });

    // --- PARTIES / CUSTOMERS UI ---
    let currentSortByDue = false;
    
    function renderPartiesTable() {
        const parties = StorageManager.getParties();
        const sales = StorageManager.getSales();
        const credits = StorageManager.getCredits();
        const tbody = document.querySelector('#parties-table tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        // Calculate totals for each party
        const enrichedParties = parties.map(party => {
            const partySales = sales.filter(s => s.mobile === party.mobile);
            const totalAmount = partySales.reduce((sum, s) => sum + s.total, 0);
            
            const partyCredits = credits.filter(c => c.mobile === party.mobile && c.status !== 'Paid');
            const dueAmount = partyCredits.reduce((sum, c) => sum + c.total, 0);
            
            return { ...party, totalAmount, dueAmount };
        });
        
        if (currentSortByDue) {
            enrichedParties.sort((a, b) => b.dueAmount - a.dueAmount);
        } else {
            // Default sort by id
            enrichedParties.sort((a, b) => b.id - a.id);
        }
        
        enrichedParties.forEach(party => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-weight: 500;">${party.name}</td>
                <td>${party.mobile}</td>
                <td>${party.gstn || '-'}</td>
                <td>${party.address || '-'}</td>
                <td style="font-weight: bold; color: var(--success-color);">₹ ${party.totalAmount.toFixed(2)}</td>
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
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.dataset.id);
                const party = StorageManager.getParties().find(p => p.id === id);
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
        sortDueBtn.addEventListener('click', () => {
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
        closePartyBtn.addEventListener('click', () => {
            partyModal.style.display = 'none';
        });
    }

    if (savePartyBtn) {
        savePartyBtn.addEventListener('click', () => {
            const id = document.getElementById('party-id-input').value;
            const name = document.getElementById('party-name-input').value.trim();
            const mobile = document.getElementById('party-mobile-input').value.trim();
            const gstn = document.getElementById('party-gstn-input').value.trim();
            const address = document.getElementById('party-address-input').value.trim();
            
            if (!name || !mobile) {
                alert('Name and Mobile are required!');
                return;
            }
            
            StorageManager.saveParty({
                id: id ? parseInt(id) : undefined,
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
        addPartyBtn.addEventListener('click', () => {
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
    function renderPassbook() {
        const credits = StorageManager.getCredits();
        const tbody = document.querySelector('#passbook-table tbody');
        if(!tbody) return;
        tbody.innerHTML = '';
        
        let ledger = [];
        
        credits.forEach(credit => {
            // Debit for the original bill
            ledger.push({
                date: new Date(credit.date).getTime(),
                dateStr: credit.date,
                ref: `Bill #${credit.invoiceNo} (${credit.buyerName})`,
                type: 'Due Generated',
                debit: credit.total,
                credit: 0
            });
            
            // Credits for payments
            if (credit.payments) {
                credit.payments.forEach(p => {
                    ledger.push({
                        date: new Date(p.date).getTime(),
                        dateStr: p.date,
                        ref: `Payment for Bill #${credit.invoiceNo}`,
                        type: 'Payment',
                        debit: 0,
                        credit: p.amount
                    });
                });
            }
        });
        
        ledger.sort((a, b) => a.date - b.date);
        
        let totalDueBalance = 0;
        
        ledger.forEach(entry => {
            totalDueBalance += entry.debit;
            totalDueBalance -= entry.credit;
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${entry.dateStr}</td>
                <td>${entry.ref}</td>
                <td>${entry.type}</td>
                <td style="color: var(--danger-color);">${entry.debit > 0 ? '₹ ' + entry.debit.toFixed(2) : '-'}</td>
                <td style="color: var(--success-color);">${entry.credit > 0 ? '₹ ' + entry.credit.toFixed(2) : '-'}</td>
            `;
            tbody.appendChild(tr);
        });
        
        const topLiveBalance = document.getElementById('top-live-balance');
        if (topLiveBalance) {
            topLiveBalance.textContent = `₹ ${totalDueBalance.toFixed(2)}`;
        }
    }

    // Payment Modal Actions
    document.getElementById('cancel-payment-btn')?.addEventListener('click', () => {
        document.getElementById('payment-modal').style.display = 'none';
    });

    document.getElementById('save-payment-btn')?.addEventListener('click', () => {
        const id = parseInt(document.getElementById('payment-credit-id').value);
        const type = document.getElementById('payment-type').value;
        const date = document.getElementById('payment-date').value;
        
        if (!date) {
            alert('Please select a date.');
            return;
        }

        if (type === 'full') {
            StorageManager.markCreditAsPaid(id, date);
        } else if (type === 'part') {
            const amount = parseFloat(document.getElementById('payment-amount').value);
            if (isNaN(amount) || amount <= 0) {
                alert('Please enter a valid amount.');
                return;
            }
            StorageManager.addPaymentToCredit(id, amount, date);
        }
        
        document.getElementById('payment-modal').style.display = 'none';
        renderCreditTable();
        renderHomeDashboard();
    });

    // Edit Date Modal Actions
    document.getElementById('cancel-edit-date-btn')?.addEventListener('click', () => {
        document.getElementById('edit-date-modal').style.display = 'none';
    });

    document.getElementById('save-edit-date-btn')?.addEventListener('click', () => {
        const id = parseInt(document.getElementById('edit-date-credit-id').value);
        const newDate = document.getElementById('edit-target-date').value;
        
        if (!newDate) {
            alert('Please select a date.');
            return;
        }
        
        StorageManager.updateCreditDueDate(id, newDate);
        document.getElementById('edit-date-modal').style.display = 'none';
        renderCreditTable();
    });

    document.getElementById('close-history-modal-btn')?.addEventListener('click', () => {
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
    renderSalesTable();
    renderCreditTable();
    renderPartiesTable();
});
