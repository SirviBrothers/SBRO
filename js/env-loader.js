/**
 * env-loader.js
 * Universal Environment & Supabase Configuration Loader
 * 
 * Sources configuration in order:
 * 1. window.__ENV__ (loaded from local gitignored js/env-config.js or injected by server)
 * 2. /api/config (if running via server.js or backend API)
 * 3. /.env runtime fetch (if running via static dev server like VS Code Live Server)
 */

(function () {
    window.__ENV__ = window.__ENV__ || {};

    function parseEnvText(text) {
        const result = {};
        const lines = text.split(/\r?\n/);
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const eqIdx = trimmed.indexOf('=');
            if (eqIdx !== -1) {
                const key = trimmed.substring(0, eqIdx).trim();
                let val = trimmed.substring(eqIdx + 1).trim();
                if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                    val = val.slice(1, -1);
                }
                result[key] = val;
            }
        }
        return result;
    }

    window.getSupabaseConfig = async function () {
        // 1. Already available synchronously in window.__ENV__
        if (window.__ENV__.SUPABASE_URL && window.__ENV__.SUPABASE_ANON_KEY) {
            return {
                url: window.__ENV__.SUPABASE_URL,
                anonKey: window.__ENV__.SUPABASE_ANON_KEY
            };
        }

        // 2. Try fetching from /api/config (supported when running server.js)
        if (window.location.protocol.startsWith('http')) {
            try {
                const res = await fetch('/api/config');
                if (res.ok) {
                    const data = await res.json();
                    if (data.SUPABASE_URL && data.SUPABASE_ANON_KEY) {
                        window.__ENV__.SUPABASE_URL = data.SUPABASE_URL;
                        window.__ENV__.SUPABASE_ANON_KEY = data.SUPABASE_ANON_KEY;
                        return { url: data.SUPABASE_URL, anonKey: data.SUPABASE_ANON_KEY };
                    }
                }
            } catch (e) {
                // Server endpoint not available, proceed to fallback
            }

            // 3. Try fetching /.env directly (works in VS Code Live Server)
            try {
                const envRes = await fetch('/.env');
                if (envRes.ok) {
                    const text = await envRes.text();
                    const parsed = parseEnvText(text);
                    if (parsed.SUPABASE_URL && parsed.SUPABASE_ANON_KEY) {
                        window.__ENV__.SUPABASE_URL = parsed.SUPABASE_URL;
                        window.__ENV__.SUPABASE_ANON_KEY = parsed.SUPABASE_ANON_KEY;
                        return { url: parsed.SUPABASE_URL, anonKey: parsed.SUPABASE_ANON_KEY };
                    }
                }
            } catch (e) {
                // Fallback failed
            }
        }

        // 4. Return whatever is present (or empty)
        return {
            url: window.__ENV__.SUPABASE_URL || '',
            anonKey: window.__ENV__.SUPABASE_ANON_KEY || ''
        };
    };

    // Helper to initialize or ensure window.supabaseClient is created
    window.initSupabaseClient = async function () {
        if (window.supabaseClient) return window.supabaseClient;
        const config = await window.getSupabaseConfig();
        if (config.url && config.url.startsWith('http') && config.anonKey && window.supabase) {
            window.supabaseClient = window.supabase.createClient(config.url, config.anonKey);
            return window.supabaseClient;
        }
        return null;
    };

    // Auto-attempt synchronous initialization if credentials already exist
    if (window.__ENV__.SUPABASE_URL && window.__ENV__.SUPABASE_ANON_KEY && window.supabase) {
        window.supabaseClient = window.supabase.createClient(window.__ENV__.SUPABASE_URL, window.__ENV__.SUPABASE_ANON_KEY);
    }
})();
