// Supabase Configuration for Secure Routing (PASTE YOUR KEYS HERE)
const SUPABASE_URL = 'https://ztlrayekobgcllnxmqft.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0bHJheWVrb2JnY2xsbnhtcWZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNzc4NTIsImV4cCI6MjEwMzk1Mzg1Mn0.SCv_r5KOQIN0RTvEEQrZLCOGaaneWsPlJuIMnyxYXkE';

if (SUPABASE_URL && SUPABASE_URL.startsWith('http')) {
    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Check session on page load
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
            // Not logged in! Redirect to login page
            window.location.href = 'login.html';
        }
    });
    
    // Listen for sign-out events (Optional future feature)
    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
            window.location.href = 'login.html';
        }
    });
} else {
    console.warn('Supabase keys missing in auth.js. Secure routing bypassed for testing.');
}

// Authentication & Security Manager

// For now, we use a hardcoded secure PIN as requested: 2 Alphabets, 4 Numbers
const SECURE_PIN = "SB1234"; 


    // Logout Logic
    document.addEventListener('DOMContentLoaded', () => {
        const logoutBtn = document.getElementById('supabase-logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await supabaseClient.auth.signOut();
                sessionStorage.removeItem('dashboard_unlocked');
                window.location.href = 'login.html';
            });
        }
    });

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
