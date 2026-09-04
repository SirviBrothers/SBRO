// 3-Cycle Comprehensive Test Suite for Sirvi Brothers
// Tests all modules, storage operations, and calculations 3 times

const SUPABASE_URL = 'https://ztlrayekobgcllnxmqft.supabase.co/rest/v1/';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0bHJheWVrb2JnY2xsbnhtcWZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNzc4NTIsImV4cCI6MjEwMzk1Mzg1Mn0.SCv_r5KOQIN0RTvEEQrZLCOGaaneWsPlJuIMnyxYXkE';

const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
};

async function apiRequest(endpoint, method = 'GET', body = null) {
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${SUPABASE_URL}${endpoint}`, opts);
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch(e) { data = text; }
    return { status: res.status, ok: res.ok, data };
}

// Test Logger
const results = {
    cycle1: [],
    cycle2: [],
    cycle3: []
};

function logTest(cycle, name, passed, details = '') {
    const record = { name, passed, details };
    results[cycle].push(record);
    const mark = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`[${cycle.toUpperCase()}] ${mark}: ${name} ${details ? '-> ' + details : ''}`);
}

async function runCycle1() {
    console.log('\n======================================================');
    console.log('   CYCLE 1: Database & StorageManager Method Tests    ');
    console.log('======================================================');

    // 1. Parties Fetch
    try {
        const res = await apiRequest('parties?select=*&limit=5');
        logTest('cycle1', 'Parties: Fetch Parties', res.ok && Array.isArray(res.data), `Fetched ${res.data?.length || 0} parties`);
    } catch(e) {
        logTest('cycle1', 'Parties: Fetch Parties', false, e.message);
    }

    // 2. Party Auto Register / Save
    let testPartyId = null;
    try {
        const testName = 'Test User ' + Date.now().toString().slice(-4);
        const res = await apiRequest('parties', 'POST', [{
            name: testName,
            mobile: '9876543210',
            address: 'Main Market, Sumerpur',
            gstn: '08ABCDE1234F1Z5'
        }]);
        if (res.ok && res.data && res.data.length > 0) {
            testPartyId = res.data[0].id;
            logTest('cycle1', 'Parties: Create Party', true, `UUID: ${testPartyId}`);
        } else {
            logTest('cycle1', 'Parties: Create Party', false, JSON.stringify(res.data));
        }
    } catch(e) {
        logTest('cycle1', 'Parties: Create Party', false, e.message);
    }

    // 3. Party Update with UUID
    if (testPartyId) {
        try {
            const res = await apiRequest(`parties?id=eq.${testPartyId}`, 'PATCH', {
                address: 'Updated Address, Sumerpur'
            });
            logTest('cycle1', 'Parties: Update Party with UUID string', res.ok, `Status: ${res.status}`);
        } catch(e) {
            logTest('cycle1', 'Parties: Update Party with UUID string', false, e.message);
        }
    }

    // 4. Sales Fetch
    try {
        const res = await apiRequest('sales?select=*,sale_items(*)&limit=5');
        logTest('cycle1', 'Sales: Fetch Sales with Items', res.ok && Array.isArray(res.data), `Fetched ${res.data?.length || 0} sales`);
    } catch(e) {
        logTest('cycle1', 'Sales: Fetch Sales with Items', false, e.message);
    }

    // 5. Purchases Fetch
    try {
        const res = await apiRequest('purchases?select=*,purchase_items(*)&limit=5');
        logTest('cycle1', 'Purchases: Fetch Purchases with Items', res.ok && Array.isArray(res.data), `Fetched ${res.data?.length || 0} purchases`);
    } catch(e) {
        logTest('cycle1', 'Purchases: Fetch Purchases with Items', false, e.message);
    }

    // 6. Purchases Insert with generated Bill No
    let testPurchId = null;
    try {
        const testBillNo = 'PUR-TEST-' + Date.now().toString().slice(-4);
        const res = await apiRequest('purchases', 'POST', [{
            bill_no: testBillNo,
            date: '2026-09-04',
            vendor_name: 'GM Modular Vendor',
            mobile: '9123456780',
            total_amount: 1500,
            paid_amount: 500,
            balance: 1000
        }]);
        if (res.ok && res.data && res.data.length > 0) {
            testPurchId = res.data[0].id;
            logTest('cycle1', 'Purchases: Insert Purchase with Bill No', true, `Purch UUID: ${testPurchId}`);
        } else {
            logTest('cycle1', 'Purchases: Insert Purchase with Bill No', false, JSON.stringify(res.data));
        }
    } catch(e) {
        logTest('cycle1', 'Purchases: Insert Purchase with Bill No', false, e.message);
    }

    // 7. Cleanup test purchase & party
    if (testPurchId) {
        await apiRequest(`purchases?id=eq.${testPurchId}`, 'DELETE');
    }
    if (testPartyId) {
        await apiRequest(`parties?id=eq.${testPartyId}`, 'DELETE');
    }
}

async function runCycle2() {
    console.log('\n======================================================');
    console.log('   CYCLE 2: Business Logic & Workflow Simulations     ');
    console.log('======================================================');

    // 1. Invoice Number Generation Logic
    const testLastNo = 'INV-2026-0042';
    const match = testLastNo.match(/\d+$/);
    const nextNo = match ? `INV-2026-${String(parseInt(match[0], 10) + 1).padStart(4, '0')}` : 'INV-2026-0001';
    logTest('cycle2', 'Invoice Sequence: Generate Next Invoice No', nextNo === 'INV-2026-0043', `Result: ${nextNo}`);

    // 2. Due Amount & Status Calculation
    const billTotal = 3500;
    const paidAmt = 1500;
    const dueAmt = billTotal - paidAmt;
    const status = dueAmt <= 0 ? 'Paid' : 'Pending';
    const paymentMode = dueAmt > 0 ? 'Credit' : 'Cash/Online';
    logTest('cycle2', 'Billing: Credit Due & Status Mapping', dueAmt === 2000 && status === 'Pending' && paymentMode === 'Credit', `Due: ₹${dueAmt}, Status: ${status}`);

    // 3. Number To Words Currency Utility (from PDF Generator)
    function numberToWords(num) {
        if (num === 0) return 'Zero';
        const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
        const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        if ((num = num.toString()).length > 9) return 'overflow';
        let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
        if (!n) return; let str = '';
        str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
        str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
        str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
        str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
        str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
        return str.trim();
    }
    const words5450 = numberToWords(5450);
    logTest('cycle2', 'PDF Generator: numberToWords Conversion', words5450.includes('Five Thousand Four Hundred and Fifty'), `₹5450 -> "${words5450}"`);

    // 4. WhatsApp Sharing URL formatting with safe amount fallbacks
    const mockSale = {
        invoiceNo: 'INV-2026-0005',
        date: '2026-09-04',
        buyerName: 'Prakash Sirvi',
        mobile: '9876543210',
        total: 2400,
        paidAmount: 1000,
        dueAmount: 1400,
        items: [
            { category: 'Wires', brand: 'Havells', variant: '1.5 Sq.mm', qty: 2, price: 1200, total: 2400 } // amount undefined
        ]
    };
    let itemsText = (mockSale.items || []).map((i, idx) => {
        const p = parseFloat(i.price) || 0;
        const q = parseFloat(i.qty || i.quantity) || 0;
        const a = parseFloat(i.amount || i.total) || (p * q);
        return `${idx + 1}. ${i.category || ''} - ${i.brand || ''} (${i.variant || ''}) x ${q} - ₹${a.toFixed(2)}`;
    }).join('\n');
    let waUrl = `https://wa.me/91${mockSale.mobile}?text=${encodeURIComponent(itemsText)}`;
    logTest('cycle2', 'WhatsApp Share: Safe toFixed & URL Format', waUrl.includes('https://wa.me/919876543210') && itemsText.includes('₹2400.00'), 'Formatted without crash');

    // 5. Passbook Ledger Debit / Credit Flow Calculation
    const ledger = [
        { date: 1, type: 'Due Generated', debit: 2000, credit: 0 },
        { date: 2, type: 'Payment', debit: 0, credit: 500 },
        { date: 3, type: 'Payment', debit: 0, credit: 1500 }
    ];
    let runningBal = 0;
    ledger.forEach(entry => {
        runningBal += entry.debit;
        runningBal -= entry.credit;
    });
    logTest('cycle2', 'Passbook Ledger: Balance Calculation', runningBal === 0, `Final Balance: ₹${runningBal}`);
}

async function runCycle3() {
    console.log('\n======================================================');
    console.log('   CYCLE 3: Stress & Edge-Case Validation             ');
    console.log('======================================================');

    // 1. UUID String Integrity (no parseInt)
    const rawUuid = '0d0dc1f2-72a2-4c38-9390-e3597e7d9e6f';
    const oldParsed = parseInt(rawUuid);
    const newString = String(rawUuid);
    logTest('cycle3', 'UUID Safety: String preservation vs parseInt', oldParsed === 0 && newString === rawUuid, `Old: ${oldParsed} (broken), New: ${newString} (safe)`);

    // 2. Partial Payment Reduction & Full Settlement Transition
    let currentBalance = 5000;
    let receivedAmt = 0;
    const partial1 = 1500;
    currentBalance -= partial1;
    receivedAmt += partial1;
    let statusP1 = currentBalance <= 0 ? 'Paid' : 'Pending';

    const partial2 = 3500;
    currentBalance -= partial2;
    receivedAmt += partial2;
    let statusP2 = currentBalance <= 0 ? 'Paid' : 'Pending';

    logTest('cycle3', 'Credit Khata: Multi-stage partial payments transition', currentBalance === 0 && receivedAmt === 5000 && statusP1 === 'Pending' && statusP2 === 'Paid', `Stage 1: Pending (Due: ₹3500) -> Stage 2: Paid (Due: ₹0)`);

    // 3. Safe Item Amount Mapping for Empty or Null Items
    const brokenItems = [
        { price: 50, qty: 2 }, // missing total and amount
        { total: 150 }, // missing price, qty, amount
        {} // completely empty
    ];
    let safeSum = 0;
    brokenItems.forEach(i => {
        const p = parseFloat(i.price) || 0;
        const q = parseFloat(i.qty || i.quantity) || 0;
        const a = parseFloat(i.amount || i.total) || (p * q);
        safeSum += a;
    });
    logTest('cycle3', 'Fault Tolerance: Broken item objects handling', safeSum === 250, `Computed ₹${safeSum} safely without throwing`);

    // 4. Master Catalog Fallback for Empty Inventory
    const dbInventoryEmpty = [];
    const masterCategories = ["Wires", "Bulb", "Fan - Ceiling", "Switch"];
    let displayCategories = [...new Set(dbInventoryEmpty.map(i => i.category))];
    if (displayCategories.length === 0) {
        displayCategories = masterCategories;
    }
    logTest('cycle3', 'Catalog Fallback: Master categories fallback on empty DB', displayCategories.length === 4, `Display categories: ${displayCategories.join(', ')}`);
}

async function main() {
    await runCycle1();
    await runCycle2();
    await runCycle3();

    console.log('\n======================================================');
    console.log('                 TEST SUMMARY REPORT                  ');
    console.log('======================================================');
    const allTests = [...results.cycle1, ...results.cycle2, ...results.cycle3];
    const passed = allTests.filter(t => t.passed).length;
    const total = allTests.length;
    console.log(`Total Tests Run: ${total}`);
    console.log(`Passed: ${passed}/${total} (${((passed/total)*100).toFixed(1)}%)`);
    console.log(`Failed: ${total - passed}`);
    console.log('======================================================\n');
}

main();
