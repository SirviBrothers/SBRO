import json
import urllib.request
import urllib.parse

# 1. We will use the hardcoded inventory structure from the user's inventory.js
INVENTORY_DATA = {
    "Wires": {
        "brands": ["GM Wires", "RR Kabel", "Havells", "Million Wires", "Servo Wires", "Ankit Wires"],
        "variants": ["0.75 Sq.mm", "1.0 Sq.mm", "1.5 Sq.mm", "2.5 Sq.mm", "4.0 Sq.mm"]
    },
    "Bulb": {
        "brands": ["GM Regular LED"],
        "variants": ["5W", "9W", "12W", "15W", "18W", "23W", "30W", "40W", "50W"]
    },
    "Emergency Bulb": {
        "brands": ["GM Emergency (Inverter)"],
        "variants": ["9W", "12W", "15W", "30W"]
    },
    "Tubelight": {
        "brands": ["GM"],
        "variants": ["20W", "36W", "50W", "Tricolor (3-in-1)"]
    },
    "Fan - Ceiling": {
        "brands": ["Bajaj", "Havells", "Havells (Reo)", "Crompton", "Orient", "GM", "Usha", "Reno", "Indo", "Blue"],
        "variants": ["1200 mm"]
    },
    "Fan - Wall": {
        "brands": ["Indo", "Fortuner", "Blue"],
        "variants": ["Standard"]
    },
    "Mixer": {
        "brands": ["Bajaj", "Cello", "Fortuner", "Blue", "Indo"],
        "variants": ["Standard"]
    },
    "Induction Cooktop": {
        "brands": ["Orient", "Cello", "Bajaj", "Blue"],
        "variants": ["Standard"]
    },
    "Geyser": {
        "brands": ["Havells", "Orient", "Indo"],
        "variants": ["Storage", "Instant (Canister)"]
    },
    "Iron": {
        "brands": ["Orient", "Bajaj", "Cello"],
        "variants": ["Standard"]
    },
    "Rechargeable Batteries": {
        "brands": ["Crompton", "Bajaj", "RR"],
        "variants": ["Standard"]
    },
    "MCBs": {
        "brands": ["V-Guard", "GM", "Vensor (Veto)"],
        "variants": ["16A", "20A", "32A", "40A"]
    },
    "Switch": {
        "brands": ["GM", "V-Guard", "Vensor"],
        "variants": ["6A", "16A", "Two-way"]
    },
    "Socket": {
        "brands": ["GM", "V-Guard", "Vensor"],
        "variants": ["6A", "16A"]
    },
    "Modular Plate": {
        "brands": ["GM", "V-Guard", "Vensor"],
        "variants": ["1M", "2M", "3M", "4M", "6M", "8M", "12M", "18M"]
    },
    "Door Bell": {
        "brands": ["GM", "V-Guard"],
        "variants": ["Ding Dong", "Musical"]
    }
}

# 2. Prepare payload
items = []
for category, data in INVENTORY_DATA.items():
    for brand in data.get('brands', []):
        for variant in data.get('variants', []):
            items.append({
                "category": category,
                "brand": brand,
                "variant": variant,
                "quantity": 0,
                "unit": "pcs",
                "price": 0,
                "min_stock": 0
            })

print(f"Prepared {len(items)} inventory combinations.")

SUPABASE_URL = 'https://ztlrayekobgcllnxmqft.supabase.co/rest/v1/inventory'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0bHJheWVrb2JnY2xsbnhtcWZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNzc4NTIsImV4cCI6MjEwMzk1Mzg1Mn0.SCv_r5KOQIN0RTvEEQrZLCOGaaneWsPlJuIMnyxYXkE'

headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
}

data = json.dumps(items).encode('utf-8')

req = urllib.request.Request(SUPABASE_URL, data=data, headers=headers, method='POST')

try:
    with urllib.request.urlopen(req) as response:
        print(f"Success! Status Code: {response.getcode()}")
except urllib.error.URLError as e:
    print(f"Failed to upload data: {e}")
    if hasattr(e, 'read'):
        print(e.read().decode('utf-8'))
