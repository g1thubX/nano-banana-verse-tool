
const REPO_DAILY_URL = 'https://raw.githubusercontent.com/g1thubX/nano-banana-verse-tool/main/config/daily-add.json';
const REPO_PROMPTS_URL = 'https://raw.githubusercontent.com/g1thubX/nano-banana-verse-tool/refs/heads/main/config/prompts.json';

window.PromptManager = {
    async get() {
        let dailyPrompts = [];
        let corePrompts = [];

        try {
            // Parallel fetch with cache busting to ensure fresh data
            const [dailyRes, coreRes] = await Promise.all([
                fetch(`${REPO_DAILY_URL}?t=${Date.now()}`),
                fetch(`${REPO_PROMPTS_URL}?t=${Date.now()}`)
            ]);

            if (dailyRes.ok) {
                dailyPrompts = await dailyRes.json();
                console.log('[Banana] Fetched daily prompts:', dailyPrompts.length);
            } else {
                console.warn('[Banana] Failed to fetch daily prompts:', dailyRes.status);
            }

            if (coreRes.ok) {
                corePrompts = await coreRes.json();
                console.log('[Banana] Fetched core prompts:', corePrompts.length);
            } else {
                console.warn('[Banana] Failed to fetch core prompts:', coreRes.status);
            }

        } catch (error) {
            console.error('[Banana] Error fetching prompts:', error);
        }

        // Merge: Daily Prompts FIRST, then Core Prompts
        const merged = [...dailyPrompts, ...corePrompts];

        // Deduplicate based on Title + Author (or ID if available)
        const uniqueMap = new Map();
        const getKey = (p) => p.id || `${p.title}|${p.author}`;

        const result = [];
        for (const p of merged) {
            const key = getKey(p);
            if (!uniqueMap.has(key)) {
                uniqueMap.set(key, true);
                // Mark daily if needed for UI highlighting later, though not strictly requested now
                if (dailyPrompts.includes(p)) {
                     p.isDaily = true; 
                }
                result.push(p);
            }
        }

        console.log('[Banana] Total prompts after merge:', result.length);
        return result;
    }
};
