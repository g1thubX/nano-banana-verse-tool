// 创建右键菜单
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'banana-prompt',
        title: '🍌 Insert Banana Prompts',
        contexts: ['editable']  // 只在可编辑区域（输入框、文本框等）显示
    })
})

// 处理右键菜单点击事件
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'banana-prompt') {
        // 向当前标签页的 content script 发送消息
        chrome.tabs.sendMessage(tab.id, { action: 'openModal' }).catch(err => {
            console.log('Banana Prompt: Could not send message to tab', err)
        })
    }
})

// 处理插件图标点击事件 (手动强制加载/打印调试信息)
chrome.action.onClicked.addListener((tab) => {
    if (tab.id) {
        console.log('Banana Prompt: Icon clicked, forcing init on tab', tab.id)
        chrome.tabs.sendMessage(tab.id, { action: 'forceInit' }).catch(err => {
            console.log('Banana Prompt: Content script might not be ready yet or page is restricted.', err)
        })
    }
})