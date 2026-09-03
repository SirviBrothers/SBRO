import urllib.request
import json

SUPABASE_URL = 'https://ztlrayekobgcllnxmqft.supabase.co/rest/v1/'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0bHJheWVrb2JnY2xsbnhtcWZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNzc4NTIsImV4cCI6MjEwMzk1Mzg1Mn0.SCv_r5KOQIN0RTvEEQrZLCOGaaneWsPlJuIMnyxYXkE'

headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json'
}

url = SUPABASE_URL + 'purchases?limit=1'
req = urllib.request.Request(url, headers=headers, method='GET')
try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode('utf-8'))
        if len(data) > 0:
            print("Purchases Columns:")
            print(data[0].keys())
        else:
            print("Purchases table is empty.")
            
    # Also check parties table schema
    url = SUPABASE_URL + 'parties?limit=1'
    req = urllib.request.Request(url, headers=headers, method='GET')
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode('utf-8'))
        if len(data) > 0:
            print("\nParties Columns:")
            print(data[0].keys())
        else:
            print("\nParties table is empty.")
            
except Exception as e:
    print(f"Error: {e}")
    if hasattr(e, 'read'):
        print(e.read().decode('utf-8'))
