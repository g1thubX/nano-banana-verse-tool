
const BananaUtils = {
    generatePromptId(prompt) {
        if (prompt.id) return prompt.id;
        const str = `${prompt.title}-${prompt.author}`;
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0;
        }
        return `default-${Math.abs(hash)}`;
    },

    async compressImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 300;
                    const MAX_HEIGHT = 300;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    resolve(dataUrl);
                };
                img.onerror = reject;
            };
            reader.onerror = reject;
        });
    },

    // 针对 Gemini 等严格 CSP 网站的图片加载增强逻辑
    async setSafeImageSrc(img, url) {
        if (!url) {
            this.setFallbackImage(img);
            return;
        }

        // 如果已经是 base64 或 blob，直接尝试加载
        if (url.startsWith('data:') || url.startsWith('blob:')) {
            img.src = url;
            img.onerror = () => this.setFallbackImage(img);
            return;
        }

        // 尝试通过 fetch 获取 Blob，绕过 CSP img-src 限制
        // 这需要 manifest.json 中配置了 host_permissions
        try {
            const response = await fetch(url, { cache: 'force-cache' });
            if (!response.ok) throw new Error('Network response was not ok');
            
            const blob = await response.blob();
            const objectURL = URL.createObjectURL(blob);
            
            img.onload = () => {
                // 图片加载成功后释放内存，但对于列表滚动可能需要保持，视情况而定。
                // 这里为了性能，列表项卸载时浏览器会自动处理大部分，或者可以在组件销毁时清理。
                // 作为一个简单的优化，我们让它保持有效直到页面刷新。
            };
            
            img.src = objectURL;
        } catch (error) {
            console.warn('Banana Prompt: Blob fetch failed, falling back to direct URL', error);
            // 降级：尝试直接赋值，有些网站可能允许部分域名
            img.src = url;
            img.onerror = () => this.setFallbackImage(img);
        }
    },

    setFallbackImage(img) {
        img.onerror = null; // 防止死循环
        img.src = 'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg';
        img.style.objectFit = 'contain';
        img.style.padding = '20px';
        img.style.opacity = '0.5';
    }
};
