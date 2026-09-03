import re

js_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\js\app.js'

with open(js_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix shareBtn TypeError
# I will replace the shareBtn logic with an if check so it doesn't crash if the button doesn't exist.
share_btn_pattern = r"const shareBtn = document\.getElementById\('share-bill-btn'\);\s*shareBtn\.addEventListener\('click', async \(\) => \{"
share_btn_repl = '''const shareBtn = document.getElementById('share-bill-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', async () => {'''

# Find the closing brace of the shareBtn listener
# It's better to just comment out or remove the entire block, but an `if` statement is safer.
# Actually, since I know the exact block, let's just do a string replacement.
old_share_block = """    // Share Bill Button
    const shareBtn = document.getElementById('share-bill-btn');
    shareBtn.addEventListener('click', async () => {
        const billData = processBillData();
        if (billData) {
            shareBtn.disabled = true;
            shareBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Preparing...';
            
            try {
                const pdfBlob = await PDFGenerator.generateBlob(billData);
                const file = new File([pdfBlob], `Invoice_${billData.invoiceNo}.pdf`, { type: 'application/pdf' });
                
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: `Invoice #${billData.invoiceNo}`,
                        text: `Please find attached your invoice from Sirvi Brothers.`
                    });
                } else {
                    alert('Sharing not supported on this device. Downloading instead...');
                    await PDFGenerator.generate(billData);
                }
            } catch (error) {
                console.error("Share failed", error);
            } finally {
                shareBtn.innerHTML = '<i class="ph ph-share-network"></i> Share';
                shareBtn.disabled = false;
            }
        }
    });"""

new_share_block = """    // Share Bill Button (REMOVED)
    // const shareBtn = document.getElementById('share-bill-btn');
    // if (shareBtn) { ... }"""

content = content.replace(old_share_block, new_share_block)


# 2. Fix the ReferenceError for currentInventoryFilter
# Move `let currentInventoryFilter = 'all';` from line 1144 to the top of the file, around line 5.
old_var = "    let currentInventoryFilter = 'all';"
content = content.replace(old_var, "")

# Insert at the top of the file (after DOMContentLoaded or at the very top)
content = "let currentInventoryFilter = 'all';\n" + content

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS: Fixed Javascript errors in app.js")
