import re

with open('index.html', 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# Find all section tags with id and class
sections = re.findall(r'<section\s+id="([^"]+)"\s+class="([^"]+)"', content)
print("Sections found:")
for s_id, s_class in sections:
    print(f" - ID: {s_id}, Class: {s_class}")

# Find forms
forms = re.findall(r'<form\s+id="([^"]+)"', content)
print("\nForms found:")
for f_id in forms:
    print(f" - Form ID: {f_id}")

# Find tables
tables = re.findall(r'<table\s+[^>]*id="([^"]+)"', content)
print("\nTables found:")
for t_id in tables:
    print(f" - Table ID: {t_id}")
