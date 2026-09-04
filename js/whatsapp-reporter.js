// ==============================================================================
// SIRVI BROTHERS — WHATSAPP CREDIT & KHATA REPORTING ENGINE
// Aggregates 1,000+ credit records and dispatches executive summaries to WhatsApp
// ==============================================================================

class WhatsAppReporter {
    // Default Settings
    static get DEFAULT_SETTINGS() {
        return {
            phone: '919829000000', // Default phone number (editable in Settings)
            mode: 'callmebot',     // 'callmebot' (Automated Background) or 'native' (1-Click wa.me)
            apiKey: '',            // CallMeBot free API Key
            autoOnLogin: true,     // Send automatically upon login
            frequency: 'once_per_day', // 'once_per_day' or 'every_login'
            lastSentDate: ''
        };
    }

    // Load Settings from localStorage
    static getSettings() {
        try {
            const saved = localStorage.getItem('sb_whatsapp_settings');
            if (saved) {
                return { ...this.DEFAULT_SETTINGS, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.warn("Error reading WhatsApp settings:", e);
        }
        return this.DEFAULT_SETTINGS;
    }

    // Save Settings
    static saveSettings(settings) {
        try {
            const current = this.getSettings();
            const merged = { ...current, ...settings };
            localStorage.setItem('sb_whatsapp_settings', JSON.stringify(merged));
            return true;
        } catch (e) {
            console.error("Error saving WhatsApp settings:", e);
            return false;
        }
    }

    // --------------------------------------------------------------------------
    // DATA COMPILER (Handles 1,000+ entries via Supabase direct queries)
    // --------------------------------------------------------------------------
    static async compileCreditDigest() {
        if (!window.supabaseClient) {
            console.error("Supabase client not available for WhatsApp digest.");
            return null;
        }

        const client = window.supabaseClient;

        // 1. Fetch Customer Outstanding Dues (Sales with balance > 0)
        // Query in batches using pagination to scale across thousands of entries
        let customerDues = [];
        let from = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
            const { data, error } = await client
                .from('sales')
                .select('id, invoice_no, date, buyer_name, mobile, grand_total, received_amt, balance, remarks')
                .gt('balance', 0)
                .order('balance', { ascending: false })
                .range(from, from + pageSize - 1);

            if (error) {
                console.error("Error fetching sales dues:", error);
                break;
            }

            if (data && data.length > 0) {
                customerDues.push(...data);
                from += pageSize;
                if (data.length < pageSize) hasMore = false;
            } else {
                hasMore = false;
            }
        }

        // 2. Fetch Supplier Outstanding Dues (Purchases with balance > 0)
        let supplierDues = [];
        from = 0;
        hasMore = true;

        while (hasMore) {
            const { data, error } = await client
                .from('purchases')
                .select('*')
                .gt('balance', 0)
                .order('balance', { ascending: false })
                .range(from, from + pageSize - 1);

            if (error) {
                console.error("Error fetching purchase dues:", error);
                break;
            }

            if (data && data.length > 0) {
                supplierDues.push(...data);
                from += pageSize;
                if (data.length < pageSize) hasMore = false;
            } else {
                hasMore = false;
            }
        }

        // 3. Compile Analytics
        const totalCustomerDue = customerDues.reduce((sum, s) => sum + (parseFloat(s.balance) || 0), 0);
        const totalSupplierDue = supplierDues.reduce((sum, p) => sum + (parseFloat(p.balance) || 0), 0);
        const netPosition = totalCustomerDue - totalSupplierDue;

        // Count Overdue Bills
        const todayStr = new Date().toISOString().split('T')[0];
        const todayDate = new Date(todayStr).getTime();
        let overdueCount = 0;
        let overdueAmount = 0;

        customerDues.forEach(s => {
            let dueDate = s.due_date;
            if (!dueDate && s.remarks) {
                const match = s.remarks.match(/DueDate:([^\s]+)/);
                if (match) dueDate = match[1];
            }
            if (dueDate && new Date(dueDate).getTime() < todayDate) {
                overdueCount++;
                overdueAmount += (parseFloat(s.balance) || 0);
            }
        });

        // Consolidate customer dues by buyer name for Top Debtors ranking
        const customerMap = {};
        customerDues.forEach(s => {
            const name = s.buyer_name ? s.buyer_name.trim() : 'Unknown Customer';
            const bal = parseFloat(s.balance) || 0;
            
            let dueDate = s.due_date || '';
            if (!dueDate && s.remarks) {
                const match = s.remarks.match(/DueDate:([^\s]+)/);
                if (match) dueDate = match[1];
            }

            if (!customerMap[name]) {
                customerMap[name] = {
                    name,
                    mobile: s.mobile || '',
                    totalBalance: 0,
                    billCount: 0,
                    earliestDueDate: dueDate
                };
            }
            customerMap[name].totalBalance += bal;
            customerMap[name].billCount += 1;
            if (dueDate && (!customerMap[name].earliestDueDate || new Date(dueDate) < new Date(customerMap[name].earliestDueDate))) {
                customerMap[name].earliestDueDate = dueDate;
            }
        });

        const topCustomers = Object.values(customerMap)
            .sort((a, b) => b.totalBalance - a.totalBalance)
            .slice(0, 5);

        return {
            date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
            time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
            totalCustomerDue,
            customerCount: Object.keys(customerMap).length,
            totalBillsCount: customerDues.length,
            totalSupplierDue,
            supplierCount: supplierDues.length,
            netPosition,
            overdueCount,
            overdueAmount,
            topCustomers
        };
    }

    // --------------------------------------------------------------------------
    // MESSAGE FORMATTER
    // --------------------------------------------------------------------------
    static formatMessage(data) {
        const netIcon = data.netPosition >= 0 ? '🟢' : '🔴';
        const netSign = data.netPosition >= 0 ? '+' : '-';
        const formattedNet = Math.abs(data.netPosition).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const formattedCustomerDue = data.totalCustomerDue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const formattedSupplierDue = data.totalSupplierDue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const formattedOverdue = data.overdueAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        let msg = `📊 *SIRVI BROTHERS — DAILY CREDIT & KHATA DIGEST*\n`;
        msg += `📅 *Date:* ${data.date} | ⏰ *Time:* ${data.time}\n\n`;

        msg += `💰 *FINANCIAL SUMMARY:*\n`;
        msg += `• Total Customer Due (Udhaari): ₹${formattedCustomerDue} (${data.customerCount} Parties)\n`;
        msg += `• Total Supplier Due (Payable): ₹${formattedSupplierDue} (${data.supplierCount} Bills)\n`;
        msg += `• ${netIcon} Net Balance Position: ${netSign}₹${formattedNet}\n\n`;

        if (data.overdueCount > 0) {
            msg += `⚠️ *OVERDUE ALERTS:*\n`;
            msg += `• ${data.overdueCount} bills overdue past target date (₹${formattedOverdue})\n\n`;
        } else {
            msg += `✅ *OVERDUE ALERTS:*\n`;
            msg += `• No critical overdue bills today!\n\n`;
        }

        if (data.topCustomers && data.topCustomers.length > 0) {
            msg += `🏆 *TOP ${data.topCustomers.length} OUTSTANDING PARTIES:*\n`;
            data.topCustomers.forEach((c, idx) => {
                const bal = c.totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                const phoneStr = c.mobile ? ` (${c.mobile})` : '';
                const dueStr = c.earliestDueDate ? ` [Due: ${c.earliestDueDate}]` : '';
                msg += `${idx + 1}. ${c.name}${phoneStr}: ₹${bal}${dueStr}\n`;
            });
            msg += `\n`;
        }

        msg += `----------------------------------------\n`;
        msg += `_⚡ Automated digest triggered upon dashboard login._`;

        return msg;
    }

    // --------------------------------------------------------------------------
    // DISPATCHER
    // --------------------------------------------------------------------------
    static async sendDigest(force = false) {
        const settings = this.getSettings();
        const todayStr = new Date().toISOString().split('T')[0];

        // Frequency guard (if not forced)
        if (!force && settings.frequency === 'once_per_day') {
            if (settings.lastSentDate === todayStr) {
                console.log("WhatsApp digest already sent today. Skipping.");
                return { success: true, skipped: true };
            }
        }

        // Compile Khata
        const data = await this.compileCreditDigest();
        if (!data) {
            return { success: false, error: "Could not compile Khata data." };
        }

        const messageText = this.formatMessage(data);

        // Sanitize phone number (Indian format defaults to 91 prefix)
        let phone = (settings.phone || '').replace(/\D/g, '');
        if (phone.length === 10) phone = '91' + phone;

        if (!phone) {
            console.warn("Owner WhatsApp phone number not configured.");
            return { success: false, error: "Phone number not configured." };
        }

        let sentSuccess = false;

        // MODE 1: CallMeBot API (Automated Background Delivery)
        if (settings.mode === 'callmebot' && settings.apiKey) {
            try {
                const encodedText = encodeURIComponent(messageText);
                const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodedText}&apikey=${settings.apiKey}`;
                
                // Call API via fetch with no-cors fallback
                const res = await fetch(url, { mode: 'no-cors' });
                sentSuccess = true;
                this.showToast(`✅ WhatsApp Credit Digest sent to +${phone}!`, 'success');
            } catch (e) {
                console.warn("CallMeBot API request failed, falling back to 1-Click toast:", e);
                this.show1ClickToast(phone, messageText, data);
            }
        } else {
            // MODE 2: 1-Click Native WhatsApp Toast
            this.show1ClickToast(phone, messageText, data);
            sentSuccess = true;
        }

        if (sentSuccess) {
            settings.lastSentDate = todayStr;
            this.saveSettings(settings);
        }

        return { success: true, data };
    }

    // --------------------------------------------------------------------------
    // UI TOASTS & 1-CLICK POPUP
    // --------------------------------------------------------------------------
    static show1ClickToast(phone, messageText, data) {
        // Remove existing notification if present
        const existing = document.getElementById('wa-digest-toast');
        if (existing) existing.remove();

        const encoded = encodeURIComponent(messageText);
        const waUrl = `https://wa.me/${phone}?text=${encoded}`;
        const totalDueFormatted = data.totalCustomerDue.toLocaleString('en-IN', { minimumFractionDigits: 0 });

        const toast = document.createElement('div');
        toast.id = 'wa-digest-toast';
        toast.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            background: #111827;
            color: #FFFFFF;
            padding: 16px 20px;
            border-radius: 12px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
            border-left: 5px solid #25D366;
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 16px;
            font-family: 'Segoe UI', system-ui, sans-serif;
            animation: slideInUp 0.3s ease;
            max-width: 420px;
        `;

        toast.innerHTML = `
            <div style="background: rgba(37, 211, 102, 0.15); width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                <i class="ph ph-whatsapp-logo" style="color: #25D366; font-size: 24px;"></i>
            </div>
            <div style="flex: 1;">
                <div style="font-weight: 700; font-size: 0.95rem; margin-bottom: 2px;">Daily Credit Digest Ready</div>
                <div style="font-size: 0.85rem; color: #9CA3AF;">Total Due: <strong style="color: #F87171;">₹${totalDueFormatted}</strong> (${data.customerCount} Parties)</div>
            </div>
            <div style="display: flex; gap: 8px;">
                <a href="${waUrl}" target="_blank" id="wa-digest-open-btn" style="background: #25D366; color: white; border: none; padding: 8px 14px; border-radius: 6px; font-weight: 600; font-size: 0.85rem; text-decoration: none; display: flex; align-items: center; gap: 4px; cursor: pointer; transition: background 0.2s;">
                    Send <i class="ph ph-arrow-right"></i>
                </a>
                <button id="wa-digest-dismiss-btn" style="background: transparent; color: #9CA3AF; border: none; cursor: pointer; font-size: 1.1rem; padding: 4px 6px;">
                    &times;
                </button>
            </div>
        `;

        document.body.appendChild(toast);

        // Auto dismiss after 15 seconds
        const timeout = setTimeout(() => {
            if (toast) toast.remove();
        }, 15000);

        document.getElementById('wa-digest-dismiss-btn')?.addEventListener('click', () => {
            clearTimeout(timeout);
            toast.remove();
        });

        document.getElementById('wa-digest-open-btn')?.addEventListener('click', () => {
            clearTimeout(timeout);
            setTimeout(() => toast.remove(), 1000);
        });
    }

    static showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#065F46' : '#1F2937'};
            color: #FFFFFF;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.25);
            z-index: 10001;
            font-size: 0.9rem;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        toast.innerHTML = `<i class="ph ph-check-circle" style="color: #34D399; font-size: 1.2rem;"></i> ${message}`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }

    // --------------------------------------------------------------------------
    // LOGIN HOOK
    // --------------------------------------------------------------------------
    static triggerOnLogin() {
        const settings = this.getSettings();
        if (!settings.autoOnLogin) return;

        // Give the page 1.5 seconds to settle before compiling and notifying
        setTimeout(() => {
            this.sendDigest(false).catch(err => console.warn("WhatsApp login trigger error:", err));
        }, 1500);
    }
}

// Attach to window
window.WhatsAppReporter = WhatsAppReporter;

// ==============================================================================
// DOM EVENT WIRING FOR SETTINGS MODAL & TOPBAR BUTTON
// ==============================================================================
document.addEventListener('DOMContentLoaded', () => {
    const digestBtn = document.getElementById('whatsapp-digest-btn');
    const modal = document.getElementById('whatsapp-settings-modal');
    const closeBtn = document.getElementById('close-wa-modal-btn');
    const saveBtn = document.getElementById('save-wa-settings-btn');
    const testBtn = document.getElementById('wa-test-send-btn');
    const modeSelect = document.getElementById('wa-mode-select');
    const keyGroup = document.getElementById('callmebot-key-group');

    const phoneInput = document.getElementById('wa-phone-input');
    const apikeyInput = document.getElementById('wa-apikey-input');
    const autoCheck = document.getElementById('wa-auto-login-check');
    const freqSelect = document.getElementById('wa-frequency-select');

    function populateModal() {
        const settings = WhatsAppReporter.getSettings();
        if (phoneInput) phoneInput.value = settings.phone || '';
        if (modeSelect) {
            modeSelect.value = settings.mode || 'callmebot';
            if (keyGroup) {
                keyGroup.style.display = settings.mode === 'callmebot' ? 'block' : 'none';
            }
        }
        if (apikeyInput) apikeyInput.value = settings.apiKey || '';
        if (autoCheck) autoCheck.checked = settings.autoOnLogin !== false;
        if (freqSelect) freqSelect.value = settings.frequency || 'once_per_day';
    }

    if (digestBtn && modal) {
        digestBtn.addEventListener('click', (e) => {
            e.preventDefault();
            populateModal();
            modal.style.display = 'flex';
        });
    }

    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    if (modeSelect && keyGroup) {
        modeSelect.addEventListener('change', (e) => {
            keyGroup.style.display = e.target.value === 'callmebot' ? 'block' : 'none';
        });
    }

    if (saveBtn && modal) {
        saveBtn.addEventListener('click', () => {
            const phone = (phoneInput?.value || '').trim();
            const mode = modeSelect?.value || 'callmebot';
            const apiKey = (apikeyInput?.value || '').trim();
            const autoOnLogin = autoCheck ? autoCheck.checked : true;
            const frequency = freqSelect?.value || 'once_per_day';

            if (!phone) {
                alert('Please enter your WhatsApp mobile number.');
                return;
            }

            WhatsAppReporter.saveSettings({
                phone,
                mode,
                apiKey,
                autoOnLogin,
                frequency
            });

            WhatsAppReporter.showToast('✅ WhatsApp settings saved successfully!', 'success');
            modal.style.display = 'none';
        });
    }

    if (testBtn) {
        testBtn.addEventListener('click', async () => {
            const originalText = testBtn.innerHTML;
            testBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Compiling & Sending...';
            testBtn.disabled = true;

            try {
                if (phoneInput && phoneInput.value) {
                    WhatsAppReporter.saveSettings({
                        phone: phoneInput.value.trim(),
                        mode: modeSelect?.value || 'callmebot',
                        apiKey: apikeyInput?.value.trim() || ''
                    });
                }
                const res = await WhatsAppReporter.sendDigest(true);
                if (res && res.success) {
                    WhatsAppReporter.showToast('✅ Test digest dispatched successfully!', 'success');
                } else {
                    alert('Could not dispatch test digest: ' + (res?.error || 'Unknown error'));
                }
            } catch (err) {
                console.error("Test send error:", err);
                alert("Error sending test digest: " + err.message);
            } finally {
                testBtn.innerHTML = originalText;
                testBtn.disabled = false;
            }
        });
    }
});

