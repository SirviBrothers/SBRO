import os
import re

app_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\js\app.js'

with open(app_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Let's see what variables it uses around 'Stock:'
# It probably looks like `(Stock: ${invItem.stock})`
content = re.sub(r'\(Stock: \$\{(.*?)\.stock\}\)', r'(Stock: ${\1.quantity})', content)
content = re.sub(r'\(Stock: \$\{(.*?)\.quantity\}\)', r'(Stock: ${\1.quantity})', content) # Ensure it's correct

# Also, if there are any other .stock usages remaining:
# e.g. .stock > 0, we can replace them using a robust regex for word boundary \b\w+\.stock\b
def replace_stock(match):
    word = match.group(0)
    # Don't replace if it's already item.quantity or something
    return word.replace('.stock', '.quantity')

# Only apply to variables, e.g. invItem.stock, matching letters/numbers then .stock
content = re.sub(r'\b[a-zA-Z0-9_]+\.stock\b', replace_stock, content)

with open(app_path, 'w', encoding='utf-8') as f:
    f.write(content)
    
print("SUCCESS: Fixed remaining .stock variable references.")
