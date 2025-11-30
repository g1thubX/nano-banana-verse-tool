
const REPO_DAILY_URL = 'https://raw.githubusercontent.com/g1thubX/nano-banana-verse-tool/main/extension/daily-add.json';

window.PromptManager = {
    async get() {
        let allPrompts = [];

        // 1. Load Core Local Prompts
        try {
            const coreUrl = chrome.runtime.getURL('prompts.json');
            const coreRes = await fetch(coreUrl);
            if (coreRes.ok) {
                const coreData = await coreRes.json();
                allPrompts = allPrompts.concat(coreData);
            }
        } catch (error) {
            console.error('[Banana] Failed to load core prompts:', error);
        }

        // 2. Load Daily Prompts (Remote First, Fallback to Local)
        let dailyPrompts = [];
        try {
            // Add timestamp to bypass cache for daily updates
            const remoteRes = await fetch(`${REPO_DAILY_URL}?t=${Date.now()}`);
            if (remoteRes.ok) {
                dailyPrompts = await remoteRes.json();
                console.log('[Banana] Fetched daily prompts from remote:', dailyPrompts.length);
            } else {
                throw new Error('Remote fetch failed');
            }
        } catch (error) {
            console.warn('[Banana] Remote daily fetch failed, trying local fallback...', error);
            try {
                const localDailyUrl = chrome.runtime.getURL('daily-add.json');
                const localDailyRes = await fetch(localDailyUrl);
                if (localDailyRes.ok) {
                    dailyPrompts = await localDailyRes.json();
                    console.log('[Banana] Loaded daily prompts from local:', dailyPrompts.length);
                }
            } catch (localErr) {
                console.error('[Banana] Failed to load local daily fallback:', localErr);
            }
        }

        // 3. Merge and Deduplicate
        if (dailyPrompts.length > 0) {
            // Mark daily prompts internally if we want to highlight them later
            const taggedDaily = dailyPrompts.map(p => ({ ...p, isDaily: true }));
            
            // Deduplicate based on Title + Author (or ID if available) to prevent duplicates between core and daily
            const uniqueMap = new Map();
            
            // Helper to generate key
            const getKey = (p) => p.id || `${p.title}|${p.author}`;

            // Add core prompts first
            allPrompts.forEach(p => uniqueMap.set(getKey(p), p));

            // Add/Overwrite with daily prompts (Daily updates might fix typos in core)
            taggedDaily.forEach(p => uniqueMap.set(getKey(p), p));

            allPrompts = Array.from(uniqueMap.values());
        }

        return allPrompts;
    }
};