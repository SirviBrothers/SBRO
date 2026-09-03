import urllib.request
import json

SUPABASE_URL = 'https://ztlrayekobgcllnxmqft.supabase.co/rest/v1/inventory?select=*'
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
        
        print(f"Total items in inventory: {len(data)}")
        
        print("\n--- Looking for GM Cuba Series ---")
        for item in data:
            if item.get('brand') and 'GM Cuba' in item.get('brand'):
                print(item)
                
        # Are there any items where variant has a trailing space?
        print("\n--- Looking for trailing spaces in variant ---")
        for item in data:
            v = item.get('variant', '')
            if v and (v.startswith(' ') or v.endswith(' ')):
                print("Trailing space found:", repr(v), "in item ID:", item.get('id'))
                
except Exception as e:
    print("Error:", e)
