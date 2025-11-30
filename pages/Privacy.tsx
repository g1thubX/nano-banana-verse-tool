import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';

interface PrivacyProps {
  onBack: () => void;
}

const Privacy: React.FC<PrivacyProps> = ({ onBack }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 font-sans selection:bg-yellow-200 selection:text-yellow-900">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <button 
          onClick={onBack}
          className="group flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors mb-12"
        >
          <div className="p-2 rounded-full bg-white border border-zinc-200 group-hover:border-zinc-300 shadow-sm transition-all">
            <ArrowLeft size={16} />
          </div>
          <span className="font-medium">返回首页</span>
        </button>
        
        <div className="bg-white rounded-3xl border border-zinc-100 shadow-xl shadow-zinc-200/50 p-8 md:p-16">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-6 text-zinc-900">隐私政策</h1>
          <div className="text-zinc-400 text-sm mb-10 font-medium">最后更新: 2023年10月26日</div>

          <div className="prose prose-zinc max-w-none text-zinc-600 leading-relaxed">
            <p className="text-lg mb-8">
              <strong>Banana Verse</strong> ("我们") 致力于保护您的隐私。本隐私政策说明了我们的浏览器扩展程序如何处理您的信息。简而言之：<strong className="text-zinc-900">我们不会收集、存储或传输您的个人数据到任何外部服务器。</strong>
            </p>

            <div className="space-y-12">
              <section>
                <h2 className="text-xl font-bold text-zinc-900 mb-4 inline-flex border-b-2 border-yellow-400/50 pb-1">1. 数据收集与使用</h2>
                <p className="mb-4">我们坚信隐私至上。以下是数据的处理方式：</p>
                <ul className="list-disc pl-5 space-y-3 marker:text-yellow-500">
                  <li><strong className="text-zinc-800">本地存储：</strong> 您所有的自定义 Prompt、收藏夹和设置都使用 Chrome Storage API (<code>chrome.storage.local</code> 和 <code>chrome.storage.sync</code>) 存储在您的本地浏览器中。这些数据永远不会离开您的设备。</li>
                  <li><strong className="text-zinc-800">无追踪：</strong> 我们不使用 Cookie、分析软件或第三方追踪服务。我们不追踪您的浏览历史。</li>
                  <li><strong className="text-zinc-800">无个人信息：</strong> 我们不收集姓名、电子邮件地址或任何个人身份信息。</li>
                  <li><strong className="text-zinc-800">AI 交互：</strong> 我们不收集、存储或传输您与 AI 平台（Google Gemini, AI Studio）的对话内容。扩展程序的功能仅在于根据您的指令将文本<em>插入</em>到输入框中。</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-zinc-900 mb-4 inline-flex border-b-2 border-yellow-400/50 pb-1">2. 所需权限</h2>
                <p className="mb-4">为了正常运行，Banana Verse 扩展程序需要特定权限，这些权限严格限制在扩展程序的核心功能内：</p>
                <ul className="list-disc pl-5 space-y-3 marker:text-yellow-500">
                  <li><strong className="text-zinc-800">Storage (存储)：</strong> 仅用于在您的设备上本地保存您的偏好设置、自定义 Prompt 和收藏夹。</li>
                  <li><strong className="text-zinc-800">Context Menus (右键菜单)：</strong> 用于在浏览器的右键菜单中添加“Insert Banana Prompts”选项，以便快速访问。</li>
                  <li><strong className="text-zinc-800">Host Permissions (主机权限)：</strong> <code>https://raw.githubusercontent.com/*</code> 仅用于从我们的开源 GitHub 仓库获取最新的精选 Prompt 库更新。在此过程中不发送任何用户数据。</li>
                  <li><strong className="text-zinc-800">Content Scripts (内容脚本)：</strong> 用于在支持的平台（<code>aistudio.google.com</code>, <code>gemini.google.com</code>）上注入悬浮的“Banana”按钮并处理文本插入。扩展程序仅在您明确触发操作时与网页 DOM 进行交互。</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-zinc-900 mb-4 inline-flex border-b-2 border-yellow-400/50 pb-1">3. 数据共享</h2>
                <p className="mb-4">由于我们不收集任何用户数据，因此我们没有任何数据可供共享。</p>
                <ul className="list-disc pl-5 space-y-3 marker:text-yellow-500">
                  <li>我们不会出售、交易或向第三方传输数据。</li>
                  <li>我们没有包含用户信息的后端服务器数据库。</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-zinc-900 mb-4 inline-flex border-b-2 border-yellow-400/50 pb-1">4. 您的权利</h2>
                <p className="mb-4">您对自己的数据拥有完全的控制权：</p>
                <ul className="list-disc pl-5 space-y-3 marker:text-yellow-500">
                  <li><strong className="text-zinc-800">访问与修改：</strong> 您可以直接在扩展程序界面中查看和编辑您的自定义 Prompt。</li>
                  <li><strong className="text-zinc-800">删除：</strong> 您可以单独删除自定义 Prompt。从浏览器中移除扩展程序将永久删除与其关联的所有本地存储数据。</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-zinc-900 mb-4 inline-flex border-b-2 border-yellow-400/50 pb-1">5. 儿童隐私</h2>
                <p>我们的扩展程序不会有意收集 13 岁以下儿童的任何信息。它是为普通受众设计的生产力工具。</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-zinc-900 mb-4 inline-flex border-b-2 border-yellow-400/50 pb-1">6. 本政策的变更</h2>
                <p>我们可能会不时更新本隐私政策，以反映我们惯例的变化或其他运营、法律或监管原因。任何更改都将更新修订日期并在本页面上反映。</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-zinc-900 mb-4 inline-flex border-b-2 border-yellow-400/50 pb-1">7. 联系我们</h2>
                <p className="mb-4">如果您对本隐私政策或扩展程序的做法有任何疑问，请验证我们开源仓库上的代码或通过 GitHub 联系我们：</p>
                <a href="https://github.com/g1thubX/nano-banana-verse-tool" target="_blank" rel="noreferrer" className="text-yellow-600 font-medium hover:underline break-all bg-yellow-50 px-2 py-1 rounded">
                  https://github.com/g1thubX/nano-banana-verse-tool
                </a>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;