import re

html_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\index.html'

with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

modal_html = """
    <!-- Access Code Overlay -->
    <div class="modal-overlay" id="access-code-overlay" style="display: flex; background: rgba(17, 24, 39, 0.95); z-index: 9999;">
        <div class="modal-content" style="width: 400px; text-align: center; border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); border: 1px solid rgba(255,255,255,0.1); background: #ffffff;">
            <img src="assets/sb_logo.png" alt="Logo" style="width: 120px; margin-bottom: 20px;">
            <h2 style="margin-bottom: 10px; color: #111827;">Enter Access Code</h2>
            <p style="color: #6B7280; font-size: 0.95rem; margin-bottom: 25px;">Please enter your 6-digit security pin to access the dashboard.</p>
            
            <div style="display: flex; justify-content: center; gap: 8px; margin-bottom: 25px;" id="pin-inputs">
                <!-- 2 Alphabets -->
                <input type="text" class="pin-box" maxlength="1" style="width: 45px; height: 55px; text-align: center; font-size: 1.5rem; font-weight: 700; border: 2px solid #D1D5DB; border-radius: 8px; text-transform: uppercase;">
                <input type="text" class="pin-box" maxlength="1" style="width: 45px; height: 55px; text-align: center; font-size: 1.5rem; font-weight: 700; border: 2px solid #D1D5DB; border-radius: 8px; text-transform: uppercase; margin-right: 10px;">
                
                <!-- 4 Numbers -->
                <input type="text" class="pin-box num" maxlength="1" style="width: 45px; height: 55px; text-align: center; font-size: 1.5rem; font-weight: 700; border: 2px solid #D1D5DB; border-radius: 8px;">
                <input type="text" class="pin-box num" maxlength="1" style="width: 45px; height: 55px; text-align: center; font-size: 1.5rem; font-weight: 700; border: 2px solid #D1D5DB; border-radius: 8px;">
                <input type="text" class="pin-box num" maxlength="1" style="width: 45px; height: 55px; text-align: center; font-size: 1.5rem; font-weight: 700; border: 2px solid #D1D5DB; border-radius: 8px;">
                <input type="text" class="pin-box num" maxlength="1" style="width: 45px; height: 55px; text-align: center; font-size: 1.5rem; font-weight: 700; border: 2px solid #D1D5DB; border-radius: 8px;">
            </div>
            
            <div id="pin-error" style="color: #DC2626; font-size: 0.9rem; font-weight: 600; margin-bottom: 15px; min-height: 20px;"></div>
            
            <button class="btn btn-primary" id="verify-pin-btn" style="width: 100%; padding: 14px; font-size: 1.1rem; letter-spacing: 0.05em;">Unlock Dashboard</button>
        </div>
    </div>
"""

# Insert modal right after <body> tag
if '<body>' in content:
    content = content.replace('<body>', '<body>\n' + modal_html)
else:
    # fallback
    idx = content.find('<div class="sidebar">')
    if idx != -1:
        content = content[:idx] + modal_html + '\n' + content[idx:]

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS: Injected Access Code Modal into index.html")
