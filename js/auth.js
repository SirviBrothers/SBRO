// Supabase Configuration loaded dynamically from environment
async function setupAuth() {
    let client = window.supabaseClient;
    if (!client && typeof window.initSupabaseClient === 'function') {
        client = await window.initSupabaseClient();
    }
    if (!client && window.__ENV__ && window.__ENV__.SUPABASE_URL && window.__ENV__.SUPABASE_ANON_KEY && window.supabase) {
        client = window.supabase.createClient(window.__ENV__.SUPABASE_URL, window.__ENV__.SUPABASE_ANON_KEY);
        window.supabaseClient = client;
    }

    if (client) {
        // Check session on page load
        client.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                // Not logged in! Redirect to login page
                window.location.href = 'login.html';
            }
        });

        // Listen for sign-out events
        client.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                window.location.href = 'login.html';
            }
        });
    } else {
        console.warn('Supabase configuration missing or client not initialized. Check .env file.');
    }
}

// Run auth check
setupAuth();


// Authentication & Security Manager

// For now, we use a hardcoded secure PIN as requested: 2 Alphabets, 4 Numbers
const SECURE_PIN = "SB1234"; 


    // Logout Logic
    document.addEventListener('DOMContentLoaded', () => {
        const logoutBtn = document.getElementById('supabase-logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await window.supabaseClient.auth.signOut();
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
        if (window.WhatsAppReporter) {
            window.WhatsAppReporter.triggerOnLogin();
        }
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
            
            // Trigger Automated WhatsApp Credit & Due Digest
            if (window.WhatsAppReporter) {
                window.WhatsAppReporter.triggerOnLogin();
            }
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
