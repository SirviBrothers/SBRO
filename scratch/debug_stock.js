const { createClient } = require('@supabase/supabase-js');

const supabase = createClient('https://ztlrayekobgcllnxmqft.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0bHJheWVrb2JnY2xsbnhtcWZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNzc4NTIsImV4cCI6MjEwMzk1Mzg1Mn0.SCv_r5KOQIN0RTvEEQrZLCOGaaneWsPlJuIMnyxYXkE');

async function debugStock(category, brand, variant, qty) {
    console.log(`Checking stock for: [${category}] [${brand}] [${variant}] qty:${qty}`);
    
    const { data: inventory, error } = await supabase.from('inventory').select('*');
    if (error) {
        console.error("Fetch error:", error);
        return;
    }
    
    // Find matching items (maybe there are duplicates?)
    const matches = inventory.filter(i => i.category === category && i.brand === brand && i.variant === variant);
    console.log(`Found ${matches.length} matching items in database.`);
    
    if (matches.length > 0) {
        for (let i = 0; i < matches.length; i++) {
            const item = matches[i];
            console.log(`Match ${i+1}: ID=${item.id}, quantity=${item.quantity} (type: ${typeof item.quantity})`);
            console.log(`item.quantity >= qty is: ${item.quantity >= qty}`);
        }
    } else {
        console.log("No item found! Let's print all items with this brand just in case:");
        const brandMatches = inventory.filter(i => i.brand && i.brand.includes("GM Cuba"));
        console.log(brandMatches);
    }
}

// We don't know the exact category, but usually "Modular Plate" or "Switch"
debugStock("Modular Plate", "GM Cuba Series", "1M", 1);
debugStock("Switch", "GM Cuba Series", "1M", 1);
debugStock("Switch", "GM Cuba Series", "6A", 1);
