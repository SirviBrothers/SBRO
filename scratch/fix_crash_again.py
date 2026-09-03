import os
import re

app_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\js\app.js'
storage_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\js\storage.js'

# 1. Revert app.js billData construction back to exactly what pdf.js expects
with open(app_path, 'r', encoding='utf-8') as f:
    app_content = f.read()

old_bill_data = """const billData = {
    invoiceNo,
    date,
    buyerName,
    mobile,
    gstn,
    address,
    subtotal: total,
    discount: 0,
    grandTotal: total,
    receivedAmt: paidAmount,
    balance: dueAmount,
    paymentMode: dueAmount > 0 ? 'Credit' : 'Cash/Online',
    remarks: '',
    items
};"""

new_bill_data = """const billData = {
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
};"""

app_content = app_content.replace(old_bill_data, new_bill_data)

with open(app_path, 'w', encoding='utf-8') as f:
    f.write(app_content)


# 2. Fix storage.js saveSale to translate old names to Supabase names
with open(storage_path, 'r', encoding='utf-8') as f:
    storage_content = f.read()

old_save_sale = """            const { data, error } = await this.client.from('sales').insert([{
                invoice_no: saleData.invoiceNo,
                date: saleData.date,
                buyer_name: saleData.buyerName,
                mobile: saleData.mobile,
                address: saleData.address,
                gstn: saleData.gstn,
                subtotal: saleData.subtotal,
                discount: saleData.discount,
                grand_total: saleData.grandTotal,
                received_amt: saleData.receivedAmt,
                balance: saleData.balance,
                payment_mode: saleData.paymentMode,
                remarks: saleData.remarks
            }]).select();"""

new_save_sale = """            const { data, error } = await this.client.from('sales').insert([{
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
            }]).select();"""

storage_content = storage_content.replace(old_save_sale, new_save_sale)

# 3. Also fix storage.js saveSale items mapping!
old_save_items = """            const itemsToInsert = saleData.items.map(item => ({
                sale_id: saleId,
                category: item.category,
                brand: item.brand,
                variant: item.variant,
                quantity: item.qty,
                unit: item.unit,
                price: item.price,
                total: item.total
            }));"""

new_save_items = """            const itemsToInsert = saleData.items.map(item => ({
                sale_id: saleId,
                category: item.category,
                brand: item.brand,
                variant: item.variant,
                quantity: item.qty,
                unit: item.unit || 'pcs',
                price: item.price,
                total: item.total || item.amount
            }));"""

storage_content = storage_content.replace(old_save_items, new_save_items)

# 4. Same for edit update logic!
old_edit_update = """            const { error } = await this.client.from('sales').update({
                date: saleData.date,
                buyer_name: saleData.buyerName,
                mobile: saleData.mobile,
                address: saleData.address,
                gstn: saleData.gstn,
                subtotal: saleData.subtotal,
                discount: saleData.discount,
                grand_total: saleData.grandTotal,
                received_amt: saleData.receivedAmt,
                balance: saleData.balance,
                payment_mode: saleData.paymentMode,
                remarks: saleData.remarks
            }).eq('id', saleId);"""

new_edit_update = """            const { error } = await this.client.from('sales').update({
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
            }).eq('id', saleId);"""

storage_content = storage_content.replace(old_edit_update, new_edit_update)

with open(storage_path, 'w', encoding='utf-8') as f:
    f.write(storage_content)

print("SUCCESS: Fixed bill generation crash and storage mappings.")
