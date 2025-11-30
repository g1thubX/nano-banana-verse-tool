
class BananaGallery {
    constructor() {
        this.currentGalleryImages = [];
        this.currentGalleryIndex = 0;
        this.galleryOverlay = null;
    }

    show(srcOrList, startIndex = 0) {
        this.currentGalleryImages = Array.isArray(srcOrList) ? srcOrList : [srcOrList];
        this.currentGalleryIndex = startIndex;

        const overlay = document.createElement('div');
        this.galleryOverlay = overlay;
        overlay.style.cssText = `
            position: fixed; inset: 0; z-index: 2147483655;
            background: rgba(0,0,0,0.9);
            display: flex; align-items: center; justify-content: center;
            opacity: 0; transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            backdrop-filter: blur(10px);
            flex-direction: column;
        `;
        
        const imgContainer = document.createElement('div');
        imgContainer.style.cssText = `position: relative; max-width: 90%; max-height: 85vh; display: flex; align-items: center; justify-content: center;`;

        const img = document.createElement('img');
        img.id = 'gallery-current-img';
        BananaUtils.setSafeImageSrc(img, this.currentGalleryImages[this.currentGalleryIndex]);
        img.referrerPolicy = "no-referrer";
        img.style.cssText = `
            max-width: 100%; max-height: 85vh;
            border-radius: 8px;
            box-shadow: 0 20px 50px rgba(0,0,0,0.5);
            transform: scale(0.9); transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            object-fit: contain;
        `;
        imgContainer.appendChild(img);

        // Navigation arrows
        if (this.currentGalleryImages.length > 1) {
            const createNavBtn = (direction) => {
                const btn = document.createElement('button');
                btn.innerHTML = direction === 'prev' 
                    ? `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>`
                    : `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
                
                btn.style.cssText = `
                    position: absolute; top: 50%; ${direction === 'prev' ? 'left: -60px;' : 'right: -60px;'} transform: translateY(-50%);
                    width: 50px; height: 50px; border-radius: 50%;
                    background: rgba(255,255,255,0.1); color: white;
                    border: none; cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    transition: all 0.2s; backdrop-filter: blur(4px);
                `;
                // Mobile positioning
                if (window.innerWidth <= 768) {
                    btn.style[direction === 'prev' ? 'left' : 'right'] = '10px';
                    btn.style.zIndex = '100';
                }

                btn.onmouseenter = () => btn.style.background = 'rgba(255,255,255,0.25)';
                btn.onmouseleave = () => btn.style.background = 'rgba(255,255,255,0.1)';
                
                btn.onclick = (e) => {
                    e.stopPropagation();
                    this.navigate(direction === 'prev' ? -1 : 1);
                };
                return btn;
            };

            imgContainer.appendChild(createNavBtn('prev'));
            imgContainer.appendChild(createNavBtn('next'));
        }

        // Counter
        if (this.currentGalleryImages.length > 1) {
            const counter = document.createElement('div');
            counter.id = 'gallery-counter';
            counter.textContent = `${this.currentGalleryIndex + 1} / ${this.currentGalleryImages.length}`;
            counter.style.cssText = `
                position: absolute; bottom: -40px; left: 50%; transform: translateX(-50%);
                color: rgba(255,255,255,0.8); font-size: 14px; font-weight: 500;
                background: rgba(0,0,0,0.5); padding: 4px 12px; border-radius: 20px;
            `;
            imgContainer.appendChild(counter);
        }
        
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
        closeBtn.style.cssText = `
            position: absolute; top: 24px; right: 24px;
            width: 44px; height: 44px; border-radius: 50%;
            background: rgba(255,255,255,0.1); color: white;
            border: none; cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            transition: all 0.2s; backdrop-filter: blur(4px); z-index: 101;
        `;
        closeBtn.onmouseenter = () => {
            closeBtn.style.background = 'rgba(255,255,255,0.25)';
            closeBtn.style.transform = 'rotate(90deg)';
        };
        closeBtn.onmouseleave = () => {
            closeBtn.style.background = 'rgba(255,255,255,0.1)';
            closeBtn.style.transform = 'rotate(0deg)';
        };
        
        const close = () => {
            overlay.style.opacity = '0';
            const imgEl = document.getElementById('gallery-current-img');
            if(imgEl) imgEl.style.transform = 'scale(0.9)';
            
            setTimeout(() => {
                if (overlay.parentNode) document.body.removeChild(overlay);
                this.galleryOverlay = null;
                this.currentGalleryImages = [];
            }, 300);
        };

        closeBtn.onclick = (e) => {
            e.stopPropagation();
            close();
        };
        overlay.onclick = (e) => {
            if (e.target === overlay || e.target === imgContainer) close();
        };
        
        overlay.appendChild(imgContainer);
        overlay.appendChild(closeBtn);
        document.body.appendChild(overlay);

        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
            img.style.transform = 'scale(1)';
        });
    }

    navigate(dir) {
        if (!this.currentGalleryImages.length) return;
        
        this.currentGalleryIndex = (this.currentGalleryIndex + dir + this.currentGalleryImages.length) % this.currentGalleryImages.length;
        
        const img = document.getElementById('gallery-current-img');
        const counter = document.getElementById('gallery-counter');
        
        if (img) {
            img.style.opacity = '0.5';
            setTimeout(() => {
                BananaUtils.setSafeImageSrc(img, this.currentGalleryImages[this.currentGalleryIndex]);
                img.style.opacity = '1';
            }, 150);
        }
        
        if (counter) {
            counter.textContent = `${this.currentGalleryIndex + 1} / ${this.currentGalleryImages.length}`;
        }
    }

    isVisible() {
        return this.galleryOverlay && this.galleryOverlay.style.opacity !== '0';
    }
}
