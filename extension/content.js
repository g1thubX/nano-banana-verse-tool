// 默认主题颜色配置
function getDefaultThemeColors(theme = 'light') {
    if (theme === 'dark') {
        return {
            background: '#141414',
            surface: '#1c1c1e',
            border: '#38383a',
            text: '#f5f5f7',
            textSecondary: '#98989d',
            primary: '#0a84ff',
            hover: '#2c2c2e',
            inputBg: '#1c1c1e',
            inputBorder: '#38383a',
            shadow: 'rgba(0,0,0,0.5)'
        }
    }

    return {
        background: '#ffffff',
        surface: '#f5f5f7',
        border: '#d2d2d7',
        text: '#1d1d1f',
        textSecondary: '#6e6e73',
        primary: '#007aff',
        hover: '#e8e8ed',
        inputBg: '#ffffff',
        inputBorder: '#d2d2d7',
        shadow: 'rgba(0,0,0,0.1)'
    }
}

// INLINED CONFIGURATION (Replaces config.json/config.js)
const PLATFORM_SELECTORS = {
    aistudio: {
        promptInput: "ms-prompt-input-wrapper textarea",
        insertButton: "ms-run-button button"
    },
    gemini: {
        promptInput: "div.ql-editor[contenteditable=\"true\"]",
        insertButton: "button.toolbox-drawer-item-deselect-button:has(img.img-icon)"
    }
};

// === 1. AI Studio Adapter (稳定版) ===
class AIStudioAdapter {
    constructor() {
        this.modal = null
        this._initializingButton = false
    }

    start() {
        this.waitForElements()
        this.startObserver()
        const handleNavigationChange = () => {
            setTimeout(() => {
                this.initButton()
            }, 1000)
        }
        window.addEventListener('popstate', handleNavigationChange)
        window.addEventListener('pushstate', handleNavigationChange)
        window.addEventListener('replacestate', handleNavigationChange)
    }

    async findPromptInput() {
        let el = document.querySelector('ms-prompt-input-wrapper textarea')
        if (el) return el
        // Fallback to hardcoded selector
        return document.querySelector(PLATFORM_SELECTORS.aistudio.promptInput)
    }

    async findClosestInsertButton() {
        let el = document.querySelector('ms-run-button button')
        if (el) return el
        // Fallback to hardcoded selector
        return document.querySelector(PLATFORM_SELECTORS.aistudio.insertButton)
    }

    getCurrentTheme() {
        return document.body.classList.contains('dark-theme') ? 'dark' : 'light'
    }

    getThemeColors() {
        return getDefaultThemeColors(this.getCurrentTheme())
    }

    createButton() {
        const wrapper = document.createElement('div')
        wrapper.className = 'button-wrapper'
        const btn = document.createElement('button')
        btn.id = 'banana-btn'
        btn.className = 'mat-mdc-tooltip-trigger ms-button-borderless ms-button-icon'
        const updateButtonTheme = () => {
            const colors = this.getThemeColors()
            btn.style.cssText = `width: 40px; height: 40px; border-radius: 50%; border: none; background: ${colors.hover}; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 18px; margin-right: 8px; transition: background-color 0.2s;`
        }
        updateButtonTheme()
        btn.title = 'Banana verse'
        btn.textContent = '🍌'
        btn.addEventListener('mouseenter', () => {
            const colors = this.getThemeColors()
            btn.style.background = colors.border
        })
        btn.addEventListener('mouseleave', () => {
            const colors = this.getThemeColors()
            btn.style.background = colors.hover
        })
        btn.addEventListener('click', () => {
            if (this.modal) this.modal.show()
        })
        wrapper.appendChild(btn)
        return wrapper
    }

    async initButton() {
        if (document.getElementById('banana-btn')) return true
        if (this._initializingButton) return false
        this._initializingButton = true
        try {
            const runButton = await this.findClosestInsertButton()
            if (!runButton) return false
            const bananaBtn = this.createButton()
            const buttonWrapper = runButton.parentElement
            try {
                buttonWrapper.parentElement.insertBefore(bananaBtn, buttonWrapper)
            } catch (error) {
                buttonWrapper.insertAdjacentElement('beforebegin', bananaBtn)
            }
            return true
        } finally {
            this._initializingButton = false
        }
    }

    async insertPrompt(promptText) {
        const textarea = await this.findPromptInput()
        if (textarea) {
            textarea.value = promptText
            textarea.dispatchEvent(new Event('input', { bubbles: true }))
            textarea.focus()
            const length = promptText.length
            textarea.setSelectionRange(length, length)
            if (this.modal) this.modal.hide()
        }
    }

    waitForElements() {
        const checkInterval = setInterval(async () => {
            const input = await this.findPromptInput()
            if (input) {
                const success = await this.initButton()
                if (success) clearInterval(checkInterval)
            }
        }, 1000)
    }

    startObserver() {
        const observer = new MutationObserver(() => {
            if (!document.getElementById('banana-btn')) this.initButton()
        })
        observer.observe(document.body, { childList: true, subtree: true })
    }
}

// === 2. Consumer Gemini Adapter (稳定版) ===
class GeminiAdapter {
    constructor() {
        this.modal = null
        this._initializingButton = false
    }

    start() {
        this.startObserver()
        const handleNavigationChange = () => {
            setTimeout(() => {
                this.initButton()
            }, 1000)
        }
        window.addEventListener('popstate', handleNavigationChange)
        window.addEventListener('pushstate', handleNavigationChange)
        window.addEventListener('replacestate', handleNavigationChange)
    }

    async findPromptInput() {
        let el = document.querySelector('div.ql-editor[contenteditable="true"]')
        if (el) return el
        return document.querySelector(PLATFORM_SELECTORS.gemini.promptInput)
    }

    async findClosestInsertButton() {
        let el = document.querySelector('button.toolbox-drawer-item-deselect-button:has(img.img-icon)')
        if (!el) el = document.querySelector('button.toolbox-drawer-item-deselect-button')
        if (el) return el
        return document.querySelector(PLATFORM_SELECTORS.gemini.insertButton)
    }

    getCurrentTheme() {
        return document.body.classList.contains('dark-theme') ||
            document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
    }

    getThemeColors() {
        return getDefaultThemeColors(this.getCurrentTheme())
    }

    createButton() {
        const isMobile = window.innerWidth <= 768
        const btn = document.createElement('button')
        btn.id = 'banana-btn'
        btn.className = 'mat-mdc-button mat-mdc-button-base mat-unthemed banana-gemini-btn'
        const updateButtonTheme = () => {
            const colors = this.getThemeColors()
            const mobile = window.innerWidth <= 768
            btn.style.cssText = `
                height: 40px;
                ${mobile ? 'width: 40px;' : ''}
                border-radius: ${mobile ? '50%' : '20px'};
                border: none;
                background: transparent;
                color: ${colors.text};
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                font-family: 'Google Sans', Roboto, Arial, sans-serif;
                margin-left: 4px;
                transition: background-color 0.2s;
                padding: ${mobile ? '0' : '0 16px'};
                gap: ${mobile ? '0' : '8px'};
            `
        }
        updateButtonTheme()
        btn.title = 'Banana verse'
        btn.innerHTML = isMobile ? '<span style="font-size: 18px;">🍌</span>' : '<span style="font-size: 16px;">🍌</span><span>verse</span>'
        btn.addEventListener('mouseenter', () => {
            const colors = this.getThemeColors()
            btn.style.background = colors.hover
        })
        btn.addEventListener('mouseleave', () => btn.style.background = 'transparent')
        btn.addEventListener('click', (e) => {
            e.preventDefault()
            e.stopPropagation()
            if (this.modal) this.modal.show()
        })
        return btn
    }

    async initButton() {
        if (document.getElementById('banana-btn')) return true
        if (this._initializingButton) return false
        this._initializingButton = true
        try {
            const imageBtn = await this.findClosestInsertButton()
            if (!imageBtn) return false
            const bananaBtn = this.createButton()
            try {
                imageBtn.insertAdjacentElement('afterend', bananaBtn)
            } catch (error) {
                return false
            }
            return true
        } finally {
            this._initializingButton = false
        }
    }

    async insertPrompt(promptText) {
        const textarea = await this.findPromptInput()
        if (textarea) {
            const lines = promptText.split('\n')
            const htmlContent = lines.map(line => `<p>${line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') || '<br>'}</p>`).join('')
            textarea.innerHTML = htmlContent
            textarea.dispatchEvent(new Event('input', { bubbles: true }))
            textarea.focus()
            try {
                const range = document.createRange()
                const sel = window.getSelection()
                range.selectNodeContents(textarea)
                range.collapse(false)
                sel.removeAllRanges()
                sel.addRange(range)
            } catch (e) {}
            if (this.modal) this.modal.hide()
        }
    }

    waitForElements() {}
    startObserver() {
        const observer = new MutationObserver(async () => {
            if (!document.getElementById('banana-btn')) await this.initButton()
        })
        observer.observe(document.body, { childList: true, subtree: true })
    }
}

// === 3. Business Gemini Adapter (Shadow DOM 增强版) ===
class BusinessGeminiAdapter {
    constructor() {
        this.modal = null
        console.log('[Banana Debug Business] Adapter initialized')
    }

    start() {
        this.initFloatingButton()
    }

    initFloatingButton() {
        if (document.getElementById('banana-business-fab')) return

        const btn = document.createElement('div')
        btn.id = 'banana-business-fab'
        btn.innerHTML = '🍌'
        btn.title = 'Banana verse'
        
        const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        const bg = isDark ? '#333' : '#fff'
        const border = isDark ? '#555' : '#e0e0e0'

        btn.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: ${bg};
            border: 1px solid ${border};
            box-shadow: 0 4px 15px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            cursor: pointer;
            z-index: 2147483647;
            user-select: none;
            transition: transform 0.2s, box-shadow 0.2s;
        `

        btn.onmouseenter = () => btn.style.transform = 'scale(1.1)'
        btn.onmouseleave = () => btn.style.transform = 'scale(1)'
        
        btn.addEventListener('click', (e) => {
            e.stopPropagation()
            e.preventDefault()
            if (this.modal) {
                this.modal.show()
            }
        })

        if (document.body) {
            document.body.appendChild(btn)
        } else {
            window.addEventListener('DOMContentLoaded', () => document.body.appendChild(btn))
        }
    }

    // 递归查找工具：穿透 Open Shadow DOM
    deepQuerySelector(selector, root = document) {
        // 1. Try finding in current root
        const el = root.querySelector(selector);
        if (el) return el;

        // 2. Iterate through all children that might be shadow hosts
        // Optimization: In Business Gemini, hosts are usually 'ucs-prosemirror-editor' or similar custom elements
        const hosts = root.querySelectorAll('*');
        for (const host of hosts) {
            if (host.shadowRoot) {
                const found = this.deepQuerySelector(selector, host.shadowRoot);
                if (found) return found;
            }
        }
        return null;
    }

    async findPromptInput() {
        console.log('[Banana Debug Business] Finding prompt input...');
        
        // 1. 尝试直接通过 Shadow Host 查找 (最常见情况)
        const editors = document.querySelectorAll('ucs-prosemirror-editor');
        if (editors.length > 0) {
            console.log(`[Banana Debug Business] Found ${editors.length} editor hosts.`);
            for (const host of editors) {
                if (host.shadowRoot) {
                    const input = host.shadowRoot.querySelector('.ProseMirror[contenteditable="true"]');
                    if (input) {
                        console.log('[Banana Debug Business] Found .ProseMirror inside shadow root.');
                        return input;
                    }
                }
            }
        }

        // 2. 全局递归深度查找 (兜底)
        console.log('[Banana Debug Business] Trying deep search...');
        const deepInput = this.deepQuerySelector('.ProseMirror[contenteditable="true"]');
        if (deepInput) {
            console.log('[Banana Debug Business] Found .ProseMirror via deep search.');
            return deepInput;
        }

        // 3. 查找普通输入框 (非 Shadow DOM)
        const fallback = document.querySelector('div[contenteditable="true"][role="textbox"]');
        if (fallback) {
            console.log('[Banana Debug Business] Found fallback textbox.');
            return fallback;
        }

        console.error('[Banana Debug Business] Input not found.');
        return null;
    }

    async insertPrompt(promptText) {
        const el = await this.findPromptInput()
        if (!el) {
            alert('🍌 Debug: 无法定位输入框。请确保页面加载完成。')
            return
        }

        console.log('[Banana Debug Business] Focusing element...');
        el.focus()
        
        // Strategy 1: execCommand (Standard for rich text editors)
        console.log('[Banana Debug Business] Trying execCommand insertText...');
        let success = false
        try {
            success = document.execCommand('insertText', false, promptText)
            console.log('[Banana Debug Business] execCommand result:', success);
        } catch(e) {
            console.error('[Banana Debug Business] execCommand error', e)
        }

        // Strategy 2: Direct DOM + Input Events (Fallback)
        if (!success) {
            console.log('[Banana Debug Business] execCommand failed, trying direct DOM manipulation...');
            
            // Clean up empty paragraphs often found in ProseMirror
            if (el.innerHTML === '<p><br></p>' || el.innerText.trim() === '') {
                el.innerHTML = ''; 
            }

            // Create a new paragraph for the prompt
            const p = document.createElement('p');
            p.textContent = promptText;
            el.appendChild(p);
            
            // Dispatch events to trigger framework updates (Angular/React/ProseMirror listeners)
            // composed: true is CRITICAL for events to bubble out of Shadow DOM
            const eventOptions = { bubbles: true, cancelable: true, composed: true };
            
            el.dispatchEvent(new InputEvent('beforeinput', { ...eventOptions, inputType: 'insertText', data: promptText }));
            el.dispatchEvent(new InputEvent('input', { ...eventOptions, inputType: 'insertText', data: promptText }));
            el.dispatchEvent(new Event('change', eventOptions));
            
            // Move cursor to end
            try {
                const range = document.createRange();
                const sel = window.getSelection();
                range.selectNodeContents(el);
                range.collapse(false);
                sel.removeAllRanges();
                sel.addRange(range);
            } catch(e) { /* ignore selection errors */ }
            
            console.log('[Banana Debug Business] DOM insertion complete.');
        }

        if (this.modal) {
            this.modal.hide()
        }
    }

    getCurrentTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }

    getThemeColors() {
        return getDefaultThemeColors(this.getCurrentTheme())
    }

    waitForElements() {}
    startObserver() {} 
    initButton() {} 
}

// === 4. Base Adapter (No Button) ===
class BaseAdapter {
    constructor() {
        this.modal = null
    }

    start() {
        // No-op: Base sites do not show a floating button by default.
        // They only respond to Context Menu triggers via the Modal.
    }

    isEditableElement(el) {
        if (!el) return false
        if (el.isContentEditable) return true
        if (el.tagName === 'TEXTAREA') return true
        if (el.tagName === 'INPUT') {
            const type = el.type ? el.type.toLowerCase() : 'text'
            return ['text', 'search', 'url', 'email', 'tel', 'password'].includes(type)
        }
        return false
    }

    async findPromptInput() {
        return document.activeElement
    }

    async insertPrompt(promptText) {
        const el = await this.findPromptInput()
        if (!el || !this.isEditableElement(el)) {
            alert('🍌 请先点击输入框，然后再选择 Banana verse')
            return
        }
        this.insertIntoElement(el, promptText)
    }

    insertIntoElement(el, promptText) {
        el.focus()
        const success = document.execCommand('insertText', false, promptText)
        if (!success) {
            if (el.isContentEditable) {
                const selection = window.getSelection()
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0)
                    range.deleteContents()
                    const textNode = document.createTextNode(promptText)
                    range.insertNode(textNode)
                    range.collapse(false)
                    selection.removeAllRanges()
                    selection.addRange(range)
                } else {
                    el.innerText += promptText
                }
            } else {
                const start = el.selectionStart || 0
                const end = el.selectionEnd || 0
                const val = el.value
                el.value = val.substring(0, start) + promptText + val.substring(end)
                el.selectionStart = el.selectionEnd = start + promptText.length
            }
            el.dispatchEvent(new Event('input', { bubbles: true }))
        }
        if (this.modal) this.modal.hide()
    }

    getCurrentTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }

    getThemeColors() {
        return getDefaultThemeColors(this.getCurrentTheme())
    }
}

// === MAIN INITIALIZATION ===
function init() {
    const hostname = window.location.hostname
    console.log('[Banana Debug] Loading Banana Verse on:', hostname)
    
    let adapter

    // 优先匹配 Business 版
    if (hostname.includes('business.gemini.google')) {
        console.log('[Banana Debug] Using BusinessGeminiAdapter')
        adapter = new BusinessGeminiAdapter()
    } else if (hostname.includes('aistudio.google.com')) {
        adapter = new AIStudioAdapter()
    } else if (hostname.includes('gemini.google.com')) {
        adapter = new GeminiAdapter()
    } else {
        // 其他所有网站使用 BaseAdapter (无浮窗按钮)
        adapter = new BaseAdapter()
    }

    const modal = new BananaModal(adapter)
    adapter.modal = modal

    // 启动适配器逻辑 (如注入按钮等)
    adapter.start()

    chrome.runtime.onMessage.addListener((message) => {
        console.log('[Banana Debug] Received message:', message)
        if (message.action === 'openModal') {
            if (modal) {
                modal.show()
            }
        }
    })
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init()
} else {
    window.addEventListener('load', init)
}