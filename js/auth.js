// Supabase Configuration loaded dynamically from environment
const SUPABASE_FALLBACK_URL = 'https://ztlrayekobgcllnxmqft.supabase.co';
const SUPABASE_FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0bHJheWVrb2JnY2xsbnhtcWZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNzc4NTIsImV4cCI6MjEwMzk1Mzg1Mn0.SCv_r5KOQIN0RTvEEQrZLCOGaaneWsPlJuIMnyxYXkE';

function getSupabaseClient() {
    if (window.supabaseClient) return window.supabaseClient;
    const url = (window.__ENV__ && window.__ENV__.SUPABASE_URL) || SUPABASE_FALLBACK_URL;
    const key = (window.__ENV__ && window.__ENV__.SUPABASE_ANON_KEY) || SUPABASE_FALLBACK_KEY;
    if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
        window.supabaseClient = window.supabase.createClient(url, key);
        return window.supabaseClient;
    }
    return null;
}

// Ensure client exists immediately
getSupabaseClient();

async function setupAuth() {
    let client = getSupabaseClient();
    if (!client && typeof window.initSupabaseClient === 'function') {
        client = await window.initSupabaseClient();
    }

    if (client && client.auth) {
        // Check session on page load
        client.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                // Not logged in! Redirect to login page
                window.location.href = 'login.html';
            }
        }).catch(err => {
            console.warn('Session check warning:', err);
        });

        // Listen for sign-out events
        client.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                window.location.href = 'login.html';
            }
        });
    }
}

// Run auth check
setupAuth();



// Authentication & Security Manager

// Retrieve credentials dynamically from environment (.env)
function getSecureCredentials() {
    const env = window.__ENV__ || {};
    const pin = (env.APP_PASSWORD || env.APP_PASSCODE || "SB1234").trim();
    const username = (env.APP_USERNAME || "SirviBrothers").trim();
    return { pin, username };
}

// 5-Minute Inactivity Auto-Lock Configuration
const AUTO_LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
let lastActivityTime = Date.now();
let isDashboardUnlocked = false;

function recordUserActivity() {
    lastActivityTime = Date.now();
}

// Attach activity listeners across window
['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'].forEach(eventType => {
    window.addEventListener(eventType, recordUserActivity, { passive: true });
});

// Lock Dashboard Function
function lockDashboard(reason = '') {
    isDashboardUnlocked = false;
    sessionStorage.removeItem('dashboard_unlocked');

    const overlay = document.getElementById('access-code-overlay');
    const inputs = document.querySelectorAll('.pin-box');
    const errorMsg = document.getElementById('pin-error');

    if (overlay) {
        overlay.style.display = 'flex';
        overlay.style.opacity = '1';
    }

    if (inputs && inputs.length > 0) {
        inputs.forEach(inp => {
            inp.value = '';
            inp.style.borderColor = '#CBD5E1';
            inp.style.boxShadow = 'none';
        });
        setTimeout(() => {
            if (inputs[0]) inputs[0].focus();
        }, 120);
    }

    if (errorMsg) {
        if (reason) {
            errorMsg.textContent = reason;
            errorMsg.style.color = '#F59E0B'; // Warning yellow/amber
        } else {
            errorMsg.textContent = '';
        }
    }
}

// Unlock Dashboard Function
function unlockDashboard() {
    isDashboardUnlocked = true;
    lastActivityTime = Date.now();

    const overlay = document.getElementById('access-code-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 300);
    }

    // Trigger Automated WhatsApp Credit & Due Digest upon unlock
    if (window.WhatsAppReporter && typeof window.WhatsAppReporter.triggerOnLogin === 'function') {
        window.WhatsAppReporter.triggerOnLogin();
    }
}

// Check for 5-minute inactivity auto-lock every 2 seconds
setInterval(() => {
    if (isDashboardUnlocked) {
        const elapsed = Date.now() - lastActivityTime;
        if (elapsed >= AUTO_LOCK_TIMEOUT_MS) {
            lockDashboard("Dashboard auto-locked after 5 minutes of inactivity.");
        }
    }
}, 2000);


// Logout Logic
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('supabase-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (window.supabaseClient && window.supabaseClient.auth) {
                await window.supabaseClient.auth.signOut();
            }
            lockDashboard();
            window.location.href = 'login.html';
        });
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('access-code-overlay');
    const verifyBtn = document.getElementById('verify-pin-btn');
    const inputs = document.querySelectorAll('.pin-box');
    const errorMsg = document.getElementById('pin-error');

    // NOTE: On page refresh / initial load, ALWAYS ask for passcode (no bypass)
    lockDashboard();

    if (!overlay || inputs.length === 0) return;

    // Focus / Blur visual cues
    inputs.forEach((input, index) => {
        input.addEventListener('focus', (e) => {
            e.target.style.borderColor = '#4F46E5';
            e.target.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.2)';
            e.target.select();
        });

        input.addEventListener('blur', (e) => {
            e.target.style.borderColor = '#CBD5E1';
            e.target.style.boxShadow = 'none';
        });

        // Input typing logic with dot format mask & auto-advance
        input.addEventListener('input', (e) => {
            recordUserActivity();
            const val = e.target.value;

            // First two boxes: letters only, auto-uppercase
            if (index < 2) {
                e.target.value = val.replace(/[^A-Za-z]/g, '').toUpperCase();
            } else {
                // Last four boxes: digits only
                e.target.value = val.replace(/[^0-9]/g, '');
            }

            if (e.target.value !== '' && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }

            // If all 6 characters entered, auto-trigger verification
            let allFilled = true;
            inputs.forEach(inp => { if (!inp.value) allFilled = false; });
            if (allFilled && verifyBtn) {
                verifyBtn.click();
            }
        });

        // Key navigation (Backspace, Left/Right arrows, Enter)
        input.addEventListener('keydown', (e) => {
            recordUserActivity();
            if (e.key === 'Backspace') {
                if (e.target.value === '' && index > 0) {
                    inputs[index - 1].focus();
                    inputs[index - 1].value = '';
                } else {
                    e.target.value = '';
                }
            } else if (e.key === 'ArrowLeft' && index > 0) {
                inputs[index - 1].focus();
            } else if (e.key === 'ArrowRight' && index < inputs.length - 1) {
                inputs[index + 1].focus();
            } else if (e.key === 'Enter') {
                if (verifyBtn) verifyBtn.click();
            }
        });

        // Paste support (e.g. pasting SB1234)
        input.addEventListener('paste', (e) => {
            e.preventDefault();
            recordUserActivity();
            const pastedText = (e.clipboardData || window.clipboardData).getData('text').trim();
            if (!pastedText) return;

            const cleanChars = pastedText.replace(/[^A-Za-z0-9]/g, '');
            for (let i = 0; i < inputs.length && i < cleanChars.length; i++) {
                if (i < 2) {
                    inputs[i].value = cleanChars[i].replace(/[^A-Za-z]/g, '').toUpperCase();
                } else {
                    inputs[i].value = cleanChars[i].replace(/[^0-9]/g, '');
                }
            }

            const targetIdx = Math.min(cleanChars.length, inputs.length - 1);
            inputs[targetIdx].focus();

            if (cleanChars.length >= 6 && verifyBtn) {
                verifyBtn.click();
            }
        });
    });

    // Verification Logic
    if (verifyBtn) {
        verifyBtn.addEventListener('click', () => {
            recordUserActivity();
            let enteredPin = '';
            inputs.forEach(input => enteredPin += input.value.trim());

            const { pin: SECURE_PIN } = getSecureCredentials();

            if (enteredPin.length !== 6) {
                if (errorMsg) {
                    errorMsg.style.color = '#DC2626';
                    errorMsg.textContent = "Please enter all 6 characters.";
                }
                return;
            }

            // Case-insensitive comparison against configured PIN
            if (enteredPin.toUpperCase() === SECURE_PIN.toUpperCase()) {
                if (errorMsg) errorMsg.textContent = '';
                unlockDashboard();
            } else {
                if (errorMsg) {
                    errorMsg.style.color = '#DC2626';
                    errorMsg.textContent = "Incorrect Access Code. Please try again.";
                }
                inputs.forEach(input => {
                    input.value = '';
                    input.style.borderColor = '#DC2626';
                });
                setTimeout(() => {
                    inputs.forEach(input => input.style.borderColor = '#CBD5E1');
                    inputs[0].focus();
                }, 800);
            }
        });
    }
});
