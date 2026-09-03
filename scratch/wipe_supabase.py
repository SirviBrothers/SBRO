import urllib.request
import json

SUPABASE_URL = 'https://ztlrayekobgcllnxmqft.supabase.co/rest/v1/'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0bHJheWVrb2JnY2xsbnhtcWZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNzc4NTIsImV4cCI6MjEwMzk1Mzg1Mn0.SCv_r5KOQIN0RTvEEQrZLCOGaaneWsPlJuIMnyxYXkE'

headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json'
}

def delete_all(table):
    url = SUPABASE_URL + table + '?id=not.is.null' # Delete all rows where id is not null (which is all rows)
    req = urllib.request.Request(url, headers=headers, method='DELETE')
    try:
        urllib.request.urlopen(req)
        print(f"Deleted all records from '{table}'")
    except Exception as e:
        print(f"Error deleting from {table}: {e}")

def reset_inventory():
    # Set all quantities to 0 instead of deleting the items themselves
    # so the user doesn't have to manually recreate 136 items.
    url = SUPABASE_URL + 'inventory?quantity=gt.0'
    data = json.dumps({"quantity": 0}).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers=headers, method='PATCH')
    try:
        urllib.request.urlopen(req)
        print("Reset all inventory quantities to 0.")
    except Exception as e:
        print(f"Error resetting inventory: {e}")

# Order matters for foreign keys! Delete children first.
delete_all('sale_items')
delete_all('sales')

delete_all('purchase_items')
delete_all('purchases')

delete_all('parties')

reset_inventory()

print("\nSUCCESS: All transactional data wiped. Inventory stock reset to 0.")
