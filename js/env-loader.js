/**
 * env-loader.js
 * Universal Environment & Supabase Configuration Loader
 * 
 * Ensures Supabase client is always reliably initialized across:
 * - GitHub Pages (static hosting with fallback defaults)
 * - Local server (server.js with .env)
 * - VS Code Live Server
 * - Direct browser file inspection
 */

(function () {
    const DEFAULT_CONFIG = {
        SUPABASE_URL: "https://ztlrayekobgcllnxmqft.supabase.co",
        SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0bHJheWVrb2JnY2xsbnhtcWZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNzc4NTIsImV4cCI6MjEwMzk1Mzg1Mn0.SCv_r5KOQIN0RTvEEQrZLCOGaaneWsPlJuIMnyxYXkE",
        APP_USERNAME: "SirviBrothers",
        APP_PASSWORD: "SB1234"
    };

    window.__ENV__ = Object.assign({}, DEFAULT_CONFIG, window.__ENV__ || {});

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

    // Helper to create or get client
    function ensureClient() {
        if (window.supabaseClient) return window.supabaseClient;
        const url = window.__ENV__.SUPABASE_URL || DEFAULT_CONFIG.SUPABASE_URL;
        const key = window.__ENV__.SUPABASE_ANON_KEY || DEFAULT_CONFIG.SUPABASE_ANON_KEY;
        if (url && key && typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
            window.supabaseClient = window.supabase.createClient(url, key);
            return window.supabaseClient;
        }
        return null;
    }

    // Attempt immediate synchronous initialization
    ensureClient();

    window.getSupabaseConfig = async function () {
        // Check if server or .env has fresh overrides
        if (window.location && window.location.protocol.startsWith('http')) {
            try {
                const res = await fetch('/api/config');
                if (res.ok) {
                    const data = await res.json();
                    if (data.SUPABASE_URL && data.SUPABASE_ANON_KEY) {
                        window.__ENV__.SUPABASE_URL = data.SUPABASE_URL;
                        window.__ENV__.SUPABASE_ANON_KEY = data.SUPABASE_ANON_KEY;
                        if (data.APP_USERNAME) window.__ENV__.APP_USERNAME = data.APP_USERNAME;
                        if (data.APP_PASSWORD) window.__ENV__.APP_PASSWORD = data.APP_PASSWORD;
                        ensureClient();
                    }
                }
            } catch (e) {}

            try {
                const envRes = await fetch('/.env');
                if (envRes.ok) {
                    const text = await envRes.text();
                    const parsed = parseEnvText(text);
                    if (parsed.SUPABASE_URL && parsed.SUPABASE_ANON_KEY) {
                        window.__ENV__.SUPABASE_URL = parsed.SUPABASE_URL;
                        window.__ENV__.SUPABASE_ANON_KEY = parsed.SUPABASE_ANON_KEY;
                    }
                    if (parsed.APP_USERNAME) window.__ENV__.APP_USERNAME = parsed.APP_USERNAME;
                    if (parsed.APP_PASSWORD) window.__ENV__.APP_PASSWORD = parsed.APP_PASSWORD;
                    ensureClient();
                }
            } catch (e) {}
        }

        return {
            url: window.__ENV__.SUPABASE_URL || DEFAULT_CONFIG.SUPABASE_URL,
            anonKey: window.__ENV__.SUPABASE_ANON_KEY || DEFAULT_CONFIG.SUPABASE_ANON_KEY
        };
    };

    window.initSupabaseClient = async function () {
        ensureClient();
        if (window.supabaseClient) return window.supabaseClient;
        await window.getSupabaseConfig();
        return ensureClient();
    };
})();
