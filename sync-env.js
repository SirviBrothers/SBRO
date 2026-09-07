// sync-env.js - Syncs .env values to gitignored js/env-config.js for browser runtime
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const outputPath = path.join(__dirname, 'js', 'env-config.js');

function parseEnv(content) {
    const config = {};
    const lines = content.split(/\r?\n/);
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
            const key = trimmed.substring(0, eqIdx).trim();
            let value = trimmed.substring(eqIdx + 1).trim();
            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            config[key] = value;
        }
    }
    return config;
}

if (!fs.existsSync(envPath)) {
    console.warn('[sync-env] Warning: .env file not found at', envPath);
    process.exit(0);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const parsed = parseEnv(envContent);

const outputContent = `// Auto-generated configuration from .env
// DO NOT COMMIT THIS FILE TO VERSION CONTROL
window.__ENV__ = Object.assign(window.__ENV__ || {}, {
    SUPABASE_URL: ${JSON.stringify(parsed.SUPABASE_URL || '')},
    SUPABASE_ANON_KEY: ${JSON.stringify(parsed.SUPABASE_ANON_KEY || '')},
    APP_USERNAME: ${JSON.stringify(parsed.APP_USERNAME || 'SirviBrothers')},
    APP_PASSWORD: ${JSON.stringify(parsed.APP_PASSWORD || 'SB1234')}
});
`;

fs.writeFileSync(outputPath, outputContent, 'utf8');
console.log('[sync-env] Successfully generated js/env-config.js from .env');
