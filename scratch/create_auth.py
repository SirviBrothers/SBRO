import os

js_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\js\auth.js'
html_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\index.html'

auth_js_content = """// Authentication & Security Manager

// For now, we use a hardcoded secure PIN as requested: 2 Alphabets, 4 Numbers
const SECURE_PIN = "SB1234"; 

document.addEventListener('DOMContentLoaded', () => {
    
    // --- Phase 4: 6-Digit Access Code Logic ---
    const overlay = document.getElementById('access-code-overlay');
    const verifyBtn = document.getElementById('verify-pin-btn');
    const inputs = document.querySelectorAll('.pin-box');
    const errorMsg = document.getElementById('pin-error');
    
    // Check if session is already unlocked
    if (sessionStorage.getItem('dashboard_unlocked') === 'true') {
        if (overlay) overlay.style.display = 'none';
    }
    
    if (!overlay) return;

    // Auto-focus next input logic
    inputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            // Force uppercase for the first two (alphabets)
            if (index < 2) {
                e.target.value = e.target.value.replace(/[^A-Za-z]/g, '').toUpperCase();
            } else {
                // Force numbers for the last four
                e.target.value = e.target.value.replace(/[^0-9]/g, '');
            }
            
            if (e.target.value !== '' && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
        });
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
                inputs[index - 1].focus();
            }
            if (e.key === 'Enter') {
                verifyBtn.click();
            }
        });
    });
    
    verifyBtn.addEventListener('click', () => {
        let enteredPin = '';
        inputs.forEach(input => enteredPin += input.value);
        
        if (enteredPin.length !== 6) {
            errorMsg.textContent = "Please enter all 6 characters.";
            return;
        }
        
        // Validate Format (2 Alpha, 4 Num)
        const formatRegex = /^[A-Z]{2}[0-9]{4}$/;
        if (!formatRegex.test(enteredPin)) {
            errorMsg.textContent = "Format must be 2 Letters followed by 4 Numbers.";
            return;
        }
        
        // Check PIN
        if (enteredPin === SECURE_PIN) {
            // Success!
            sessionStorage.setItem('dashboard_unlocked', 'true');
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 300);
        } else {
            errorMsg.textContent = "Incorrect Access Code.";
            inputs.forEach(input => {
                input.value = '';
                input.style.borderColor = '#DC2626';
            });
            setTimeout(() => {
                inputs.forEach(input => input.style.borderColor = '#D1D5DB');
            }, 1000);
            inputs[0].focus();
        }
    });
});
"""

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(auth_js_content)

# Now inject <script src="js/auth.js"></script> into index.html if not already there
with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

if 'src="js/auth.js"' not in content:
    content = content.replace('<script src="js/app.js"></script>', '<script src="js/auth.js"></script>\n    <script src="js/app.js"></script>')
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("SUCCESS: Created auth.js and linked it to index.html")
