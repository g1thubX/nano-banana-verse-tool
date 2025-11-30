
class BananaEditor {
    constructor(adapter) {
        this.adapter = adapter;
    }

    show(promptToEdit = null, existingCategories = [], onSaveCallback) {
        const colors = this.adapter.getThemeColors();
        const mobile = window.innerWidth <= 768;

        const overlay = document.createElement('div');
        overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2147483650; backdrop-filter: blur(4px);';
        overlay.onclick = (e) => {
            if (e.target === overlay) document.body.removeChild(overlay);
        };

        const dialog = document.createElement('div');
        const bg = this.adapter.getCurrentTheme() === 'dark' ? '#1c1c1e' : '#ffffff';
        
        dialog.style.cssText = `
            background: ${bg}; 
            padding: ${mobile ? '24px' : '32px'}; 
            border-radius: 24px; 
            width: ${mobile ? '90%' : '520px'}; 
            max-width: 95%; 
            max-height: 85vh;
            overflow-y: auto;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); 
            display: flex; flex-direction: column; gap: 20px; 
            color: ${colors.text};
            transform: scale(0.95); opacity: 0; transition: all 0.2s ease-out;
        `;
        
        requestAnimationFrame(() => {
            dialog.style.transform = 'scale(1)';
            dialog.style.opacity = '1';
        });
        
        dialog.onclick = (e) => e.stopPropagation();

        const header = document.createElement('div');
        header.style.cssText = 'display: flex; justify-content: space-between; align-items: center;';
        
        const title = document.createElement('h3');
        title.textContent = promptToEdit ? '编辑 Prompt' : '添加新 Prompt';
        title.style.cssText = 'margin: 0; font-size: 20px; font-weight: 700;';
        
        header.appendChild(title);

        const createInput = (placeholder, isTextarea = false) => {
            const input = document.createElement(isTextarea ? 'textarea' : 'input');
            input.placeholder = placeholder;
            const inputBg = this.adapter.getCurrentTheme() === 'dark' ? 'rgba(0,0,0,0.3)' : '#f4f4f5';
            
            input.style.cssText = `
                width: 100%; padding: 14px 16px; 
                border: 1px solid transparent; 
                border-radius: 12px; 
                background: ${inputBg}; 
                color: ${colors.text}; 
                font-size: 14px; 
                outline: none; box-sizing: border-box; 
                transition: all 0.2s; 
                ${isTextarea ? 'min-height: 120px; resize: vertical; font-family: inherit; line-height: 1.5;' : ''}
            `;
            input.onfocus = () => {
                input.style.background = this.adapter.getCurrentTheme() === 'dark' ? 'rgba(0,0,0,0.5)' : '#fff';
                input.style.borderColor = colors.primary;
                input.style.boxShadow = `0 0 0 4px ${colors.primary}15`;
            };
            input.onblur = () => {
                input.style.background = inputBg;
                input.style.borderColor = 'transparent';
                input.style.boxShadow = 'none';
            };
            return input;
        };

        const titleInput = createInput('标题 (例如: 赛博朋克城市)');
        if (promptToEdit) titleInput.value = promptToEdit.title;

        // --- Image Upload Section ---
        const imageSection = document.createElement('div');
        imageSection.style.cssText = `display: flex; flex-direction: column; gap: 10px;`;
        
        const imageLabel = document.createElement('div');
        imageLabel.innerHTML = `<span style="font-weight:600; font-size:14px;">预览图片 (最多9张)</span>`;
        imageSection.appendChild(imageLabel);

        const previewGrid = document.createElement('div');
        previewGrid.style.cssText = `display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 8px;`;

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.multiple = true;
        fileInput.style.display = 'none';

        const addImgBtn = document.createElement('div');
        addImgBtn.style.cssText = `
            width: 100%; aspect-ratio: 1; border-radius: 12px; 
            border: 2px dashed ${this.adapter.getThemeColors().border}; 
            background: transparent; 
            cursor: pointer; display: flex; align-items: center; justify-content: center; 
            transition: all 0.2s;
        `;
        addImgBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${colors.textSecondary}" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;
        addImgBtn.onmouseenter = () => addImgBtn.style.borderColor = colors.primary;
        addImgBtn.onmouseleave = () => addImgBtn.style.borderColor = this.adapter.getThemeColors().border;
        addImgBtn.onclick = () => fileInput.click();

        // Store current images (mixed strings and dataURLs)
        let currentImages = [];
        if (promptToEdit) {
            if (promptToEdit.previews && Array.isArray(promptToEdit.previews)) {
                currentImages = [...promptToEdit.previews];
            } else if (promptToEdit.preview) {
                currentImages = [promptToEdit.preview];
            }
        }

        const renderPreviews = () => {
            previewGrid.innerHTML = '';
            
            currentImages.forEach((src, index) => {
                const thumb = document.createElement('div');
                thumb.style.cssText = `position: relative; width: 100%; aspect-ratio: 1; border-radius: 12px; overflow: hidden;`;
                
                const img = document.createElement('img');
                BananaUtils.setSafeImageSrc(img, src);
                img.style.cssText = `width: 100%; height: 100%; object-fit: cover;`;
                
                const removeBtn = document.createElement('div');
                removeBtn.innerHTML = '×';
                removeBtn.style.cssText = `
                    position: absolute; top: 4px; right: 4px; width: 20px; height: 20px; 
                    background: rgba(0,0,0,0.6); color: white; border-radius: 50%; 
                    display: flex; align-items: center; justify-content: center; 
                    font-size: 14px; cursor: pointer; font-weight: bold;
                `;
                removeBtn.onclick = (e) => {
                    e.stopPropagation();
                    currentImages.splice(index, 1);
                    renderPreviews();
                };
                
                thumb.appendChild(img);
                thumb.appendChild(removeBtn);
                previewGrid.appendChild(thumb);
            });

            // Always show add button unless max reached
            if (currentImages.length < 9) {
                previewGrid.appendChild(addImgBtn);
            }
        };

        fileInput.onchange = async (e) => {
            if (e.target.files && e.target.files.length > 0) {
                const remainingSlots = 9 - currentImages.length;
                if (remainingSlots <= 0) {
                    alert('最多只能上传9张图片');
                    return;
                }
                
                const filesToProcess = Array.from(e.target.files).slice(0, remainingSlots);
                if (filesToProcess.length < e.target.files.length) {
                    alert(`只能添加 ${remainingSlots} 张图片，多余的已被忽略。`);
                }

                const saveBtn = dialog.querySelector('#banana-save-btn');
                if(saveBtn) {
                    saveBtn.textContent = '处理中...';
                    saveBtn.disabled = true;
                }
                
                try {
                    const newImages = await Promise.all(filesToProcess.map(f => BananaUtils.compressImage(f)));
                    currentImages = [...currentImages, ...newImages];
                    renderPreviews();
                } catch (err) {
                    console.error('Image processing failed', err);
                    alert('图片处理失败');
                } finally {
                    if(saveBtn) {
                        saveBtn.textContent = promptToEdit ? '更新' : '保存';
                        saveBtn.disabled = false;
                    }
                    fileInput.value = ''; // reset
                }
            }
        };

        renderPreviews();
        imageSection.appendChild(previewGrid);
        // --- End Image Upload Section ---

        const categoryContainer = document.createElement('div');
        categoryContainer.style.cssText = 'display: flex; gap: 12px;';

        const catSelectWrapper = document.createElement('div');
        catSelectWrapper.style.cssText = 'flex: 1; position: relative;';
        
        const catSelect = document.createElement('select');
        const catBg = this.adapter.getCurrentTheme() === 'dark' ? 'rgba(0,0,0,0.3)' : '#f4f4f5';
        catSelect.style.cssText = `
            width: 100%; padding: 12px 16px; border-radius: 12px; border: 1px solid transparent; 
            background: ${catBg}; color: ${colors.text}; font-size: 14px; outline: none; appearance: none;
        `;
        
        const addCategories = Array.from(existingCategories)
            .filter(c => c !== '全部')
            .sort((a, b) => a.localeCompare(b));
        
        if(addCategories.length === 0) addCategories.push("生活");

        addCategories.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c;
            opt.text = c;
            catSelect.appendChild(opt);
        });
        
        if(promptToEdit && promptToEdit.category) {
            catSelect.value = promptToEdit.category;
        }

        catSelectWrapper.appendChild(catSelect);
        const arrow = document.createElement('div');
        arrow.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>`;
        arrow.style.cssText = `position: absolute; right: 16px; top: 50%; transform: translateY(-50%); pointer-events: none; opacity: 0.5;`;
        catSelectWrapper.appendChild(arrow);

        const subCategoryInput = createInput('子标签 (可选)');
        subCategoryInput.style.flex = '1';
        if (promptToEdit && promptToEdit.sub_category) subCategoryInput.value = promptToEdit.sub_category;

        categoryContainer.appendChild(catSelectWrapper);
        categoryContainer.appendChild(subCategoryInput);

        const promptInput = createInput('Prompt 内容', true);
        if (promptToEdit) promptInput.value = promptToEdit.prompt;

        const modeContainer = document.createElement('div');
        modeContainer.style.display = 'flex';
        modeContainer.style.gap = '16px';
        modeContainer.style.alignItems = 'center';
        
        const modeLabel = document.createElement('span');
        modeLabel.textContent = '模式:';
        modeLabel.style.fontSize = '14px';
        modeLabel.style.fontWeight = '600';
        modeContainer.appendChild(modeLabel);

        let selectedMode = promptToEdit ? promptToEdit.mode : 'generate';
        
        const createRadio = (value, label) => {
            const wrapper = document.createElement('div');
            wrapper.style.cssText = 'display: flex; align-items: center; gap: 6px; cursor: pointer;';
            
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'prompt-mode';
            radio.value = value;
            radio.id = `mode-${value}`;
            radio.checked = value === selectedMode;
            radio.style.accentColor = colors.primary;
            radio.onchange = () => selectedMode = value;
            
            const l = document.createElement('label');
            l.htmlFor = `mode-${value}`;
            l.textContent = label;
            l.style.fontSize = '14px';
            l.style.cursor = 'pointer';

            wrapper.appendChild(radio);
            wrapper.appendChild(l);
            return wrapper;
        };

        modeContainer.appendChild(createRadio('generate', '文生图'));
        modeContainer.appendChild(createRadio('edit', '编辑'));

        const btnContainer = document.createElement('div');
        btnContainer.style.cssText = 'display: flex; justify-content: flex-end; gap: 12px; margin-top: 12px;';

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = '取消';
        cancelBtn.style.cssText = `padding: 10px 24px; border: 1px solid ${colors.border}; border-radius: 12px; background: transparent; color: ${colors.text}; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.2s ease;`;
        cancelBtn.onmouseenter = () => cancelBtn.style.background = this.adapter.getCurrentTheme() === 'dark' ? 'rgba(255,255,255,0.1)' : '#f4f4f5';
        cancelBtn.onmouseleave = () => cancelBtn.style.background = 'transparent';
        
        cancelBtn.onclick = () => {
            document.body.removeChild(overlay);
        };

        const saveBtn = document.createElement('button');
        saveBtn.id = 'banana-save-btn';
        saveBtn.textContent = promptToEdit ? '更新' : '保存';
        saveBtn.style.cssText = `padding: 10px 32px; border: none; border-radius: 12px; background: ${colors.primary}; color: #000; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.2s ease; box-shadow: 0 4px 12px ${colors.primary}40;`;
        saveBtn.onmouseenter = () => {
            saveBtn.style.transform = 'translateY(-1px)';
            saveBtn.style.boxShadow = `0 6px 16px ${colors.primary}60`;
        };
        saveBtn.onmouseleave = () => {
            saveBtn.style.transform = 'translateY(0)';
            saveBtn.style.boxShadow = `0 4px 12px ${colors.primary}40`;
        };
        
        saveBtn.onclick = async () => {
            const titleVal = titleInput.value.trim();
            const promptVal = promptInput.value.trim();
            if (!titleVal || !promptVal) {
                alert('请填写标题和内容');
                return;
            }

            const subCategoryVal = subCategoryInput.value.trim();
            const catVal = catSelect.value;
            
            // Construct data object
            const promptData = {
                id: promptToEdit ? (promptToEdit.isCustom ? promptToEdit.id : undefined) : undefined,
                title: titleVal,
                prompt: promptVal,
                mode: selectedMode,
                category: catVal,
                sub_category: subCategoryVal || undefined
            };

            // Handle images logic: if 0, default; if 1, preview; if >1, previews
            if (currentImages.length === 0) {
                promptData.preview = 'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg';
            } else if (currentImages.length === 1) {
                promptData.preview = currentImages[0];
                // Ensure previews is cleaned up if it existed
                delete promptData.previews;
            } else {
                promptData.previews = currentImages;
                // Ensure preview is cleaned up if it existed (or keep first as fallback? usually safe to clean)
                delete promptData.preview;
            }

            if (onSaveCallback) {
                await onSaveCallback(promptData);
            }
            document.body.removeChild(overlay);
        };

        btnContainer.appendChild(cancelBtn);
        btnContainer.appendChild(saveBtn);

        dialog.appendChild(header);
        dialog.appendChild(titleInput);
        dialog.appendChild(imageSection);
        dialog.appendChild(categoryContainer);
        dialog.appendChild(promptInput);
        dialog.appendChild(modeContainer);
        dialog.appendChild(btnContainer);

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
    }
}
