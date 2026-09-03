import re
import os
import subprocess

html_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\index.html'
app_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\js\app.js'

# 1. Add Migration Button to Sidebar in index.html
with open(html_path, 'r', encoding='utf-8') as f:
    html_content = f.read()

if 'migrate-btn' not in html_content:
    migration_html = """
            <nav class="sidebar-nav">
                <a href="#" class="nav-item active" data-target="home-tab"><i class="ph ph-squares-four"></i> Dashboard</a>
                <a href="#" class="nav-item" data-target="sales-tab"><i class="ph ph-receipt"></i> New Bill</a>
                <a href="#" class="nav-item" data-target="purchases-tab"><i class="ph ph-shopping-cart"></i> Purchases</a>
                <a href="#" class="nav-item" data-target="credit-tab"><i class="ph ph-notebook"></i> Passbook</a>
                <a href="#" class="nav-item" data-target="inventory-tab"><i class="ph ph-package"></i> Inventory</a>
                <a href="#" class="nav-item" data-target="parties-tab"><i class="ph ph-users"></i> Parties</a>
                <a href="#" class="nav-item" id="migrate-btn" style="background: linear-gradient(135deg, #10b981, #059669); color: white; margin-top: 20px;"><i class="ph ph-cloud-arrow-up"></i> Push Local Data to Cloud</a>
            </nav>
    """
    html_content = re.sub(r'<nav class="sidebar-nav">.*?</nav>', migration_html, html_content, flags=re.DOTALL)
    
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html_content)

# 2. Add Migration Logic to app.js
with open(app_path, 'r', encoding='utf-8') as f:
    app_content = f.read()

if 'migrateLocalDataToCloud' not in app_content:
    migration_js = """
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
"""
    
    app_content = app_content.replace('document.addEventListener(\'DOMContentLoaded\', async () => {', 'document.addEventListener(\'DOMContentLoaded\', async () => {\n' + migration_js)
    
    with open(app_path, 'w', encoding='utf-8') as f:
        f.write(app_content)

result = subprocess.run(['node', '-c', app_path], capture_output=True, text=True)
if result.returncode != 0:
    print(f"Error in {app_path}:\n{result.stderr}")
else:
    print(f"{app_path} syntax is OK.")
    
