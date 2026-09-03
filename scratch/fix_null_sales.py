import os

app_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\js\app.js'

with open(app_path, 'r', encoding='utf-8') as f:
    app_content = f.read()

# Fix renderSalesTable total addition
app_content = app_content.replace('todayTotal += sale.total;', 'todayTotal += (sale.total || 0);')
app_content = app_content.replace('weekTotal += sale.total;', 'weekTotal += (sale.total || 0);')
app_content = app_content.replace('monthTotal += sale.total;', 'monthTotal += (sale.total || 0);')

# Fix renderSalesTable toFixed
app_content = app_content.replace('<td>₹ ${sale.total.toFixed(2)}</td>', '<td>₹ ${(sale.total || 0).toFixed(2)}</td>')

# Let's also fix renderHomeDashboard while we are at it, as it probably uses sale.total
app_content = app_content.replace('totalRevenue += sale.total;', 'totalRevenue += (sale.total || 0);')

# Fix getCredits passbook balance crashes
app_content = app_content.replace('totalDue += (credit.total - totalPaid);', 'totalDue += ((credit.total || 0) - totalPaid);')

with open(app_path, 'w', encoding='utf-8') as f:
    f.write(app_content)
    
print("SUCCESS: Fixed null sales crashes.")
