import re

with open('js/app.js', 'r', encoding='utf-8', errors='ignore') as f:
    app_js = f.read()

with open('index.html', 'r', encoding='utf-8', errors='ignore') as f:
    index_html = f.read()

# 1. Check getElementById in app.js vs index.html
id_calls = re.findall(r"getElementById\(['\"]([^'\"]+)['\"]\)", app_js)
unique_ids = set(id_calls)
missing_ids = []
for el_id in unique_ids:
    if f'id="{el_id}"' not in index_html and f"id='{el_id}'" not in index_html:
        missing_ids.append(el_id)

print(f"Total getElementById calls in app.js: {len(unique_ids)}")
print(f"IDs used in JS but missing in HTML ({len(missing_ids)}):")
for mid in sorted(missing_ids):
    print(f" - {mid}")

# 2. Check querySelector / querySelectorAll with #
qs_ids = re.findall(r"querySelector\(['\"]#([^'\s\.\,>:]+)['\"]\)", app_js)
qs_ids.extend(re.findall(r"querySelectorAll\(['\"]#([^'\s\.\,>:]+)['\"]\)", app_js))
unique_qs = set(qs_ids)
missing_qs = []
for el_id in unique_qs:
    if f'id="{el_id}"' not in index_html and f"id='{el_id}'" not in index_html:
        missing_qs.append(el_id)

print(f"\nMissing querySelector IDs ({len(missing_qs)}):")
for mid in sorted(missing_qs):
    print(f" - {mid}")

# 3. Check StorageManager method calls in app.js vs methods in storage.js
with open('js/storage.js', 'r', encoding='utf-8', errors='ignore') as f:
    storage_js = f.read()

sm_calls = set(re.findall(r"StorageManager\.([a-zA-Z0-9_]+)\(", app_js))
sm_methods = set(re.findall(r"static\s+(?:async\s+)?([a-zA-Z0-9_]+)\(", storage_js))

print(f"\nStorageManager calls in app.js: {len(sm_calls)}")
missing_methods = sm_calls - sm_methods
print(f"StorageManager methods called in app.js but MISSING in storage.js ({len(missing_methods)}):")
for m in sorted(missing_methods):
    print(f" - StorageManager.{m}")
