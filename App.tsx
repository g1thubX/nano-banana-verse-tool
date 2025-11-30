import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Menu,
  ArrowRight,
  Github,
  Grid,
  Heart,
  Copy,
  Command
} from 'lucide-react';
import Privacy from './pages/Privacy';

// --- Mock Data for Landing Page Gallery ---
const LANDING_PROMPTS = [
  {
    id: 1,
    title: "赛博朋克都市夜景",
    author: "NeonDreamer",
    category: "艺术",
    color: "from-pink-500 to-violet-500",
    icon: "🌃",
    prompt: "未来主义赛博朋克城市街道夜景，霓虹灯在湿润的路面上反射，高耸的摩天大楼。"
  },
  {
    id: 2,
    title: "极简主义 Logo 设计",
    author: "DesignPro",
    category: "设计",
    color: "from-blue-400 to-cyan-300",
    icon: "💠",
    prompt: "科技初创公司的极简主义 Logo，几何形状，线条简洁，负空间运用，矢量风格。"
  },
  {
    id: 3,
    title: "复古胶片人像",
    author: "AnalogSoul",
    category: "摄影",
    color: "from-orange-400 to-amber-200",
    icon: "🎞️",
    prompt: "1970年代时尚服饰的女性肖像，柯达 Portra 400 胶片拍摄，暖色调。"
  },
  {
    id: 4,
    title: "3D 等距游戏房间",
    author: "VoxelMaster",
    category: "3D",
    color: "from-emerald-400 to-green-300",
    icon: "🏠",
    prompt: "温馨游戏房间的等距视角，低多边形 3D 渲染，柔和的粉彩灯光。"
  }
];

const App: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [view, setView] = useState<'landing' | 'privacy'>('landing');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Reset scroll when view changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  if (view === 'privacy') {
    return <Privacy onBack={() => setView('landing')} />;
  }

  return (
    <div className="min-h-screen relative bg-[#FDFDFD] text-zinc-900 selection:bg-yellow-200 selection:text-yellow-900 font-sans overflow-x-hidden">
      
      {/* --- Ambient Background --- */}
      <div className="fixed top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-yellow-200/30 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse-slow" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-blue-100/40 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* --- Navbar --- */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-white/80 backdrop-blur-xl border-b border-zinc-100 py-3' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div 
            className="flex items-center gap-2 group cursor-pointer select-none"
            onClick={() => setView('landing')}
          >
            <div className="text-2xl transition-transform duration-500 group-hover:rotate-12 filter drop-shadow-sm">🍌</div>
            <span className="font-bold text-lg tracking-tight text-zinc-900">Banana Verse</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a 
              href="https://github.com/g1thubX/nano-banana-verse-tool" 
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-lg shadow-zinc-200/50 hover:shadow-zinc-300/50 hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm"
            >
              <Github size={16} />
              <span>获取插件</span>
            </a>
          </div>

          <button className="md:hidden p-2 text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors">
            <Menu size={24} />
          </button>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <section className="pt-40 pb-20 px-6 relative">
        <div className="max-w-6xl mx-auto text-center">
          
          {/* Version Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-zinc-200 shadow-sm hover:border-yellow-300 transition-colors cursor-default mb-8 animate-fade-in-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs font-semibold text-zinc-600">v1.5.0 现已发布</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-zinc-900 mb-8 leading-[1.1] text-balance">
            灵感万千， <br className="hidden md:block" />
            一 <span className="relative inline-block mx-2">
              <span className="relative z-10">🍌</span>
              <span className="absolute inset-0 bg-yellow-300/60 blur-2xl rounded-full -z-10"></span>
            </span> 搞定。
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-500 mb-12 max-w-2xl mx-auto leading-relaxed text-balance">
            专为 AI 创作者打造的终极浏览器扩展。发现、管理并将高质量 Prompt 直接注入 Gemeni。
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-24">
            <button className="w-full sm:w-auto px-8 py-4 bg-zinc-900 text-white rounded-2xl font-bold shadow-xl shadow-zinc-900/10 hover:shadow-2xl hover:shadow-zinc-900/20 hover:-translate-y-1 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2 group">
              <span>安装到 Chrome</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* --- Extension Preview (Image Based) --- */}
          <div className="relative w-full max-w-[800px] mx-auto perspective-[2000px]">
             
             {/* Glass Card Container */}
             <div className="glass-panel relative rounded-2xl p-2 md:p-3 transform transition-transform hover:rotate-x-1 duration-700 shadow-2xl shadow-blue-900/5 ring-1 ring-white/60 bg-gradient-to-b from-white/80 to-white/40 backdrop-blur-xl">
                
                {/* Browser Top Bar Mockup */}
                <div className="h-8 flex items-center px-4 gap-2 bg-white/80 rounded-t-xl border-b border-zinc-100/50 mb-1">
                   <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400/80"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-green-400/80"></div>
                   </div>
                   <div className="ml-4 flex-1 bg-zinc-100/50 h-5 rounded-md flex items-center px-2">
                      <span className="text-[10px] text-zinc-400">banana-verse://extension</span>
                   </div>
                </div>

                {/* Actual Image Container */}
                <div className="bg-zinc-50 rounded-b-xl overflow-hidden border border-zinc-100 min-h-[400px] flex items-center justify-center relative">
                    
                    {/* Loading State */}
                    {!imageLoaded && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-300/80 gap-3">
                             <div className="w-8 h-8 border-2 border-zinc-200 border-t-yellow-400 rounded-full animate-spin"></div>
                             <span className="text-xs font-medium tracking-wide text-zinc-400">LOADING PREVIEW...</span>
                        </div>
                    )}

                    <img 
                        src="./ext.png" 
                        alt="Banana Verse Extension Interface" 
                        className={`w-full h-auto object-cover transition-opacity duration-700 ease-in-out ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                        onLoad={() => setImageLoaded(true)}
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null; 
                            // Fallback content
                            const parent = target.parentElement;
                            if (parent) {
                                parent.innerHTML = `
                                <div class="flex flex-col items-center justify-center p-20 text-zinc-300 gap-3 text-center select-none">
                                    <div class="text-5xl opacity-30 grayscale filter">🍌</div>
                                    <span class="text-xs font-medium opacity-60">Preview not available</span>
                                </div>`;
                            }
                        }}
                    />
                </div>
             </div>

             {/* Floating Elements */}
             <div className="absolute -left-8 top-32 bg-white/90 backdrop-blur p-3 rounded-xl shadow-xl border border-zinc-50 hidden lg:flex items-center gap-3 animate-bounce-slow z-20">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <Zap size={16} fill="currentColor" />
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-800">一键注入</div>
                  <div className="text-[10px] text-zinc-400">Gemini Ready</div>
                </div>
             </div>

             <div className="absolute -right-6 bottom-40 bg-white/90 backdrop-blur p-3 rounded-xl shadow-xl border border-zinc-50 hidden lg:flex items-center gap-3 animate-bounce-slow z-20" style={{ animationDelay: '1.5s' }}>
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <Command size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-800">右键菜单</div>
                  <div className="text-[10px] text-zinc-400">极速调用</div>
                </div>
             </div>

          </div>
        </div>
      </section>

      {/* --- Features Section --- */}
      <section id="features" className="py-32 px-6 relative">
        <div className="max-w-7xl mx-auto">
           <div className="text-center mb-20">
              <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-4">优雅，不仅仅是外表。</h2>
              <p className="text-zinc-500 max-w-2xl mx-auto">强大的功能隐藏在极简的界面之下，让你的 AI 创作流畅无阻。</p>
           </div>

           <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: <Zap className="w-6 h-6 text-yellow-500" />, title: "闪电注入", desc: "告别复制粘贴。只需轻轻一点，Prompt 即可飞入 Gemini 输入框。" },
                { icon: <Grid className="w-6 h-6 text-blue-500" />, title: "可视化管理", desc: "所见即所得。用精美的图片卡片管理你的 Prompt，而非枯燥的文字列表。" },
                { icon: <Copy className="w-6 h-6 text-green-500" />, title: "一键复制", desc: "无论是复杂的参数还是简单的指令，精准复制，格式完美保留。" }
              ].map((feature, i) => (
                <div key={i} className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm hover:shadow-xl hover:shadow-zinc-200/50 transition-all duration-300 group">
                   <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-zinc-100">
                      {feature.icon}
                   </div>
                   <h3 className="text-lg font-bold text-zinc-900 mb-3">{feature.title}</h3>
                   <p className="text-sm text-zinc-500 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* --- Gallery Showcase --- */}
      <section id="gallery" className="py-24 px-6 bg-zinc-50/50 border-t border-zinc-100">
         <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-end mb-12">
               <div>
                 <h2 className="text-3xl font-bold text-zinc-900 mb-2">灵感图库</h2>
                 <p className="text-zinc-500 text-sm">探索社区精选的高质量 Prompt。</p>
               </div>
               <a href="#" className="text-sm font-medium text-zinc-900 flex items-center gap-1 hover:gap-2 transition-all">
                 查看全部 <ArrowRight size={14} />
               </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
               {LANDING_PROMPTS.map((prompt) => (
                 <div key={prompt.id} className="group bg-white rounded-2xl border border-zinc-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                    <div className={`aspect-[4/3] bg-gradient-to-br ${prompt.color} flex items-center justify-center text-4xl relative overflow-hidden`}>
                       <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                       <span className="group-hover:scale-110 transition-transform duration-300">{prompt.icon}</span>
                    </div>
                    <div className="p-4">
                       <div className="flex justify-between items-start mb-2">
                          <span className="px-2 py-1 bg-zinc-50 text-zinc-500 text-[10px] font-medium rounded-md border border-zinc-100">{prompt.category}</span>
                          <button className="text-zinc-300 hover:text-red-500 transition-colors"><Heart size={14} /></button>
                       </div>
                       <h3 className="font-bold text-zinc-900 text-sm mb-1 line-clamp-1">{prompt.title}</h3>
                       <p className="text-xs text-zinc-400 line-clamp-2 mb-4">{prompt.prompt}</p>
                       <div className="flex items-center justify-between pt-3 border-t border-zinc-50">
                          <div className="flex items-center gap-1.5">
                             <div className="w-5 h-5 rounded-full bg-zinc-100 flex items-center justify-center text-[8px] font-bold text-zinc-500">
                                {prompt.author[0]}
                             </div>
                             <span className="text-[10px] text-zinc-400">{prompt.author}</span>
                          </div>
                          <button className="text-zinc-400 hover:text-zinc-900 transition-colors">
                             <Copy size={12} />
                          </button>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </section>

      {/* --- CTA --- */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto bg-[#111] rounded-[2.5rem] p-12 md:p-24 text-center relative overflow-hidden">
           {/* Abstract Shapes */}
           <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
              <div className="absolute top-[-50%] left-[-20%] w-[500px] h-[500px] bg-gradient-to-br from-yellow-500/20 to-transparent rounded-full blur-[100px]" />
              <div className="absolute bottom-[-50%] right-[-20%] w-[500px] h-[500px] bg-gradient-to-tl from-blue-500/20 to-transparent rounded-full blur-[100px]" />
           </div>

           <div className="relative z-10">
             <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 tracking-tight">准备好升级你的工作流了吗？</h2>
             <p className="text-zinc-400 text-lg mb-10 max-w-xl mx-auto">加入 Banana Verse，让 AI 创作变得前所未有的简单和优雅。</p>
             <div className="flex justify-center gap-4">
               <a href="https://github.com/g1thubX/nano-banana-verse-tool" target="_blank" rel="noreferrer" className="px-8 py-4 bg-white text-black rounded-xl font-bold hover:bg-zinc-100 transition-colors flex items-center gap-2">
                  <Github size={20} />
                  <span>GitHub 下载</span>
               </a>
             </div>
           </div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="py-12 border-t border-zinc-100 bg-white">
         <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2 opacity-80">
               <span className="text-xl">🍌</span>
               <span className="font-bold text-zinc-900">Banana Verse</span>
            </div>
            <div className="flex gap-6 text-sm text-zinc-500">
               <button onClick={() => setView('privacy')} className="hover:text-zinc-900 transition-colors text-left">
                 隐私政策
               </button>
               <a href="https://github.com/g1thubX/nano-banana-verse-tool" className="hover:text-zinc-900 transition-colors">GitHub</a>
            </div>
            <div className="text-xs text-zinc-400">
               © 2024 Banana Verse. All rights reserved.
            </div>
         </div>
      </footer>

      <style>{`
        .glass-panel {
          background: rgba(255, 255, 255, 0.65);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }
        .animate-bounce-slow {
          animation: bounce 3s infinite;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(-5%); }
          50% { transform: translateY(5%); }
        }
        .animate-pulse-slow {
          animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default App;