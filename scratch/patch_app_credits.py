import os

app_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\js\app.js'

with open(app_path, 'r', encoding='utf-8') as f:
    content = f.read()

target = """    // Render Credit Table
    async function renderCreditTable() {
        const credits = await StorageManager.getCredits();
        const tbody = document.querySelector('#credit-history-table tbody');
        tbody.innerHTML = '';

        for (const credit of credits.slice().reverse()) {
            const totalPaid = credit.payments ? credit.payments.reduce((sum, p) => sum + p.amount, 0) : 0;
            const remaining = credit.total - totalPaid;
            
            // Auto update status if math shows paid but status doesn't
            if (remaining <= 0 && credit.status !== 'Paid') {
                await StorageManager.updateCreditStatus(credit.id, 'Paid');
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
        }

        document.querySelectorAll('.mark-paid-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.dataset.id;
                document.getElementById('payment-modal-title').textContent = 'Mark as Fully Paid';
                document.getElementById('payment-credit-id').value = id;
                document.getElementById('payment-type').value = 'full';
                document.getElementById('payment-date').valueAsDate = new Date();
                document.getElementById('payment-amount-group').style.display = 'none';
                document.getElementById('payment-modal').style.display = 'flex';
            });
        });

        document.querySelectorAll('.part-pay-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.dataset.id;
                document.getElementById('payment-modal-title').textContent = 'Record Partial Payment';
                document.getElementById('payment-credit-id').value = id;
                document.getElementById('payment-type').value = 'part';
                document.getElementById('payment-date').valueAsDate = new Date();
                document.getElementById('payment-amount-group').style.display = 'block';
                document.getElementById('payment-amount').value = '';
                document.getElementById('payment-modal').style.display = 'flex';
            });
        });

        document.querySelectorAll('.edit-date-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.dataset.id;
                const credit = (await StorageManager.getCredits()).find(c => c.id === id);
                if (credit) {
                    const newDate = prompt("Enter new Due Date (YYYY-MM-DD):", credit.dueDate);
                    if (newDate && newDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                        await StorageManager.updateCreditDueDate(id, newDate);
                        renderCreditTable();
                    } else if (newDate) {
                        alert("Invalid date format. Use YYYY-MM-DD.");
                    }
                }
            });
        });"""

replacement = """    // Render Credit Table
    async function renderCreditTable() {
        const credits = await StorageManager.getCredits();
        const tbody = document.querySelector('#credit-history-table tbody');
        tbody.innerHTML = '';

        for (const credit of credits) {
            const remaining = credit.balance || 0;
            if (remaining <= 0) continue; // safety check
            
            // 10-day default logic
            let dueDateStr = 'N/A';
            const remarkMatch = credit.remarks ? credit.remarks.match(/DueDate:([\\d-]+)/) : null;
            if (remarkMatch) {
                dueDateStr = remarkMatch[1];
            } else {
                const d = new Date(credit.date);
                d.setDate(d.getDate() + 10);
                dueDateStr = d.toISOString().split('T')[0];
            }
            credit.dueDate = dueDateStr;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${credit.date}</td>
                <td>${credit.buyerName} <br><small style="color: ${credit.type === 'Sale' ? 'var(--success-color)' : 'var(--danger-color)'}; font-weight: 600;">${credit.type === 'Sale' ? 'RECEIVABLE' : 'PAYABLE'}</small></td>
                <td>${credit.mobile || 'N/A'}</td>
                <td class="amount-red">₹ ${remaining.toFixed(2)}</td>
                <td>${credit.dueDate}</td>
                <td><span class="badge warning">Pending</span></td>
                <td>
                    <button class="btn btn-success btn-sm mark-paid-btn" data-id="${credit.id}" data-type="${credit.type}">Mark Paid</button>
                    <button class="btn btn-secondary btn-sm edit-date-btn" data-id="${credit.id}" data-type="${credit.type}">Edit Date</button>
                </td>
            `;
            tbody.appendChild(tr);
        }

        document.querySelectorAll('.mark-paid-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.dataset.id;
                const type = e.target.dataset.type;
                if (confirm('Are you sure you want to mark this as fully paid?')) {
                    await StorageManager.markCreditAsPaid(id, new Date().toISOString().split('T')[0], type);
                    renderCreditTable();
                }
            });
        });

        document.querySelectorAll('.edit-date-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.dataset.id;
                const type = e.target.dataset.type;
                const credit = (await StorageManager.getCredits()).find(c => c.id === id);
                if (credit) {
                    const newDate = prompt("Enter new Due Date (YYYY-MM-DD):", credit.dueDate);
                    if (newDate && newDate.match(/^\\d{4}-\\d{2}-\\d{2}$/)) {
                        await StorageManager.updateCreditDueDate(id, newDate, type);
                        renderCreditTable();
                    } else if (newDate) {
                        alert("Invalid date format. Use YYYY-MM-DD.");
                    }
                }
            });
        });"""

content = content.replace(target, replacement)

with open(app_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS: Patched app.js renderCreditTable")
