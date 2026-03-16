import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Palette, 
  Box as BoxIcon, 
  MessageSquare, 
  Settings, 
  LogOut, 
  Plus, 
  Search, 
  Bell,
  Home,
  Camera,
  Layers,
  ShoppingBag,
  History,
  Menu,
  X,
  Sparkles,
  ChevronRight,
  Upload,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, signIn, logOut, db } from './lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { cn } from './lib/utils';
import { ThreeDPlanner } from './components/ThreeDPlanner';
import { geminiService } from './services/geminiService';
import { collection, addDoc, query, where, onSnapshot, orderBy } from 'firebase/firestore';

// --- Types ---
type Page = 'dashboard' | 'designer' | 'planner' | 'catalog' | 'chat';

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200 group",
      active 
        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
        : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
    )}
  >
    <Icon size={20} className={cn("transition-transform duration-200", active ? "scale-110" : "group-hover:scale-110")} />
    <span className="font-medium">{label}</span>
  </button>
);

const Card = ({ children, className, title, subtitle, action }: any) => (
  <div className={cn("bg-white rounded-2xl border border-slate-200 p-6 shadow-sm", className)}>
    {(title || action) && (
      <div className="flex items-center justify-between mb-6">
        <div>
          {title && <h3 className="text-lg font-semibold text-slate-900">{title}</h3>}
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
        {action}
      </div>
    )}
    {children}
  </div>
);

// --- Main App ---

export default function App() {
  const [user, loading] = useAuthState(auth);
  const [activePage, setActivePage] = useState<Page>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);

  // Designer State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDesigning, setIsDesigning] = useState(false);
  const [designResult, setDesignResult] = useState<any>(null);
  const [selectedStyle, setSelectedStyle] = useState('Modern');

  // Chat State
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);

  const [showOriginal, setShowOriginal] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'projects'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, [user]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const startDesign = async () => {
    if (!selectedImage) return;
    setIsDesigning(true);
    try {
      const result = await geminiService.generateRoomDesign(selectedImage, selectedStyle);
      setDesignResult(result);
      
      // Save to Firebase
      if (user) {
        await addDoc(collection(db, 'projects'), {
          userId: user.uid,
          name: `New ${selectedStyle} Room`,
          style: selectedStyle,
          originalImageUrl: selectedImage,
          designData: result,
          createdAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsDesigning(false);
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    try {
      const aiMsg = await geminiService.chatWithDesigner(userMsg);
      setChatMessages(prev => [...prev, { role: 'ai', text: aiMsg }]);
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
    </div>
  );

  if (!user) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center space-y-8"
      >
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/30">
            <Home className="text-white" size={40} />
          </div>
        </div>
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">DecorAI</h1>
          <p className="mt-2 text-slate-500 text-lg">Professional AI Interior Design Studio</p>
        </div>
        <button
          onClick={signIn}
          className="w-full py-4 px-6 bg-slate-900 text-white rounded-2xl font-semibold flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20"
        >
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
          Continue with Google
        </button>
        <p className="text-sm text-slate-400">Transform your space with the power of AI</p>
      </motion.div>
    </div>
  );

  return (
    <div className="h-screen w-full bg-slate-50 flex overflow-hidden font-sans">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="bg-white border-r border-slate-200 flex flex-col h-full z-50"
      >
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
            <Home className="text-white" size={20} />
          </div>
          {isSidebarOpen && <span className="text-xl font-bold text-slate-900 tracking-tight">DecorAI</span>}
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activePage === 'dashboard'} onClick={() => setActivePage('dashboard')} />
          <SidebarItem icon={Sparkles} label="AI Designer" active={activePage === 'designer'} onClick={() => setActivePage('designer')} />
          <SidebarItem icon={Layers} label="3D Planner" active={activePage === 'planner'} onClick={() => setActivePage('planner')} />
          <SidebarItem icon={ShoppingBag} label="Catalog" active={activePage === 'catalog'} onClick={() => setActivePage('catalog')} />
          <SidebarItem icon={MessageSquare} label="AI Chat" active={activePage === 'chat'} onClick={() => setActivePage('chat')} />
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 mb-4">
            <img src={user.photoURL || ''} className="w-10 h-10 rounded-lg" alt="User" />
            {isSidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{user.displayName}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
            )}
          </div>
          <button
            onClick={logOut}
            className="flex items-center gap-3 w-full px-4 py-3 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span className="font-medium">Sign Out</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
              <Menu size={20} />
            </button>
            <h2 className="text-xl font-semibold text-slate-900 capitalize">{activePage}</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search designs..." 
                className="pl-10 pr-4 py-2 bg-slate-100 border-transparent focus:bg-white focus:border-emerald-500 rounded-xl text-sm w-64 transition-all outline-none"
              />
            </div>
            <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            {activePage === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="bg-emerald-500 text-white border-none" title="Total Projects" action={<Plus className="cursor-pointer" />}>
                    <p className="text-4xl font-bold">{projects.length}</p>
                    <p className="text-emerald-100 mt-1">Active designs in your studio</p>
                  </Card>
                  <Card title="Recent Activity" subtitle="Your latest design updates">
                    <div className="space-y-4">
                      {projects.slice(0, 3).map(p => (
                        <div key={p.id} className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                            <Home size={18} className="text-slate-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">{p.name}</p>
                            <p className="text-xs text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                  <Card title="Style Insights" subtitle="Based on your preferences">
                    <div className="flex flex-wrap gap-2">
                      {['Modern', 'Scandinavian', 'Industrial'].map(s => (
                        <span key={s} className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-medium">{s}</span>
                      ))}
                    </div>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <Card title="My Projects" action={<button className="text-emerald-500 text-sm font-medium hover:underline">View All</button>}>
                    <div className="grid grid-cols-2 gap-4">
                      {projects.map(p => (
                        <div key={p.id} className="group cursor-pointer">
                          <div className="aspect-video rounded-xl bg-slate-100 overflow-hidden relative mb-2">
                            <img src={p.originalImageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={p.name} />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <ArrowRight className="text-white" size={24} />
                            </div>
                          </div>
                          <p className="text-sm font-semibold text-slate-900">{p.name}</p>
                          <p className="text-xs text-slate-500">{p.style}</p>
                        </div>
                      ))}
                      {projects.length === 0 && (
                        <div className="col-span-2 py-12 text-center space-y-4">
                          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                            <Plus className="text-slate-400" />
                          </div>
                          <p className="text-slate-500">No projects yet. Start your first design!</p>
                          <button 
                            onClick={() => setActivePage('designer')}
                            className="px-6 py-2 bg-emerald-500 text-white rounded-xl font-medium"
                          >
                            Create Project
                          </button>
                        </div>
                      )}
                    </div>
                  </Card>
                  <Card title="Inspiration Feed" subtitle="Trending styles this week">
                    <div className="grid grid-cols-2 gap-4">
                      {[1, 2, 3, 4].map(i => (
                        <img key={i} src={`https://picsum.photos/seed/interior${i}/400/300`} className="rounded-xl aspect-video object-cover" alt="Inspiration" />
                      ))}
                    </div>
                  </Card>
                </div>
              </motion.div>
            )}

            {activePage === 'designer' && (
              <motion.div
                key="designer"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-5xl mx-auto space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900">AI Room Designer</h1>
                    <p className="text-slate-500">Upload a photo and let AI transform your space</p>
                  </div>
                  <div className="flex gap-3">
                    <select 
                      value={selectedStyle}
                      onChange={(e) => setSelectedStyle(e.target.value)}
                      className="px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-500"
                    >
                      {['Modern', 'Minimalist', 'Scandinavian', 'Japanese', 'Industrial', 'Luxury', 'Bohemian', 'Traditional', 'Indian'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <button 
                      onClick={startDesign}
                      disabled={!selectedImage || isDesigning}
                      className="px-6 py-2 bg-emerald-500 text-white rounded-xl font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
                    >
                      {isDesigning ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles size={18} />}
                      Generate Design
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div 
                      className={cn(
                        "aspect-[4/3] rounded-3xl border-2 border-dashed flex flex-col items-center justify-center relative overflow-hidden transition-all",
                        selectedImage ? "border-emerald-500 bg-white" : "border-slate-300 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50/30"
                      )}
                    >
                      {selectedImage ? (
                        <>
                          <img src={selectedImage} className={cn("w-full h-full object-cover transition-all duration-500", showOriginal ? "" : "brightness-110 contrast-110 saturate-110")} alt="Selected" />
                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-white/90 backdrop-blur p-1 rounded-full shadow-lg">
                            <button 
                              onClick={() => setShowOriginal(true)}
                              className={cn("px-4 py-1.5 rounded-full text-xs font-bold transition-all", showOriginal ? "bg-slate-900 text-white" : "text-slate-500")}
                            >
                              Before
                            </button>
                            <button 
                              onClick={() => setShowOriginal(false)}
                              className={cn("px-4 py-1.5 rounded-full text-xs font-bold transition-all", !showOriginal ? "bg-emerald-500 text-white" : "text-slate-500")}
                            >
                              After
                            </button>
                          </div>
                          <button 
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur rounded-full shadow-lg text-slate-600 hover:text-red-500 transition-colors"
                          >
                            <X size={20} />
                          </button>
                        </>
                      ) : (
                        <label className="cursor-pointer flex flex-col items-center gap-4 p-8 text-center">
                          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                            <Upload className="text-emerald-500" size={32} />
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-slate-900">Upload Room Photo</p>
                            <p className="text-sm text-slate-500 mt-1">Drag and drop or click to browse</p>
                          </div>
                          <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    {designResult ? (
                      <Card title="AI Recommendations" className="h-full">
                        <div className="space-y-6">
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Color Palette</h4>
                            <div className="flex gap-2">
                              {designResult.colorPalette?.map((c: string) => (
                                <div key={c} className="w-10 h-10 rounded-lg shadow-inner border border-black/5" style={{ backgroundColor: c }} title={c} />
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Furniture Suggestions</h4>
                            <div className="space-y-3">
                              {designResult.furnitureList?.map((f: any, i: number) => (
                                <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                  <p className="font-semibold text-slate-900 text-sm">{f.item}</p>
                                  <p className="text-xs text-slate-500 mt-0.5">{f.description}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-1">Walls</h4>
                              <p className="text-xs text-slate-500">{designResult.wallSuggestions}</p>
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-1">Flooring</h4>
                              <p className="text-xs text-slate-500">{designResult.flooringSuggestions}</p>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white rounded-3xl border border-slate-200 border-dashed">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                          <Sparkles className="text-slate-300" size={40} />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900">Ready to Transform?</h3>
                        <p className="text-slate-500 mt-2 max-w-xs">Upload a photo and select a style to see AI-powered design suggestions.</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activePage === 'planner' && (
              <motion.div
                key="planner"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col gap-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900">3D Floor Planner</h1>
                    <p className="text-slate-500">Design your room layout in interactive 3D</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50">2D View</button>
                    <button className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium">3D View</button>
                  </div>
                </div>
                <div className="flex-1 min-h-0 flex gap-6">
                  <div className="w-64 shrink-0 space-y-4">
                    <Card title="Elements">
                      <div className="grid grid-cols-2 gap-2">
                        {['Wall', 'Window', 'Door', 'Sofa', 'Table', 'Bed'].map(e => (
                          <button key={e} className="p-3 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl text-xs font-semibold transition-colors flex flex-col items-center gap-2">
                            <BoxIcon size={20} />
                            {e}
                          </button>
                        ))}
                      </div>
                    </Card>
                    <Card title="Properties">
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-bold text-slate-400 uppercase">Room Size</label>
                          <input type="range" className="w-full mt-2 accent-emerald-500" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-400 uppercase">Wall Color</label>
                          <div className="flex gap-2 mt-2">
                            {['#ffffff', '#f1f5f9', '#e2e8f0', '#cbd5e1'].map(c => (
                              <button key={c} className="w-6 h-6 rounded-full border border-slate-200" style={{ backgroundColor: c }} />
                            ))}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                  <div className="flex-1 relative">
                    <ThreeDPlanner />
                    <div className="absolute bottom-6 left-6 flex gap-2">
                      <button className="p-3 bg-white/90 backdrop-blur rounded-xl shadow-lg text-slate-600 hover:text-emerald-500"><Camera size={20} /></button>
                      <button className="p-3 bg-white/90 backdrop-blur rounded-xl shadow-lg text-slate-600 hover:text-emerald-500"><Plus size={20} /></button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activePage === 'chat' && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="h-full max-w-4xl mx-auto flex flex-col"
              >
                <Card className="flex-1 flex flex-col min-h-0 p-0 overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                      <MessageSquare className="text-white" size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">AI Interior Designer</h3>
                      <p className="text-sm text-emerald-500 font-medium">Online & Ready to help</p>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {chatMessages.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                          <Sparkles className="text-slate-300" size={32} />
                        </div>
                        <h4 className="text-lg font-semibold text-slate-900">Ask your AI Designer</h4>
                        <p className="text-slate-500 max-w-xs">Get advice on styles, furniture, color palettes, and more.</p>
                        <div className="flex flex-wrap justify-center gap-2">
                          {["Modern living room ideas", "Small bedroom layout", "Best colors for office"].map(q => (
                            <button 
                              key={q}
                              onClick={() => { setChatInput(q); }}
                              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-full text-xs font-medium text-slate-600 transition-colors"
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {chatMessages.map((m, i) => (
                      <div key={i} className={cn("flex", m.role === 'user' ? "justify-end" : "justify-start")}>
                        <div className={cn(
                          "max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed",
                          m.role === 'user' 
                            ? "bg-emerald-500 text-white rounded-tr-none shadow-lg shadow-emerald-500/20" 
                            : "bg-slate-100 text-slate-800 rounded-tl-none"
                        )}>
                          {m.text}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-6 border-t border-slate-100">
                    <div className="flex gap-3">
                      <input 
                        type="text" 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleChat()}
                        placeholder="Type your message..." 
                        className="flex-1 px-6 py-4 bg-slate-100 border-transparent focus:bg-white focus:border-emerald-500 rounded-2xl outline-none transition-all"
                      />
                      <button 
                        onClick={handleChat}
                        className="p-4 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                      >
                        <ArrowRight size={24} />
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {activePage === 'catalog' && (
              <motion.div
                key="catalog"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900">Furniture Catalog</h1>
                    <p className="text-slate-500">Browse curated items from top stores</p>
                  </div>
                  <div className="flex gap-3">
                    <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium flex items-center gap-2">
                      <Palette size={18} />
                      Filters
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                    <Card key={i} className="p-0 overflow-hidden group">
                      <div className="aspect-square bg-slate-100 relative overflow-hidden">
                        <img src={`https://picsum.photos/seed/furniture${i}/400/400`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Furniture" />
                        <div className="absolute top-3 right-3">
                          <button className="p-2 bg-white/90 backdrop-blur rounded-full shadow-sm text-slate-400 hover:text-emerald-500"><Plus size={18} /></button>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-bold text-slate-900">Modern Sofa {i}</h4>
                          <span className="text-emerald-600 font-bold">$1,299</span>
                        </div>
                        <p className="text-xs text-slate-500">IKEA • 200x90x80 cm</p>
                        <button className="w-full mt-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors">View in 3D</button>
                      </div>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
