import os

app_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\js\app.js'

with open(app_path, 'r', encoding='utf-8') as f:
    content = f.read()

target = """        const eDue = document.getElementById('dash-total-due');
        if(eDue) eDue.textContent = `₹ ${totalDue.toFixed(2)}`;
    }"""

replacement = """        const eDue = document.getElementById('dash-total-due');
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
    }"""

content = content.replace(target, replacement)

with open(app_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS: Patched app.js with Hero Product and Cashflow Chart logic.")
