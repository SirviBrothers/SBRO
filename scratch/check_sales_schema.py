import urllib.request
import json

SUPABASE_URL = 'https://ztlrayekobgcllnxmqft.supabase.co/rest/v1/'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0bHJheWVrb2JnY2xsbnhtcWZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNzc4NTIsImV4cCI6MjEwMzk1Mzg1Mn0.SCv_r5KOQIN0RTvEEQrZLCOGaaneWsPlJuIMnyxYXkE'

headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json'
}

url = SUPABASE_URL + 'sales?limit=1'
req = urllib.request.Request(url, headers=headers, method='GET')
try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode('utf-8'))
        if len(data) > 0:
            print("Sales Columns:")
            print(data[0].keys())
        else:
            print("Sales table is empty. Attempting to insert a dummy row and read it.")
            dummy = {"invoice_no": "DUMMY", "total_amount": 0}
            # Actually we can't be sure of non-null columns. Let's just fetch openapi spec.
except Exception as e:
    print(f"Error: {e}")

# Fetch openapi spec to see schema
url = SUPABASE_URL + '?apikey=' + SUPABASE_KEY
req = urllib.request.Request(url, headers=headers, method='GET')
try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode('utf-8'))
        print("Sales schema:")
        print(data['definitions']['sales']['properties'].keys())
except Exception as e:
    print(f"OpenAPI Error: {e}")
