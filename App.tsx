
import React, { useState, useRef, useEffect } from 'react';
import { 
  Car, 
  Search, 
  Camera, 
  MessageSquare, 
  Settings, 
  History, 
  ChevronLeft, 
  Send,
  Upload,
  Cpu,
  Zap,
  ShieldCheck,
  Fuel,
  Info,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { getGeminiResponse, getComparisonTable } from './geminiService';
import { ChatMessage, ComparisonData } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'compare' | 'analyze'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: 'مرحباً بك في عالم السيارات! أنا خبيرك الشخصي. كيف يمكنني مساعدتك اليوم؟ يمكنك سؤالي عن مواصفات، مقارنات، أو حتى رفع صورة لسيارة للتعرف عليها.',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [carImage, setCarImage] = useState<string | null>(null);
  
  // Comparison state
  const [compareInputs, setCompareInputs] = useState({ car1: '', car2: '' });
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSendMessage = async (text?: string, image?: string) => {
    const content = text || inputValue;
    if (!content && !image) return;

    const userMsg: ChatMessage = {
      role: 'user',
      text: content,
      image,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setCarImage(null);
    setIsTyping(true);

    try {
      const response = await getGeminiResponse(content, image);
      const modelMsg: ChatMessage = {
        role: 'model',
        text: response.text,
        groundingLinks: response.links,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        role: 'model',
        text: 'عذراً، حدث خطأ أثناء معالجة طلبك. حاول مرة أخرى.',
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCarImage(reader.result as string);
        setActiveTab('chat');
      };
      reader.readAsDataURL(file);
    }
  };

  const runComparison = async () => {
    if (!compareInputs.car1 || !compareInputs.car2) return;
    setIsComparing(true);
    try {
      const data = await getComparisonTable(compareInputs.car1, compareInputs.car2);
      setComparisonData(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20">
            <Car className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">خبير السيارات <span className="text-blue-500">Expert</span></h1>
        </div>
        <div className="flex gap-4">
          <button className="p-2 hover:bg-slate-800 rounded-full transition-colors">
            <Settings className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Navigation Sidebar */}
        <nav className="w-full md:w-20 bg-slate-900 border-b md:border-b-0 md:border-l border-slate-800 flex md:flex-col items-center justify-around md:justify-start py-2 md:py-8 gap-6 z-10">
          <NavIcon 
            active={activeTab === 'chat'} 
            onClick={() => setActiveTab('chat')} 
            icon={<MessageSquare />} 
            label="محادثة" 
          />
          <NavIcon 
            active={activeTab === 'compare'} 
            onClick={() => setActiveTab('compare')} 
            icon={<History />} 
            label="مقارنة" 
          />
          <NavIcon 
            active={activeTab === 'analyze'} 
            onClick={() => setActiveTab('analyze')} 
            icon={<Camera />} 
            label="تحليل" 
          />
        </nav>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-950 to-slate-900 p-4 md:p-6" ref={scrollRef}>
          {activeTab === 'chat' && (
            <div className="max-w-4xl mx-auto space-y-6 pb-24">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'
                  }`}>
                    {msg.image && (
                      <img src={msg.image} alt="Uploaded" className="w-full max-h-64 object-cover rounded-lg mb-3" />
                    )}
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    {msg.groundingLinks && msg.groundingLinks.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-700/50 space-y-2">
                        <p className="text-xs text-slate-400 font-medium">المصادر المعتمدة:</p>
                        {msg.groundingLinks.map((link, i) => (
                          <a 
                            key={i} 
                            href={link.uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {link.title}
                          </a>
                        ))}
                      </div>
                    )}
                    <span className="block text-[10px] mt-2 opacity-60 text-left">
                      {msg.timestamp.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-end">
                  <div className="bg-slate-800 p-4 rounded-2xl rounded-tl-none border border-slate-700">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-.3s]"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-.5s]"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'compare' && (
            <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold">مقارنة المواصفات</h2>
                <p className="text-slate-400">أدخل طرازي السيارات للحصول على مقارنة تقنية شاملة</p>
              </div>

              <div className="grid md:grid-cols-[1fr,auto,1fr] gap-4 items-center bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">السيارة الأولى</label>
                  <input 
                    type="text" 
                    placeholder="مثال: تويوتا كامري 2024"
                    className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={compareInputs.car1}
                    onChange={(e) => setCompareInputs(prev => ({ ...prev, car1: e.target.value }))}
                  />
                </div>
                <div className="hidden md:flex flex-col items-center justify-center p-4">
                  <div className="h-full w-px bg-slate-800 mb-2"></div>
                  <span className="text-slate-500 font-bold px-2 py-1 bg-slate-800 rounded text-xs">VS</span>
                  <div className="h-full w-px bg-slate-800 mt-2"></div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">السيارة الثانية</label>
                  <input 
                    type="text" 
                    placeholder="مثال: هوندا أكورد 2024"
                    className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={compareInputs.car2}
                    onChange={(e) => setCompareInputs(prev => ({ ...prev, car2: e.target.value }))}
                  />
                </div>
                <div className="md:col-span-3 mt-4">
                  <button 
                    onClick={runComparison}
                    disabled={isComparing || !compareInputs.car1 || !compareInputs.car2}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    {isComparing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                    بدء المقارنة الفنية
                  </button>
                </div>
              </div>

              {comparisonData && (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl transition-all animate-in zoom-in-95">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-800/50">
                        <th className="p-4 text-blue-400 font-bold border-b border-slate-800 w-1/3">الميزة</th>
                        <th className="p-4 font-bold border-b border-slate-800 text-center">{comparisonData.car1.name}</th>
                        <th className="p-4 font-bold border-b border-slate-800 text-center">{comparisonData.car2.name}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonData.features.map((feature, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/30 transition-colors border-b border-slate-800/50 last:border-0">
                          <td className="p-4 text-sm font-medium text-slate-400">{feature}</td>
                          <td className="p-4 text-sm text-center">{comparisonData.car1.specs[feature] || '-'}</td>
                          <td className="p-4 text-sm text-center">{comparisonData.car2.specs[feature] || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'analyze' && (
            <div className="max-w-2xl mx-auto space-y-8 py-10">
              <div className="text-center space-y-4">
                <div className="inline-block p-4 bg-blue-500/10 rounded-full mb-2">
                  <Camera className="w-12 h-12 text-blue-500" />
                </div>
                <h2 className="text-3xl font-bold">تعرف على سيارتك</h2>
                <p className="text-slate-400">التقط صورة أو ارفع صورة لسيارة ليتعرف عليها خبيرنا فوراً</p>
              </div>

              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <label className="relative flex flex-col items-center justify-center w-full h-80 bg-slate-900 border-2 border-dashed border-slate-700 rounded-2xl cursor-pointer hover:border-blue-500/50 transition-all overflow-hidden">
                  {carImage ? (
                    <div className="relative w-full h-full group">
                      <img src={carImage} alt="Car to analyze" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white font-bold bg-blue-600 px-4 py-2 rounded-lg">تغيير الصورة</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-12 h-12 text-slate-500 mb-4" />
                      <p className="mb-2 text-sm text-slate-400 font-semibold">اضغط هنا لرفع الصورة</p>
                      <p className="text-xs text-slate-500">PNG, JPG أو GIF (بحد أقصى 10MB)</p>
                    </div>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
              </div>

              {carImage && (
                <button 
                  onClick={() => handleSendMessage("حلل هذه السيارة بالتفصيل، ما نوعها؟ وما هي أبرز مميزاتها وعيوبها؟", carImage)}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl font-bold text-white shadow-xl hover:shadow-blue-500/20 transform hover:-translate-y-1 transition-all"
                >
                  بدء التحليل الآن
                </button>
              )}

              <div className="grid grid-cols-2 gap-4">
                <FeatureCard icon={<Zap />} title="سرعة التحليل" desc="نتائج في ثوانٍ معدودة" />
                <FeatureCard icon={<Cpu />} title="ذكاء اصطناعي" desc="أحدث موديلات Gemini" />
              </div>
            </div>
          )}
        </div>

        {/* Input Area (Sticky Bottom for Chat) */}
        {activeTab === 'chat' && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent">
            <div className="max-w-4xl mx-auto flex items-center gap-3 bg-slate-900 border border-slate-700 p-2 pl-4 pr-2 rounded-2xl shadow-2xl">
              <div className="flex gap-1">
                 <button 
                  onClick={() => document.getElementById('camera-upload')?.click()}
                  className="p-3 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-blue-400"
                >
                  <Camera className="w-5 h-5" />
                  <input id="camera-upload" type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </button>
              </div>
              <input 
                type="text" 
                placeholder="اسألني أي شيء عن السيارات..."
                className="flex-1 bg-transparent border-none outline-none py-3 px-2 text-slate-100 placeholder:text-slate-500 text-sm md:text-base"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button 
                onClick={() => handleSendMessage()}
                disabled={isTyping || (!inputValue && !carImage)}
                className="bg-blue-600 hover:bg-blue-500 p-3 rounded-xl transition-all disabled:opacity-50 disabled:hover:bg-blue-600 shadow-lg shadow-blue-500/30"
              >
                <Send className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Visual background element */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>
    </div>
  );
};

// Helper Components
const NavIcon: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all group ${active ? 'bg-blue-600/10 text-blue-500' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}
  >
    <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-105'}`}>
      {React.cloneElement(icon as React.ReactElement, { size: 24 })}
    </div>
    <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
  </button>
);

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; desc: string }> = ({ icon, title, desc }) => (
  <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex items-start gap-3">
    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
      {icon}
    </div>
    <div>
      <h4 className="text-sm font-bold text-slate-200">{title}</h4>
      <p className="text-xs text-slate-500 mt-1">{desc}</p>
    </div>
  </div>
);

export default App;
