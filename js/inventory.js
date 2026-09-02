const INVENTORY = {
    "Wires": {
        "brands": ["GM Wires", "RR Kabel", "Havells", "Million Wires", "Servo Wires", "Ankit Wires"],
        "variants": ["0.75 Sq.mm", "1.0 Sq.mm", "1.5 Sq.mm", "2.5 Sq.mm", "4.0 Sq.mm"]
    },
    "Bulb": {
        "brands": ["GM Regular LED"],
        "variants": ["5W", "9W", "12W", "15W", "18W", "23W", "30W", "40W", "50W"]
    },
    "Emergency Bulb": {
        "brands": ["GM Emergency (Inverter)"],
        "variants": ["9W", "12W", "15W", "30W"]
    },
    "Tubelight": {
        "brands": ["GM"],
        "variants": ["20W", "36W", "50W", "Tricolor (3-in-1)"]
    },
    "Fan - Ceiling": {
        "brands": ["Bajaj", "Havells", "Havells (Reo)", "Crompton", "Orient", "GM", "Usha", "Reno", "Indo", "Blue"],
        "variants": ["1200 mm"]
    },
    "Fan - Wall": {
        "brands": ["Indo", "Fortuner", "Blue"],
        "variants": ["Standard"]
    },
    "Mixer": {
        "brands": ["Bajaj", "Cello", "Fortuner", "Blue", "Indo"],
        "variants": ["Standard"]
    },
    "Induction Cooktop": {
        "brands": ["Orient", "Cello", "Bajaj", "Blue"],
        "variants": ["Standard"]
    },
    "Geyser": {
        "brands": ["Havells", "Orient", "Indo"],
        "variants": ["Storage", "Instant (Canister)"]
    },
    "Iron": {
        "brands": ["Orient", "Bajaj", "Cello"],
        "variants": ["Standard"]
    },
    "Rechargeable Batteries": {
        "brands": ["Crompton", "Bajaj", "RR"],
        "variants": ["Standard"]
    },
    "MCBs": {
        "brands": ["V-Guard", "GM", "Vensor (Veto)"],
        "variants": ["16A", "20A", "32A", "40A"]
    },
    "Switch": {
        "brands": ["GM Cuba Series", "GM GX Range (White)", "GM GX Range (Graphite Magnesia)"],
        "variants": ["6A", "16A", "6A (Two-Way)", "16A (Two-Way)", "32A DP Switch"]
    },
    "Socket": {
        "brands": ["GM Cuba Series", "GM GX Range (White)", "GM GX Range (Graphite Magnesia)"],
        "variants": ["6A (5-Pin)", "16A", "16A (6-Pin)"]
    },
    "Bell": {
        "brands": ["GM Cuba Series", "GM GX Range (White)", "GM GX Range (Graphite Magnesia)"],
        "variants": ["1M", "2M"]
    },
    "Regulator - Fan": {
        "brands": ["GM Cuba Series", "GM GX Range (White)", "GM GX Range (Graphite Magnesia)"],
        "variants": ["1M", "2M"]
    },
    "Modular Plates": {
        "brands": ["GM Cuba Series", "GM GX Range (White)", "GM GX Range (Graphite Magnesia)"],
        "variants": ["2M", "3M", "4M", "6M", "8M (Horizontal)", "8M (Square)", "12M", "18M"]
    }
};

const CATEGORIES = Object.keys(INVENTORY);
