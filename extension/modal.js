

class BananaModal {
    constructor(adapter) {
        this.adapter = adapter;
        this.modal = null;
        this.activeFilters = new Set();
        this.prompts = [];
        this.customPrompts = [];
        this.categories = new Set(['全部']);
        this.selectedCategory = 'all';
        this.sortMode = 'recommend'; // 'recommend' | 'random'
        this.currentPage = 1;
        this.pageSize = this.isMobile() ? 10 : 32;
        this.filteredPrompts = [];
        this.favorites = [];
        this.hiddenPromptIds = []; 
        this.keyboardHandler = this.handleKeyboard.bind(this);
        this._isInitialized = false;
        this.randomMap = new Map();
        
        // Sub-modules
        this.gallery = new BananaGallery();
        this.editor = new BananaEditor(adapter);
    }

    // --- IDs & Logic ---

    generatePromptId(prompt) {
        return BananaUtils.generatePromptId(prompt);
    }

    // --- Data Loading ---

    async loadPrompts() {
        this.hiddenPromptIds = await this.getHiddenIds();

        let staticPrompts = [];
        if (window.PromptManager) {
            const rawStatic = await window.PromptManager.get();
            staticPrompts = rawStatic.map(p => ({
                ...p,
                id: this.generatePromptId(p),
                isCustom: false 
            })).filter(p => !this.hiddenPromptIds.includes(p.id));
        }

        this.customPrompts = await this.getCustomPrompts();
        this.prompts = [...this.customPrompts, ...staticPrompts];

        this.categories = new Set(['全部']);
        this.prompts.forEach(p => {
            if (p.category) {
                this.categories.add(p.category);
            }
        });

        this.ensureRandomValues();
        this.updateCategoryDropdown();
        this.applyFilters(!this._isInitialized);
    }

    ensureRandomValues() {
        this.prompts.forEach(p => {
            const key = p.id;
            if (!this.randomMap.has(key)) {
                this.randomMap.set(key, Math.random());
            }
            p._randomVal = this.randomMap.get(key);
        });
    }

    // --- UI / DOM Building ---

    updateCategoryDropdown() {
        const optionsContainer = document.getElementById('category-options-container');
        const triggerText = document.getElementById('category-trigger-text');
        if (!optionsContainer || !triggerText) return;
        this.populateCategoryDropdown(optionsContainer, triggerText);
    }

    populateCategoryDropdown(optionsContainer, triggerText) {
        optionsContainer.innerHTML = '';
        const sortedCategories = Array.from(this.categories).sort((a, b) => {
            if (a === '全部') return -1;
            if (b === '全部') return 1;
            return a.localeCompare(b);
        });

        if (sortedCategories.length === 0) {
            const empty = document.createElement('div');
            empty.textContent = '无分类';
            empty.style.cssText = `padding: 10px 16px; font-size: 14px; color: ${this.adapter.getThemeColors().textSecondary};`;
            optionsContainer.appendChild(empty);
        }

        sortedCategories.forEach(cat => {
            const option = document.createElement('div');
            option.textContent = cat;
            const currentLabel = this.selectedCategory === 'all' ? '全部' : this.selectedCategory;
            const isSelected = cat === currentLabel;
            const colors = this.adapter.getThemeColors();

            const baseStyle = `padding: 10px 16px; cursor: pointer; transition: all 0.2s; font-size: 14px; color: ${colors.text};`;
            const selectedStyle = isSelected
                ? `background: ${colors.primary}15; color: ${colors.primary}; font-weight: 600;`
                : `background: transparent;`;
            option.style.cssText = baseStyle + selectedStyle;

            option.onmouseenter = () => {
                if (!isSelected) {
                    option.style.background = colors.surfaceHover || '#f5f5f5';
                }
            };
            option.onmouseleave = () => {
                if (!isSelected) {
                    option.style.background = 'transparent';
                } else {
                    option.style.background = `${colors.primary}15`;
                }
            };

            option.onclick = (e) => {
                e.stopPropagation();
                this.selectedCategory = cat === '全部' ? 'all' : cat;
                triggerText.textContent = cat;
                optionsContainer.style.display = 'none';
                optionsContainer.setAttribute('data-visible', 'false');
                this.populateCategoryDropdown(optionsContainer, triggerText);
                this.applyFilters(true);
            };

            optionsContainer.appendChild(option);
        });
        const currentLabel = this.selectedCategory === 'all' ? '全部' : this.selectedCategory;
        triggerText.textContent = currentLabel;
    }

    async loadSortMode() {
        try {
            if (!chrome.runtime?.id) return; // Check if context is valid
            const result = await chrome.storage.local.get(['banana-sort-mode']);
            this.sortMode = result['banana-sort-mode'] || 'recommend';
        } catch (e) {
            console.warn('[Banana] Context invalidated during loadSortMode, using default.', e);
        }
    }

    async setSortMode(mode) {
        try {
            this.sortMode = mode;
            await chrome.storage.local.set({ 'banana-sort-mode': mode });
        } catch (e) {
             console.error('[Banana] Storage set failed:', e);
        }
    }

    async getCustomPrompts() {
        try {
            // Check for extension context validity
            if (!chrome.runtime?.id) {
                console.warn('[Banana] Extension context invalidated. Please refresh the page.');
                return [];
            }
            const result = await chrome.storage.local.get(['banana-custom-prompts']);
            return result['banana-custom-prompts'] || [];
        } catch (error) {
            console.error('[Banana] Failed to get custom prompts:', error);
            // Return empty array to prevent UI crash
            return [];
        }
    }

    async getHiddenIds() {
        try {
            if (!chrome.runtime?.id) {
                return [];
            }
            const result = await chrome.storage.local.get(['banana-hidden-ids']);
            return result['banana-hidden-ids'] || [];
        } catch (error) {
            console.error('[Banana] Failed to get hidden IDs:', error);
            return [];
        }
    }

    async addToHiddenIds(id) {
        try {
            const hidden = await this.getHiddenIds();
            if (!hidden.includes(id)) {
                hidden.push(id);
                await chrome.storage.local.set({ 'banana-hidden-ids': hidden });
            }
        } catch (error) {
            console.error('[Banana] Failed to save hidden ID:', error);
            alert('插件连接已断开，请刷新页面重试。');
        }
    }

    show() {
        if (!this.modal) {
            this.modal = this.createModal();
            document.body.appendChild(this.modal);
        }
        
        this.modal.style.display = 'flex';
        this.modal.style.opacity = '0';
        requestAnimationFrame(() => {
            this.modal.style.transition = 'opacity 0.3s ease';
            this.modal.style.opacity = '1';
            const container = this.modal.querySelector('.modal-container');
            if (container) {
                container.style.transform = 'scale(0.95) translateY(10px)';
                container.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
                requestAnimationFrame(() => {
                    container.style.transform = 'scale(1) translateY(0)';
                });
            }
        });

        if (!this._isInitialized) {
            this.loadPrompts();
            this.loadAnnouncements();
            this.loadSortMode();
            this.updateCategoryDropdown();
            this.applyFilters(true);
            this._isInitialized = true;
        } else {
            this.loadPrompts().then(() => {
                this.renderCurrentPage();
            });
        }
        document.addEventListener('keydown', this.keyboardHandler);
    }

    hide() {
        if (this.modal) {
            this.modal.style.opacity = '0';
            const container = this.modal.querySelector('.modal-container');
            if (container) {
                container.style.transform = 'scale(0.95) translateY(10px)';
            }
            setTimeout(() => {
                this.modal.style.display = 'none';
            }, 300);
        }
        // Close nested popups
        if (this.gallery) {
            // The gallery manages its own DOM
        }
        document.removeEventListener('keydown', this.keyboardHandler);
    }

    isMobile() {
        return window.innerWidth <= 768;
    }

    createModal() {
        const colors = this.adapter.getThemeColors();
        const mobile = this.isMobile();

        const modalElement = document.createElement('div');
        modalElement.id = 'prompts-modal';
        modalElement.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 2147483640; transition: opacity 0.3s ease;';

        const container = document.createElement('div');
        container.className = 'modal-container';
        const bg = this.adapter.getCurrentTheme() === 'dark' ? 'rgba(28, 28, 30, 0.85)' : 'rgba(255, 255, 255, 0.92)';
        const border = this.adapter.getCurrentTheme() === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.6)';
        
        container.style.cssText = `
            background: ${bg}; 
            border-radius: ${mobile ? '24px 24px 0 0' : '24px'}; 
            box-shadow: 0 20px 60px rgba(0,0,0,0.2), 0 0 0 1px ${border} inset; 
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            max-width: ${mobile ? '100%' : '1080px'}; 
            width: ${mobile ? '100%' : '90%'}; 
            max-height: ${mobile ? '92vh' : '85vh'}; 
            display: flex; 
            flex-direction: column; 
            ${mobile ? 'margin-top: auto;' : ''}; 
            overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        `;

        const searchSection = this.createSearchSection(colors, mobile);
        const content = this.createContent(colors, mobile);

        container.appendChild(searchSection);
        container.appendChild(content);
        modalElement.appendChild(container);

        modalElement.addEventListener('click', (e) => {
            if (e.target === modalElement) {
                this.hide();
            }
        });

        if (mobile) {
            modalElement.addEventListener('touchstart', (e) => {
                if (e.target === modalElement) {
                    this.hide();
                }
            });
        }

        return modalElement;
    }

    createSearchSection(colors, mobile) {
        const searchSection = document.createElement('div');
        const borderColor = this.adapter.getCurrentTheme() === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)';
        searchSection.style.cssText = `padding: ${mobile ? '20px' : '24px 32px'}; border-bottom: 1px solid ${borderColor}; display: flex; ${mobile ? 'flex-direction: column; gap: 16px;' : 'align-items: center; gap: 20px;'}; overflow: visible; z-index: 100; position: relative; flex-shrink: 0;`;

        const searchContainer = document.createElement('div');
        searchContainer.style.cssText = `${mobile ? 'width: 100%;' : 'flex: 1;'} display: flex; align-items: center; gap: 12px; position: relative;`;

        const inputWrapper = document.createElement('div');
        inputWrapper.style.cssText = `flex: 1; position: relative; display: flex; align-items: center;`;
        
        const searchIcon = document.createElement('span');
        searchIcon.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.5;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;
        searchIcon.style.cssText = `position: absolute; left: 14px; color: ${colors.text}; pointer-events: none;`;

        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.id = 'prompt-search';
        searchInput.placeholder = 'Search prompts...';
        const inputBg = this.adapter.getCurrentTheme() === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.04)';
        searchInput.style.cssText = `width: 100%; padding: ${mobile ? '12px 16px 12px 42px' : '12px 16px 12px 42px'}; border: 1px solid transparent; border-radius: 14px; outline: none; font-size: 15px; background: ${inputBg}; color: ${colors.text}; box-sizing: border-box; transition: all 0.2s; font-weight: 500;`;
        searchInput.addEventListener('input', () => this.applyFilters(true));

        searchInput.addEventListener('focus', () => {
            searchInput.style.background = this.adapter.getCurrentTheme() === 'dark' ? 'rgba(0,0,0,0.4)' : '#fff';
            searchInput.style.borderColor = colors.primary;
            searchInput.style.boxShadow = `0 0 0 4px ${colors.primary}15`;
        });
        searchInput.addEventListener('blur', () => {
            searchInput.style.background = inputBg;
            searchInput.style.borderColor = 'transparent';
            searchInput.style.boxShadow = 'none';
        });

        inputWrapper.appendChild(searchIcon);
        inputWrapper.appendChild(searchInput);

        const sortBtn = document.createElement('button');
        sortBtn.id = 'sort-mode-btn';
        sortBtn.title = 'Switch Sort Order';
        sortBtn.innerHTML = this.sortMode === 'recommend'
            ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>'
            : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>';
        
        sortBtn.style.cssText = `
            width: 44px; height: 44px; flex-shrink: 0; border: none; background: transparent; color: ${colors.textSecondary}; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; border-radius: 12px;
        `;
        sortBtn.onclick = () => this.toggleSortMode();
        sortBtn.onmouseenter = () => {
            sortBtn.style.background = inputBg;
            sortBtn.style.color = colors.primary;
        };
        sortBtn.onmouseleave = () => {
            sortBtn.style.background = 'transparent';
            sortBtn.style.color = colors.textSecondary;
        };

        searchContainer.appendChild(inputWrapper);
        searchContainer.appendChild(sortBtn);

        const filterContainer = document.createElement('div');
        filterContainer.style.cssText = `display: flex; gap: 10px; align-items: center; ${mobile ? 'justify-content: space-between; overflow-x: auto; padding-bottom: 4px;' : ''}; position: relative; z-index: 101;`;

        const dropdownContainer = document.createElement('div');
        dropdownContainer.style.cssText = `position: relative; z-index: 1000; flex-shrink: 0;`;

        const dropdownTrigger = document.createElement('div');
        dropdownTrigger.id = 'category-dropdown-trigger';
        dropdownTrigger.style.cssText = `
            padding: 0 16px; height: 40px; 
            border: 1px solid ${borderColor}; 
            border-radius: 12px; 
            background: transparent; 
            color: ${colors.text}; 
            font-size: 14px; 
            font-weight: 500;
            cursor: pointer; 
            display: flex; 
            align-items: center; 
            gap: 8px; 
            transition: all 0.2s; 
            min-width: 100px; 
            justify-content: space-between; 
            user-select: none;
        `;

        const triggerText = document.createElement('span');
        triggerText.id = 'category-trigger-text';
        triggerText.textContent = this.selectedCategory === 'all' ? '全部' : this.selectedCategory;
        triggerText.style.cssText = 'overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;';

        const arrowIcon = document.createElement('span');
        arrowIcon.innerHTML = `<svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 1L5 5L9 1"/></svg>`;
        arrowIcon.style.cssText = `display: flex; align-items: center; transition: transform 0.2s; opacity: 0.5;`;

        dropdownTrigger.appendChild(triggerText);
        dropdownTrigger.appendChild(arrowIcon);

        const optionsContainer = document.createElement('div');
        optionsContainer.id = 'category-options-container';
        const dropdownBg = this.adapter.getCurrentTheme() === 'dark' ? '#2c2c2e' : '#ffffff';
        optionsContainer.style.cssText = `
            position: absolute; top: calc(100% + 6px); left: 0; width: 140px; 
            background: ${dropdownBg}; 
            border: 1px solid ${borderColor}; 
            border-radius: 14px; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.15); 
            display: none; 
            flex-direction: column; 
            overflow: hidden; 
            padding: 4px;
            max-height: 300px; 
            overflow-y: auto; 
            z-index: 9999;
        `;
        optionsContainer.setAttribute('data-visible', 'false');

        dropdownTrigger.onclick = (e) => {
            e.stopPropagation();
            const isVisible = optionsContainer.getAttribute('data-visible') === 'true';
            if (isVisible) {
                optionsContainer.style.display = 'none';
                optionsContainer.setAttribute('data-visible', 'false');
                dropdownTrigger.style.background = 'transparent';
                arrowIcon.style.transform = 'rotate(0deg)';
            } else {
                optionsContainer.style.display = 'flex';
                optionsContainer.setAttribute('data-visible', 'true');
                dropdownTrigger.style.background = inputBg;
                arrowIcon.style.transform = 'rotate(180deg)';
            }
        };

        dropdownTrigger.onmouseenter = () => { dropdownTrigger.style.borderColor = colors.textSecondary; };
        dropdownTrigger.onmouseleave = () => { 
            if(optionsContainer.getAttribute('data-visible') !== 'true') 
                dropdownTrigger.style.borderColor = borderColor; 
        };

        document.addEventListener('click', (e) => {
            if (optionsContainer.getAttribute('data-visible') === 'true' && !dropdownContainer.contains(e.target)) {
                optionsContainer.style.display = 'none';
                optionsContainer.setAttribute('data-visible', 'false');
                arrowIcon.style.transform = 'rotate(0deg)';
                dropdownTrigger.style.background = 'transparent';
            }
        });

        dropdownContainer.appendChild(dropdownTrigger);
        dropdownContainer.appendChild(optionsContainer);
        this.populateCategoryDropdown(optionsContainer, triggerText);

        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.cssText = `display: flex; gap: 8px; flex-wrap: nowrap;`;

        const filters = [
            { key: 'favorite', label: '收藏' },
            { key: 'custom', label: '自定义' },
            { key: 'generate', label: '文生图' },
            { key: 'edit', label: '编辑' }
        ];

        filters.forEach(filter => {
            const btn = document.createElement('button');
            btn.id = `filter-${filter.key}`;
            btn.textContent = filter.label;
            btn.style.cssText = `
                padding: 0 16px; height: 32px; 
                border: 1px solid ${borderColor}; 
                border-radius: 100px; 
                background: transparent; 
                color: ${colors.textSecondary}; 
                font-size: 13px; 
                font-weight: 500;
                cursor: pointer; 
                transition: all 0.2s ease; 
                white-space: nowrap;
            `;
            btn.onclick = () => this.toggleFilter(filter.key);
            
            btn.onmouseenter = () => {
                if(!btn.classList.contains('active')) {
                    btn.style.background = inputBg;
                    btn.style.color = colors.text;
                }
            };
            btn.onmouseleave = () => {
                if(!btn.classList.contains('active')) {
                    btn.style.background = 'transparent';
                    btn.style.color = colors.textSecondary;
                }
            };

            buttonsContainer.appendChild(btn);
        });

        const addBtn = document.createElement('button');
        addBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> <span>Create</span>`;
        addBtn.title = 'Add Custom Prompt';
        addBtn.style.cssText = `
            padding: 0 20px; height: 40px; 
            border: none; 
            border-radius: 12px; 
            background: ${colors.primary}; 
            color: #000; 
            font-size: 14px; 
            font-weight: 600; 
            cursor: pointer; 
            transition: all 0.2s ease; 
            display: flex; align-items: center; justify-content: center; gap: 6px;
            box-shadow: 0 4px 12px ${colors.primary}40;
            margin-left: 8px;
        `;
        addBtn.onmouseenter = () => {
            addBtn.style.transform = 'translateY(-1px)';
            addBtn.style.boxShadow = `0 6px 16px ${colors.primary}60`;
        };
        addBtn.onmouseleave = () => {
            addBtn.style.transform = 'translateY(0)';
            addBtn.style.boxShadow = `0 4px 12px ${colors.primary}40`;
        };
        addBtn.onclick = () => this.showAddPromptModal();

        filterContainer.appendChild(dropdownContainer);
        filterContainer.appendChild(buttonsContainer);
        
        if (!mobile) {
            filterContainer.appendChild(addBtn);
        }

        searchSection.appendChild(searchContainer);
        searchSection.appendChild(filterContainer);

        return searchSection;
    }

    createContent(colors, mobile) {
        const container = document.createElement('div');
        container.style.cssText = 'flex: 1; display: flex; flex-direction: column; overflow: hidden; position: relative;';

        const scrollArea = document.createElement('div');
        scrollArea.id = 'prompts-scroll-area';
        scrollArea.style.cssText = `flex: 1; overflow-y: auto; padding: ${mobile ? '16px' : '24px 32px'}; -webkit-overflow-scrolling: touch;`;

        const grid = document.createElement('div');
        grid.id = 'prompts-grid';
        grid.style.cssText = `display: grid; grid-template-columns: ${mobile ? 'repeat(auto-fill, minmax(160px, 1fr))' : 'repeat(auto-fill, minmax(200px, 1fr))'}; gap: ${mobile ? '12px' : '20px'}; padding-bottom: 40px;`;

        scrollArea.appendChild(grid);

        const pagination = document.createElement('div');
        pagination.id = 'prompts-pagination';
        const borderColor = this.adapter.getCurrentTheme() === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)';
        pagination.style.cssText = `padding: ${mobile ? '12px' : '16px 32px'}; border-top: 1px solid ${borderColor}; display: flex; justify-content: center; align-items: center; gap: 16px; background: transparent;`;

        container.appendChild(scrollArea);
        container.appendChild(pagination);

        return container;
    }

    toggleFilter(filterKey) {
        const btn = document.getElementById(`filter-${filterKey}`);
        if (!btn) return;

        const colors = this.adapter.getThemeColors();
        
        const setInactiveStyle = (targetBtn) => {
            targetBtn.classList.remove('active');
            targetBtn.style.background = 'transparent';
            targetBtn.style.color = colors.textSecondary;
            targetBtn.style.borderColor = this.adapter.getCurrentTheme() === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)';
        };

        if (this.activeFilters.has(filterKey)) {
            this.activeFilters.delete(filterKey);
            setInactiveStyle(btn);
        } else {
            if (filterKey === 'generate' && this.activeFilters.has('edit')) {
                this.activeFilters.delete('edit');
                setInactiveStyle(document.getElementById('filter-edit'));
            }
            if (filterKey === 'edit' && this.activeFilters.has('generate')) {
                this.activeFilters.delete('generate');
                setInactiveStyle(document.getElementById('filter-generate'));
            }

            this.activeFilters.add(filterKey);
            btn.classList.add('active');
            btn.style.background = colors.text;
            btn.style.color = colors.background;
            btn.style.borderColor = colors.text;
        }

        this.applyFilters(true);
    }

    async toggleSortMode() {
        const newMode = this.sortMode === 'recommend' ? 'random' : 'recommend';
        await this.setSortMode(newMode);
        if (newMode === 'random') {
            this.randomMap.clear();
            this.ensureRandomValues();
        }

        const sortBtn = document.getElementById('sort-mode-btn');
        if (sortBtn) {
            sortBtn.innerHTML = newMode === 'recommend'
                ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>'
                : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>';
        }
        this.applyFilters(true);
    }

    async applyFilters(resetPage = true) {
        const searchInput = document.getElementById('prompt-search');
        const keyword = searchInput ? searchInput.value.toLowerCase() : '';

        this.favorites = await this.getFavorites();

        let filtered = this.prompts.filter(prompt => {
            const matchesSearch = !keyword ||
                prompt.title.toLowerCase().includes(keyword) ||
                prompt.prompt.toLowerCase().includes(keyword) ||
                prompt.author.toLowerCase().includes(keyword) ||
                (prompt.sub_category && prompt.sub_category.toLowerCase().includes(keyword));

            if (!matchesSearch) return false;

            if (this.selectedCategory !== 'all' && prompt.category !== this.selectedCategory) {
                return false;
            }

            if (this.activeFilters.size === 0) return true;

            const promptId = prompt.id || `${prompt.title}-${prompt.author}`;
            const isFavorite = this.favorites.includes(promptId);

            return Array.from(this.activeFilters).every(filter => {
                if (filter === 'favorite') return isFavorite;
                if (filter === 'custom') return prompt.isCustom;
                if (filter === 'generate') return prompt.mode === 'generate';
                if (filter === 'edit') return prompt.mode === 'edit';
                return false;
            });
        });

        const favoriteItems = [];
        const customItems = [];
        const normalItems = [];

        filtered.forEach(item => {
            const itemId = item.id || `${item.title}-${item.author}`;
            const isFavorite = this.favorites.includes(itemId);

            if (isFavorite) {
                favoriteItems.push(item);
            } else if (item.isCustom) {
                customItems.push(item);
            } else {
                normalItems.push(item);
            }
        });

        if (this.sortMode === 'random') {
            normalItems.sort((a, b) => a._randomVal - b._randomVal);
        }

        filtered = [...favoriteItems, ...customItems, ...normalItems];
        filtered.unshift(FLASH_MODE_PROMPT);

        this.filteredPrompts = filtered;

        if (resetPage) {
            this.currentPage = 1;
        } else {
            const totalPages = Math.ceil(this.filteredPrompts.length / this.pageSize);
            if (this.currentPage > totalPages && totalPages > 0) {
                this.currentPage = totalPages;
            }
        }

        this.renderCurrentPage();
    }

    renderCurrentPage() {
        const grid = document.getElementById('prompts-grid');
        if (!grid) return;

        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        const pageItems = this.filteredPrompts.slice(start, end);

        grid.innerHTML = '';

        if (pageItems.length === 0) {
            const placeholder = document.createElement('div');
            const colors = this.adapter.getThemeColors();
            placeholder.style.cssText = `
                grid-column: 1 / -1;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 300px;
                color: ${colors.textSecondary};
                font-size: 16px;
                opacity: 0.6;
            `;
            placeholder.innerHTML = `<div style="font-size: 40px; margin-bottom: 16px;">🍌</div> No prompts found`;
            grid.appendChild(placeholder);
        } else {
            pageItems.forEach((prompt, index) => {
                const card = this.createPromptCard(prompt, this.favorites);
                card.style.opacity = '0';
                card.style.transform = 'translateY(10px)';
                grid.appendChild(card);
                
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        card.style.transition = 'all 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)';
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    }, index * 30);
                });
            });
        }

        const scrollArea = document.getElementById('prompts-scroll-area');
        if (scrollArea) scrollArea.scrollTop = 0;

        this.renderPagination();
    }

    renderPagination() {
        const pagination = document.getElementById('prompts-pagination');
        if (!pagination) return;

        const totalPages = Math.ceil(this.filteredPrompts.length / this.pageSize);
        const colors = this.adapter.getThemeColors();
        const mobile = this.isMobile();

        pagination.innerHTML = '';

        if (totalPages <= 1) {
            pagination.style.display = 'none';
            return;
        }
        pagination.style.display = 'flex';

        const createBtn = (text, disabled, onClick, isActive = false) => {
            const btn = document.createElement('button');
            btn.innerHTML = text;
            btn.disabled = disabled;
            const isDark = this.adapter.getCurrentTheme() === 'dark';
            
            // Styles for active vs normal pages vs nav buttons
            let btnBg, btnColor, btnBorder;
            
            if (isActive) {
                btnBg = colors.primary;
                btnColor = '#000'; // Active text usually black on primary
                btnBorder = 'none';
            } else {
                btnBg = isDark ? 'rgba(255,255,255,0.05)' : '#f4f4f5';
                btnColor = disabled ? colors.textSecondary : colors.text;
                btnBorder = '1px solid transparent';
            }

            btn.style.cssText = `
                min-width: 36px; height: 36px; padding: 0 10px;
                border: ${btnBorder}; 
                border-radius: 8px; 
                background: ${disabled ? 'transparent' : btnBg}; 
                color: ${btnColor}; 
                cursor: ${disabled ? 'not-allowed' : 'pointer'}; 
                font-size: 14px; 
                transition: all 0.2s ease; 
                opacity: ${disabled ? 0.3 : 1}; 
                font-weight: ${isActive ? '700' : '500'};
                display: flex; align-items: center; justify-content: center;
            `;

            if (!disabled && !isActive) {
                btn.onclick = onClick;
                btn.onmouseenter = () => btn.style.background = isDark ? 'rgba(255,255,255,0.15)' : '#e4e4e7';
                btn.onmouseleave = () => btn.style.background = btnBg;
            }
            return btn;
        };

        const controlsWrapper = document.createElement('div');
        controlsWrapper.style.cssText = 'display: flex; align-items: center; gap: 6px;';

        // Previous Button
        controlsWrapper.appendChild(createBtn(
            `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>`, 
            this.currentPage === 1, 
            () => this.changePage(-1)
        ));

        // Page Numbers Logic (1 ... 4 5 6 ... 10)
        const generatePageNumbers = () => {
            const pages = [];
            const maxVisible = 5; // Number of page buttons to show
            
            if (totalPages <= maxVisible) {
                for (let i = 1; i <= totalPages; i++) pages.push(i);
            } else {
                // Always show first
                pages.push(1);
                
                // Logic for middle pages
                let start = Math.max(2, this.currentPage - 1);
                let end = Math.min(totalPages - 1, this.currentPage + 1);
                
                // Adjust if at the start or end
                if (this.currentPage <= 3) {
                    end = Math.min(totalPages - 1, 4);
                }
                if (this.currentPage >= totalPages - 2) {
                    start = Math.max(2, totalPages - 3);
                }

                if (start > 2) {
                    pages.push('...');
                }
                
                for (let i = start; i <= end; i++) {
                    pages.push(i);
                }
                
                if (end < totalPages - 1) {
                    pages.push('...');
                }
                
                // Always show last
                pages.push(totalPages);
            }
            return pages;
        };

        const pageNumbers = generatePageNumbers();
        
        pageNumbers.forEach(p => {
            if (p === '...') {
                const dots = document.createElement('span');
                dots.textContent = '...';
                dots.style.cssText = `color: ${colors.textSecondary}; padding: 0 4px;`;
                controlsWrapper.appendChild(dots);
            } else {
                controlsWrapper.appendChild(createBtn(
                    p.toString(), 
                    false, 
                    () => this.setPage(p),
                    p === this.currentPage
                ));
            }
        });

        // Next Button
        controlsWrapper.appendChild(createBtn(
            `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>`, 
            this.currentPage === totalPages, 
            () => this.changePage(1)
        ));

        const announcementSection = this.createAnnouncementSection(colors, mobile);

        if (mobile) {
            pagination.style.cssText = `padding: 12px; border-top: 1px solid ${colors.border}; display: flex; flex-direction: column; align-items: center; gap: 12px; background: transparent;`;
            pagination.appendChild(controlsWrapper);
            pagination.appendChild(announcementSection);
        } else {
            pagination.style.cssText = `padding: 16px 32px; border-top: 1px solid ${colors.border}; display: flex; justify-content: center; align-items: center; background: transparent; position: relative;`;
            
            const leftWrapper = document.createElement('div');
            leftWrapper.style.cssText = 'position: absolute; left: 32px;';
            leftWrapper.appendChild(announcementSection);

            pagination.appendChild(leftWrapper);
            pagination.appendChild(controlsWrapper);
        }
    }

    changePage(delta) {
        this.setPage(this.currentPage + delta);
    }
    
    setPage(pageNum) {
        const totalPages = Math.ceil(this.filteredPrompts.length / this.pageSize);
        if (pageNum < 1) pageNum = 1;
        if (pageNum > totalPages) pageNum = totalPages;
        
        this.currentPage = pageNum;
        this.renderCurrentPage();
    }

    handleKeyboard(event) {
        if (!this.modal || this.modal.style.display === 'none') {
            return;
        }
        
        // If gallery is open, handle gallery navigation
        if (this.gallery.isVisible()) {
            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                event.stopPropagation();
                this.gallery.navigate(-1);
            } else if (event.key === 'ArrowRight') {
                event.preventDefault();
                event.stopPropagation();
                this.gallery.navigate(1);
            } else if (event.key === 'Escape') {
                // Gallery close handled by its own internal logic or we could trigger it here if needed
            }
            return;
        }

        const activeElement = document.activeElement;
        if (activeElement && (
            activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.isContentEditable
        )) {
            return;
        }
        const totalPages = Math.ceil(this.filteredPrompts.length / this.pageSize);
        if (totalPages <= 1) {
            return;
        }
        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            if (this.currentPage > 1) {
                this.changePage(-1);
            }
        } else if (event.key === 'ArrowRight') {
            event.preventDefault();
            if (this.currentPage < totalPages) {
                this.changePage(1);
            }
        }
    }

    createPromptCard(prompt, favorites) {
        const promptId = prompt.id || `${prompt.title}-${prompt.author}`;
        const isFavorite = favorites.includes(promptId);
        const colors = this.adapter.getThemeColors();
        const theme = this.adapter.getCurrentTheme();
        const mobile = this.isMobile();

        const card = document.createElement('div');
        card.className = 'prompt-card';
        
        const borderColor = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
        const cardBg = theme === 'dark' ? 'rgba(35,35,37,0.6)' : '#ffffff';
        
        card.style.cssText = `
            background: ${cardBg}; 
            border-radius: 16px; 
            border: 1px solid ${borderColor}; 
            cursor: pointer; 
            overflow: hidden; 
            position: relative; 
            display: flex; 
            flex-direction: column;
            will-change: transform;
        `;

        card.onmouseenter = () => {
            if (!mobile) {
                card.style.transform = 'translateY(-6px)';
                card.style.boxShadow = '0 12px 30px rgba(0,0,0,0.1)';
                card.style.borderColor = colors.primary;
                const overlay = card.querySelector('.card-overlay');
                if(overlay) overlay.style.opacity = '1';
            }
        };
        card.onmouseleave = () => {
            if (!mobile) {
                card.style.transform = 'translateY(0)';
                card.style.boxShadow = 'none';
                card.style.borderColor = borderColor;
                const overlay = card.querySelector('.card-overlay');
                if(overlay) overlay.style.opacity = '0';
            }
        };

        // Handle multiple images
        const images = prompt.previews && prompt.previews.length > 0 
            ? prompt.previews 
            : (prompt.preview ? [prompt.preview] : []);
        
        const imgWrapper = document.createElement('div');
        imgWrapper.style.cssText = `position: relative; width: 100%; aspect-ratio: 16/10; overflow: hidden; background: ${colors.surfaceHover};`;
        
        // Image rendering logic
        if (images.length <= 1) {
            const img = document.createElement('img');
            // USE THE NEW SAFE LOADER
            BananaUtils.setSafeImageSrc(img, images[0] || 'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg');
            
            img.alt = prompt.title;
            img.loading = 'lazy';
            img.referrerPolicy = "no-referrer";
            img.style.cssText = `width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease;`;
            
            if(!mobile) {
                card.addEventListener('mouseenter', () => img.style.transform = 'scale(1.08)');
                card.addEventListener('mouseleave', () => img.style.transform = 'scale(1)');
            }
            imgWrapper.appendChild(img);
        } else {
            // Grid view for multiple images (max 9)
            const gridContainer = document.createElement('div');
            const displayCount = Math.min(images.length, 9);
            
            let gridCols = 2;
            if (displayCount === 1) gridCols = 1;
            else if (displayCount >= 2 && displayCount <= 4) gridCols = 2;
            else if (displayCount >= 5) gridCols = 3;

            gridContainer.style.cssText = `
                display: grid; 
                grid-template-columns: repeat(${gridCols}, 1fr); 
                width: 100%; height: 100%;
                gap: 1px;
            `;
            
            for (let i = 0; i < displayCount; i++) {
                const subImg = document.createElement('img');
                BananaUtils.setSafeImageSrc(subImg, images[i]);
                subImg.loading = 'lazy';
                subImg.referrerPolicy = "no-referrer";
                subImg.style.cssText = `width: 100%; height: 100%; object-fit: cover; cursor: pointer;`;
                
                subImg.onclick = (e) => {
                    e.stopPropagation();
                    this.gallery.show(images, i);
                };
                gridContainer.appendChild(subImg);
            }
            imgWrapper.appendChild(gridContainer);
        }

        const overlay = document.createElement('div');
        overlay.className = 'card-overlay';
        overlay.style.cssText = `
            position: absolute; inset: 0; 
            background: rgba(0,0,0,0.3); 
            display: flex; align-items: center; justify-content: center;
            opacity: 0; transition: opacity 0.2s ease;
            backdrop-filter: blur(2px);
            pointer-events: none; /* Let clicks pass through to grid items if needed, but we handle button clicks specifically */
        `;
        // Allow button clicks
        const useBtn = document.createElement('button');
        useBtn.innerHTML = '✨ Insert';
        useBtn.style.cssText = `
            padding: 8px 16px; background: white; border: none; border-radius: 20px;
            color: black; font-weight: 600; font-size: 13px; cursor: pointer;
            box-shadow: 0 4px 10px rgba(0,0,0,0.2); transform: translateY(4px); transition: transform 0.2s;
            pointer-events: auto;
        `;
        useBtn.onclick = (e) => {
            e.stopPropagation();
            this.adapter.insertPrompt(prompt.prompt);
        };
        
        card.onclick = (e) => {
            this.adapter.insertPrompt(prompt.prompt);
        };

        overlay.appendChild(useBtn);
        imgWrapper.appendChild(overlay);

        const favoriteBtn = document.createElement('button');
        const favColor = isFavorite ? '#F5D90A' : 'rgba(255,255,255,0.7)';
        
        favoriteBtn.style.cssText = `
            position: absolute; top: 10px; right: 10px; 
            width: 32px; height: 32px; 
            border-radius: 50%; border: none; 
            background: rgba(0,0,0,0.3); 
            color: ${favColor}; 
            font-size: 16px; 
            cursor: pointer; 
            display: flex; align-items: center; justify-content: center; 
            transition: all 0.2s; 
            z-index: 10; 
            backdrop-filter: blur(4px);
            pointer-events: auto;
        `;
        favoriteBtn.innerHTML = isFavorite ? '★' : '☆';
        favoriteBtn.onclick = (e) => {
            e.stopPropagation();
            this.toggleFavorite(promptId);
        };
        favoriteBtn.onmouseenter = () => favoriteBtn.style.transform = 'scale(1.1)';
        favoriteBtn.onmouseleave = () => favoriteBtn.style.transform = 'scale(1)';

        imgWrapper.appendChild(favoriteBtn);

        const content = document.createElement('div');
        content.style.cssText = 'padding: 12px 14px; flex: 1; display: flex; flex-direction: column; gap: 6px;';

        const title = document.createElement('h3');
        title.style.cssText = `
            font-size: 14px; font-weight: 600; color: ${colors.text}; margin: 0; 
            line-height: 1.4; 
            overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
            min-height: 40px;
        `;
        title.textContent = prompt.title;

        const metaRow = document.createElement('div');
        metaRow.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 8px;';

        const author = document.createElement('div');
        author.style.cssText = `display: flex; align-items: center; gap: 4px; font-size: 12px; color: ${colors.textSecondary}; max-width: 60%;`;
        author.innerHTML = `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${prompt.author}</span>
        `;

        const tagContainer = document.createElement('div');
        tagContainer.style.cssText = 'display: flex; gap: 6px; align-items: center;';

        const viewBtn = document.createElement('button');
        viewBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
        viewBtn.title = '查看原图';
        viewBtn.style.cssText = `
            background: transparent; color: ${colors.textSecondary}; border: 1px solid ${colors.border}; 
            width: 26px; height: 26px; border-radius: 50%; 
            display: flex; align-items: center; justify-content: center; 
            cursor: pointer; flex-shrink: 0; transition: all 0.2s;
            padding: 0;
            pointer-events: auto;
        `;
        
        if (!mobile) {
            viewBtn.onmouseenter = () => {
                viewBtn.style.color = colors.primary;
                viewBtn.style.borderColor = colors.primary;
                viewBtn.style.background = `${colors.primary}10`;
            };
            viewBtn.onmouseleave = () => {
                viewBtn.style.color = colors.textSecondary;
                viewBtn.style.borderColor = colors.border;
                viewBtn.style.background = 'transparent';
            };
        }

        viewBtn.onclick = (e) => {
            e.stopPropagation();
            // Pass full image list to preview
            this.gallery.show(images);
        };

        if (prompt.sub_category) {
            const subTag = document.createElement('span');
            const subTagBg = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
            subTag.style.cssText = `background: ${subTagBg}; color: ${colors.textSecondary}; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 500; letter-spacing: 0.5px;`;
            subTag.textContent = prompt.sub_category;
            tagContainer.appendChild(subTag);
        }

        tagContainer.appendChild(viewBtn);

        metaRow.appendChild(author);
        metaRow.appendChild(tagContainer);

        content.appendChild(title);
        content.appendChild(metaRow);

        if (!prompt.isFlash) {
            const actionContainer = document.createElement('div');
            actionContainer.className = 'card-actions';
            actionContainer.style.cssText = `
                position: absolute; top: 10px; left: 10px; z-index: 10;
                display: flex; gap: 6px; opacity: 0; transition: opacity 0.2s;
                pointer-events: auto;
            `;
            if (mobile) actionContainer.style.opacity = '1';
            else {
                card.addEventListener('mouseenter', () => actionContainer.style.opacity = '1');
                card.addEventListener('mouseleave', () => actionContainer.style.opacity = '0');
            }

            const createActionBtn = (icon, onClick, title) => {
                const b = document.createElement('button');
                b.innerHTML = icon;
                b.title = title;
                b.style.cssText = `
                    width: 28px; height: 28px; border-radius: 50%; border: none;
                    background: rgba(0,0,0,0.6); color: white;
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer; backdrop-filter: blur(4px); transition: transform 0.2s;
                `;
                b.onclick = onClick;
                b.onmouseenter = () => b.style.transform = 'scale(1.1)';
                b.onmouseleave = () => b.style.transform = 'scale(1)';
                return b;
            };

            const editBtn = createActionBtn(
                '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>',
                (e) => { e.stopPropagation(); this.showAddPromptModal(prompt); },
                "Edit"
            );

            const deleteBtn = createActionBtn(
                '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
                (e) => { e.stopPropagation(); if (confirm('确定要删除这个 Prompt 吗？')) this.handleDeletePrompt(prompt); },
                "Delete"
            );
            deleteBtn.onmouseenter = () => { deleteBtn.style.background = '#ef4444'; deleteBtn.style.transform = 'scale(1.1)'; };
            deleteBtn.onmouseleave = () => { deleteBtn.style.background = 'rgba(0,0,0,0.6)'; deleteBtn.style.transform = 'scale(1)'; };

            actionContainer.appendChild(editBtn);
            actionContainer.appendChild(deleteBtn);
            imgWrapper.appendChild(actionContainer);
        }

        card.appendChild(imgWrapper);
        card.appendChild(content);

        return card;
    }

    async getFavorites() {
        try {
            if (!chrome.runtime?.id) return [];
            const result = await chrome.storage.sync.get(['banana-favorites']);
            return result['banana-favorites'] || [];
        } catch (error) {
            console.error('[Banana] Failed to get favorites:', error);
            return [];
        }
    }

    async toggleFavorite(promptId) {
        try {
            const favorites = await this.getFavorites();
            const index = favorites.indexOf(promptId);

            if (index > -1) {
                favorites.splice(index, 1);
            } else {
                favorites.push(promptId);
            }

            await chrome.storage.sync.set({ 'banana-favorites': favorites });
            this.applyFilters(false);
        } catch (error) {
            console.error('[Banana] Failed to toggle favorite:', error);
            alert('操作失败，请刷新页面。');
        }
    }

    showAddPromptModal(promptToEdit = null) {
        this.editor.show(promptToEdit, this.categories, async (data) => {
            const originalId = (promptToEdit && !promptToEdit.isCustom) ? promptToEdit.id : undefined;
            await this.handleSavePrompt(data, originalId);
        });
    }

    async handleDeletePrompt(prompt) {
        try {
            if (prompt.isCustom) {
                const customPrompts = await this.getCustomPrompts();
                const newPrompts = customPrompts.filter(p => p.id !== prompt.id);
                await chrome.storage.local.set({ 'banana-custom-prompts': newPrompts });
            } else {
                await this.addToHiddenIds(prompt.id);
            }
            await this.loadPrompts();
        } catch (error) {
            console.error('[Banana] Delete failed:', error);
            alert('删除失败，请刷新页面。');
        }
    }

    async handleSavePrompt(data, originalIdToHide) {
        try {
            let customPrompts = await this.getCustomPrompts();
            
            if (originalIdToHide) {
                await this.addToHiddenIds(originalIdToHide);
            }

            const newEntry = {
                ...data,
                author: 'Me',
                isCustom: true,
                id: data.id || Date.now()
            };
            
            // Ensure we don't have mixed preview/previews if switching types
            if (newEntry.previews && newEntry.previews.length > 1) {
                 delete newEntry.preview;
            } else if (newEntry.preview) {
                 delete newEntry.previews;
            }

            if (data.id) {
                const index = customPrompts.findIndex(p => p.id === data.id);
                if (index > -1) {
                    customPrompts[index] = newEntry;
                } else {
                    customPrompts.unshift(newEntry);
                }
            } else {
                customPrompts.unshift(newEntry);
            }
            await chrome.storage.local.set({ 'banana-custom-prompts': customPrompts });
            await this.loadPrompts();
        } catch (error) {
            console.error('[Banana] Save failed:', error);
            alert('保存失败，插件上下文可能已失效，请刷新页面。');
        }
    }

    async loadAnnouncements() {
        try {
            this.announcements = LOCAL_ANNOUNCEMENTS;
            if (!this.rotationTimeout) {
                this.currentAnnouncementIndex = 0;
                this.startAnnouncementRotation();
            }
        } catch (e) {
            console.error('Failed to load announcements', e);
        }
    }

    renderAnnouncement() {
        return new Promise((resolve) => {
            const container = document.getElementById('announcement-container');
            if (!container || !this.announcements || this.announcements.length === 0) {
                resolve(5000);
                return;
            }
            const item = this.announcements[this.currentAnnouncementIndex];
            container.innerHTML = '';
            const icon = document.createElement('span');
            icon.textContent = '📢';
            icon.style.marginRight = '8px';
            const contentWrapper = document.createElement('div');
            contentWrapper.style.cssText = 'flex: 1; overflow: hidden; white-space: nowrap; position: relative; mask-image: linear-gradient(to right, black 0%, black 95%, transparent 100%); -webkit-mask-image: linear-gradient(to right, black 0%, black 95%, transparent 100%);';
            const text = document.createElement('span');
            text.textContent = item.content;
            text.style.cssText = 'display: inline-block; transition: transform 0.3s;';
            if (item.link) {
                text.style.cursor = 'pointer';
                text.style.textDecoration = 'underline';
                text.onclick = () => window.open(item.link, '_blank');
            }
            contentWrapper.appendChild(text);
            container.appendChild(icon);
            container.appendChild(contentWrapper);
            requestAnimationFrame(() => {
                if (text.offsetWidth > contentWrapper.offsetWidth) {
                    const scrollDistance = text.offsetWidth - contentWrapper.offsetWidth;
                    const speed = 30;
                    const scrollDuration = scrollDistance / speed;
                    text.style.transition = `transform ${scrollDuration}s linear`;
                    text.style.transform = 'translateX(0)';
                    const startDelay = 1000;
                    const endDelay = 2000;
                    setTimeout(() => {
                        text.style.transform = `translateX(-${scrollDistance}px)`;
                    }, startDelay);
                    resolve((scrollDuration * 1000) + startDelay + endDelay);
                } else {
                    resolve(5000);
                }
            });
        });
    }

    startAnnouncementRotation() {
        if (!this.announcements || this.announcements.length === 0) return;
        if (this.rotationTimeout) clearTimeout(this.rotationTimeout);
        const showNext = () => {
            this.renderAnnouncement().then(duration => {
                this.rotationTimeout = setTimeout(() => {
                    this.currentAnnouncementIndex = (this.currentAnnouncementIndex + 1) % this.announcements.length;
                    showNext();
                }, duration);
            });
        };
        showNext();
    }

    createAnnouncementSection(colors, mobile) {
        const container = document.createElement('div');
        container.id = 'announcement-container';
        container.style.cssText = `
            display: flex;
            align-items: center;
            font-size: 13px;
            color: ${colors.textSecondary};
            background: ${this.adapter.getCurrentTheme() === 'dark' ? 'rgba(255,255,255,0.05)' : '#f4f4f5'};
            padding: 0 12px;
            border-radius: 100px;
            max-width: ${mobile ? '100%' : '240px'};
            width: ${mobile ? '100%' : '240px'};
            flex-shrink: 1;
            height: 32px;
            overflow: hidden;
            box-sizing: border-box;
            border: 1px solid transparent;
            flex: ${mobile ? 'none' : '0 1 auto'};
        `;
        if (this.announcements && this.announcements.length > 0) {
            setTimeout(() => this.renderAnnouncement(), 0);
        }
        return container;
    }
}
