import urllib.request
import json
import datetime
import random
import uuid

SUPABASE_URL = 'https://ztlrayekobgcllnxmqft.supabase.co/rest/v1/'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0bHJheWVrb2JnY2xsbnhtcWZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNzc4NTIsImV4cCI6MjEwMzk1Mzg1Mn0.SCv_r5KOQIN0RTvEEQrZLCOGaaneWsPlJuIMnyxYXkE'

headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation' # return inserted data
}

def make_request(endpoint, method='GET', payload=None):
    url = SUPABASE_URL + endpoint
    data = json.dumps(payload).encode('utf-8') if payload else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f"Error calling {endpoint}: {e}")
        if hasattr(e, 'read'):
            print(e.read().decode('utf-8'))
        return None

# 1. Fetch valid inventory items
print("Fetching inventory...")
inventory = make_request('inventory?select=*')
if not inventory:
    print("Failed to fetch inventory")
    exit(1)

# Pick 3 items for demo
demo_items = inventory[:3]
for idx, item in enumerate(demo_items):
    print(f"Selected item {idx+1}: {item['category']} - {item['brand']} ({item['variant']})")

# 2. Insert Parties
print("\nInserting parties...")
parties = [
    {"name": "Sharma Builders (Demo)", "mobile": "9876543210", "address": "MUMBAI", "gstn": "27AAAC1234"},
    {"name": "Verma Electricals (Demo)", "mobile": "9876543211", "address": "PUNE", "gstn": ""},
    {"name": "Rajesh Kumar (Demo)", "mobile": "9876543212", "address": "NASHIK", "gstn": ""},
    {"name": "RR Kabel Wholesale (Demo)", "mobile": "9876543213", "address": "DELHI", "gstn": "07AAAB5678"},
    {"name": "GM Modular Dist (Demo)", "mobile": "9876543214", "address": "MUMBAI", "gstn": "27AAAC9012"}
]
inserted_parties = make_request('parties', method='POST', payload=parties)
print(f"Inserted {len(inserted_parties)} parties.")

# 3. Insert Purchases (Wholesale Inward)
print("\nInserting purchases...")
purchases = []
today = datetime.date.today()
for i in range(5):
    vendor = parties[3] if i % 2 == 0 else parties[4]
    bill_no = f"BILL-2026-00{i+1}"
    date = (today - datetime.timedelta(days=i)).isoformat()
    total_amount = 5000 + (i * 1000)
    paid_amount = total_amount if i < 3 else total_amount - 1000
    balance = total_amount - paid_amount
    
    purchases.append({
        "bill_no": bill_no,
        "date": date,
        "vendor_name": vendor['name'],
        "mobile": vendor['mobile'],
        "total_amount": total_amount,
        "paid_amount": paid_amount,
        "balance": balance
    })

inserted_purchases = make_request('purchases', method='POST', payload=purchases)
print(f"Inserted {len(inserted_purchases)} purchases.")

# Insert Purchase Items and update inventory
purchase_items = []
inventory_updates = {} # track total qty added
for p in inserted_purchases:
    for item in demo_items:
        qty = 50
        purchase_items.append({
            "purchase_id": p['id'],
            "category": item['category'],
            "brand": item['brand'],
            "variant": item['variant'],
            "quantity": qty,
            "unit": "pcs",
            "price": 100,
            "total": qty * 100
        })
        inventory_updates[item['id']] = inventory_updates.get(item['id'], 0) + qty

inserted_p_items = make_request('purchase_items', method='POST', payload=purchase_items)
print(f"Inserted {len(inserted_p_items)} purchase items.")

# 4. Insert Sales (Retail Outward)
print("\nInserting sales...")
sales = []
for i in range(5):
    customer = parties[i % 3]
    invoice_no = f"INV-2026-900{i+1}"
    date = (today - datetime.timedelta(days=i)).isoformat()
    grand_total = 2500 + (i * 500)
    received_amt = grand_total if i < 2 else grand_total - 500
    balance = grand_total - received_amt
    
    sales.append({
        "invoice_no": invoice_no,
        "date": date,
        "buyer_name": customer['name'],
        "mobile": customer['mobile'],
        "address": customer['address'],
        "gstn": customer['gstn'],
        "subtotal": grand_total,
        "discount": 0,
        "grand_total": grand_total,
        "received_amt": received_amt,
        "balance": balance,
        "payment_mode": "Cash/Online" if balance == 0 else "Credit",
        "remarks": "Demo Data"
    })

inserted_sales = make_request('sales', method='POST', payload=sales)
print(f"Inserted {len(inserted_sales)} sales.")

# Insert Sale Items and update inventory
sale_items = []
for s in inserted_sales:
    for item in demo_items:
        qty = 5
        sale_items.append({
            "sale_id": s['id'],
            "category": item['category'],
            "brand": item['brand'],
            "variant": item['variant'],
            "quantity": qty,
            "unit": "pcs",
            "price": 150,
            "total": qty * 150
        })
        inventory_updates[item['id']] -= qty # subtract sold qty

inserted_s_items = make_request('sale_items', method='POST', payload=sale_items)
print(f"Inserted {len(inserted_s_items)} sale items.")

# 5. Update Inventory Quantities
print("\nUpdating inventory quantities...")
for item in demo_items:
    new_qty = item.get('quantity') or 0
    new_qty += inventory_updates[item['id']]
    # Update via REST API
    make_request(f"inventory?id=eq.{item['id']}", method='PATCH', payload={"quantity": new_qty})
    print(f"Updated {item['brand']} ({item['variant']}) stock to {new_qty}.")

print("\nSUCCESS! Database seeded with full demo flow.")
