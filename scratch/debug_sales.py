import urllib.request
import json

# Try to fetch sales WITH the sale_items join
SUPABASE_URL = 'https://ztlrayekobgcllnxmqft.supabase.co/rest/v1/sales?select=*,sale_items(*)'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0bHJheWVrb2JnY2xsbnhtcWZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNzc4NTIsImV4cCI6MjEwMzk1Mzg1Mn0.SCv_r5KOQIN0RTvEEQrZLCOGaaneWsPlJuIMnyxYXkE'

headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Accept': 'application/json'
}

req = urllib.request.Request(SUPABASE_URL, headers=headers, method='GET')
try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode('utf-8'))
        print(f"Success! Fetched {len(data)} sales.")
        if len(data) > 0:
            print("First sale structure:")
            print(data[0])
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code}")
    print(e.read().decode('utf-8'))
except Exception as e:
    print("Error:", e)
