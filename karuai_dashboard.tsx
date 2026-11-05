'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, AtSign, Download, Edit2, ChevronLeft, ChevronRight, 
  Plus, Bot, Send, Mail, Lock, User, Cookie
} from 'lucide-react';

// --- Reusable SVG Icons ---
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const KaruLogo = () => (
  <div className="flex items-center gap-2 mb-6 justify-center">
    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
      <Bot className="text-white" size={24} />
    </div>
    <span className="text-2xl font-bold tracking-tight text-slate-900">KaruAI</span>
  </div>
);

// --- Sub-components (Screens) ---

const LoginScreen = ({ onNavigate }) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
    <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
      <KaruLogo />
      <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">Welcome back</h2>
      
      <div className="space-y-4">
        <div className="relative">
          <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
          <input 
            type="email" 
            placeholder="Email address" 
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
          <input 
            type="password" 
            placeholder="Password" 
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>
        
        <div className="flex justify-end">
          <a href="#" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">Forgot password?</a>
        </div>
        
        <button 
          onClick={() => onNavigate('dashboard')}
          className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
        >
          Log In
        </button>
        
        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-4 text-sm text-gray-500 font-medium">OR</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>
        
        <button className="w-full bg-white border border-gray-300 text-slate-700 font-semibold py-3 rounded-lg flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors">
          <GoogleIcon />
          Continue with Google
        </button>
      </div>
      
      <p className="mt-8 text-center text-gray-600 text-sm">
        Don't have an account? <button onClick={() => onNavigate('register')} className="text-indigo-600 font-medium hover:underline">Sign up</button>
      </p>
    </div>
  </div>
);

const RegisterScreen = ({ onNavigate }) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
    <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
      <KaruLogo />
      <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">Create an account</h2>
      
      <div className="space-y-4">
        <div className="relative">
          <User className="absolute left-3 top-3 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Full Name" 
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>
        <div className="relative">
          <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
          <input 
            type="email" 
            placeholder="Email address" 
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
          <input 
            type="password" 
            placeholder="Password" 
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
          <input 
            type="password" 
            placeholder="Confirm Password" 
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>
        
        <button 
          onClick={() => onNavigate('dashboard')}
          className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 transition-colors shadow-md mt-2"
        >
          Sign Up
        </button>
      </div>
      
      <p className="mt-8 text-center text-gray-600 text-sm">
        Already have an account? <button onClick={() => onNavigate('login')} className="text-indigo-600 font-medium hover:underline">Log in</button>
      </p>
    </div>
  </div>
);

type ChatMessage = {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  status?: 'loading' | 'error';
};

type KaruResponse = {
  responseText: string;
  currentRequestTokens: number;
  totalConversationTokens: number;
};

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const TypingIndicator = () => (
  <div className="flex items-center gap-1 py-1" aria-label="KaruAI is typing">
    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.3s]"></span>
    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.15s]"></span>
    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></span>
  </div>
);

const DashboardScreen = ({ onNavigate }: { onNavigate: (view: string) => void }) => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Keep the newest message in view
  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
  }, [chatMessages]);

  const handleSendMessage = async () => {
    const text = chatInput.trim();
    if (!text || isSending) return;

    const loadingId = createId();
    setChatMessages(prev => [
      ...prev,
      { id: createId(), sender: 'user', text },
      { id: loadingId, sender: 'ai', text: '', status: 'loading' },
    ]);
    setChatInput('');
    setIsSending(true);

    let reply: ChatMessage;
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || `Request failed with status ${res.status}`);
      }

      reply = { id: createId(), sender: 'ai', text: (data as KaruResponse).responseText };
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown error';
      reply = { id: createId(), sender: 'ai', text: `Sorry, something went wrong: ${reason}`, status: 'error' };
    } finally {
      setIsSending(false);
    }

    // Swap the loading bubble for the real reply (or the error)
    setChatMessages(prev => [...prev.filter(msg => msg.id !== loadingId), reply]);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends, Shift+Enter inserts a newline; ignore Enter while an IME is composing
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const slides = [1, 2, 3, 4, 5];
  const [currentSlide, setCurrentSlide] = useState(2);

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-row bg-white text-slate-800 font-sans">
      
      {/* 1. Left Column: Brand & Export Settings (25%) */}
      <div className="w-[25%] h-full flex flex-col border-r border-gray-200 p-6 bg-white shrink-0">
        
        {/* Brand Settings Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-6 text-slate-900">Brand & Design Settings</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Logo</label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
              <Upload className="text-gray-400 mb-2" size={24} />
              <span className="text-sm text-gray-500 font-medium">Upload Logo</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Handle</label>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Username" 
                defaultValue="design.daily"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Style Section */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Colors</label>
          <div className="flex gap-4 mb-6">
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full bg-slate-900 border-2 border-gray-200 cursor-pointer shadow-sm"></div>
              <span className="text-xs text-gray-500 font-medium">Text</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full bg-white border-2 border-gray-200 cursor-pointer shadow-sm"></div>
              <span className="text-xs text-gray-500 font-medium">BG</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full bg-pink-500 border-2 border-gray-200 cursor-pointer shadow-sm ring-2 ring-indigo-500 ring-offset-2"></div>
              <span className="text-xs text-gray-500 font-medium">Accent</span>
            </div>
          </div>

          <label className="block text-sm font-semibold text-gray-700 mb-2">Typography</label>
          <select className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">
            <option>Inter</option>
            <option>Roboto</option>
            <option>Poppins</option>
            <option>Playfair Display</option>
          </select>
        </div>

        {/* Bottom Section (Fixed Download) */}
        <div className="mt-auto pt-4">
          <button className="w-full bg-indigo-600 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-lg hover:shadow-xl transition-all">
            <Download size={20} />
            Download Carousel (ZIP)
          </button>
          {/* Debug/Nav link to go back to login */}
          <button 
            onClick={() => onNavigate('login')}
            className="w-full text-xs text-center text-gray-400 mt-4 hover:text-gray-600"
          >
            Log Out (Demo)
          </button>
        </div>
      </div>

      {/* 2. Middle Column: Live Canvas Preview (50%) */}
      <div className="w-[50%] h-full flex flex-col bg-gray-50 border-r border-gray-200 relative shrink-0">
        
        {/* Top Bar */}
        <div className="h-16 border-b border-gray-200 px-6 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2 group cursor-pointer">
            <h3 className="font-bold text-lg text-slate-800 group-hover:text-indigo-600 transition-colors">UI/UX Trends 2027</h3>
            <Edit2 size={16} className="text-gray-400 group-hover:text-indigo-600" />
          </div>
          
          <div className="flex items-center gap-4 bg-gray-100 rounded-full px-3 py-1.5 border border-gray-200 shadow-sm">
            <button 
              onClick={() => setCurrentSlide(Math.max(1, currentSlide - 1))}
              className="p-1 rounded-full hover:bg-white transition-colors"
            >
              <ChevronLeft size={20} className="text-gray-600" />
            </button>
            <span className="font-semibold text-sm w-12 text-center text-slate-700">
              {currentSlide} of {slides.length}
            </span>
            <button 
              onClick={() => setCurrentSlide(Math.min(slides.length, currentSlide + 1))}
              className="p-1 rounded-full hover:bg-white transition-colors"
            >
              <ChevronRight size={20} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Center: The Canvas */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-8 bg-gray-100/50">
          {/* Main 4:5 Canvas Wrapper */}
          <div className="w-full max-w-[360px] xl:max-w-[420px] aspect-[4/5] bg-white shadow-2xl rounded-sm relative p-8 flex flex-col justify-between overflow-hidden border border-gray-100">
            {/* Slide Placeholder Content */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-bl-full -mr-10 -mt-10 blur-xl"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-500/10 rounded-tr-full -ml-10 -mb-10 blur-xl"></div>
            
            <div className="z-10 relative mt-4">
              <span className="inline-block px-3 py-1 bg-pink-100 text-pink-600 font-bold text-xs rounded-full uppercase tracking-wider mb-4">
                Trend 0{currentSlide}
              </span>
              <h1 className="text-4xl font-extrabold text-slate-900 leading-tight mb-4">
                The Rise of <br/><span className="text-pink-500">AI Interfaces</span>
              </h1>
              <p className="text-gray-600 text-lg leading-relaxed font-medium">
                By 2027, graphical user interfaces will transition entirely to conversational, predictive, and hyper-personalized AI systems that adapt in real-time.
              </p>
            </div>

            <div className="z-10 relative flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-indigo-500"></div>
              </div>
              <span className="font-bold text-slate-800 text-sm">@design.daily</span>
            </div>
          </div>
        </div>

        {/* Bottom Section: Thumbnails */}
        <div className="h-32 border-t border-gray-200 bg-white flex items-center px-6 overflow-x-auto gap-4 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
          {slides.map(slide => (
            <div 
              key={slide} 
              onClick={() => setCurrentSlide(slide)}
              className={`h-20 w-16 shrink-0 aspect-[4/5] rounded-md border-2 cursor-pointer transition-all ${
                currentSlide === slide ? 'border-indigo-600 shadow-md scale-105' : 'border-gray-200 hover:border-indigo-300 opacity-60 hover:opacity-100'
              } flex items-center justify-center bg-gray-50 relative overflow-hidden`}
            >
              <div className="absolute inset-x-2 top-2 h-1/2 bg-gray-200 rounded-sm"></div>
              <div className="absolute left-2 bottom-2 w-1/2 h-1 bg-gray-300 rounded-full"></div>
            </div>
          ))}
          <button className="h-20 w-16 shrink-0 aspect-[4/5] rounded-md border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50 transition-all cursor-pointer bg-gray-50">
            <Plus size={24} />
          </button>
        </div>
      </div>

      {/* 3. Right Column: AI Chat Assistant (25%) */}
      <div className="w-[25%] h-full flex flex-col bg-white shrink-0 relative">
        
        {/* Chat Header */}
        <div className="h-16 border-b border-gray-200 px-6 flex items-center gap-3 shrink-0 shadow-sm z-10">
          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Bot size={18} className="text-indigo-600" />
          </div>
          <h2 className="font-bold text-lg text-slate-900 tracking-tight">KaruAI</h2>
        </div>

        {/* Chat History */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-slate-50/50">
          {chatMessages.length === 0 && (
            <p className="m-auto text-center text-sm text-gray-400 max-w-[80%]">
              Describe the carousel you want to create, and KaruAI will get started.
            </p>
          )}
          {chatMessages.map(msg => (
            <div key={msg.id} className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[85%] p-4 rounded-2xl shadow-sm text-sm leading-relaxed whitespace-pre-wrap break-words ${
                  msg.sender === 'user' 
                    ? 'bg-indigo-600 text-white rounded-br-sm' 
                    : msg.status === 'error'
                      ? 'bg-red-50 border border-red-200 text-red-700 rounded-bl-sm'
                      : 'bg-white border border-gray-200 text-slate-800 rounded-bl-sm'
                }`}
              >
                {msg.status === 'loading' ? <TypingIndicator /> : msg.text}
              </div>
            </div>
          ))}
        </div>

        {/* Fixed Chat Input */}
        <div className="p-4 border-t border-gray-200 bg-white shrink-0">
          <div className="relative flex items-center bg-gray-100 rounded-xl border border-gray-200 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
            <textarea 
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Describe the post you want to create or edit..."
              className="w-full bg-transparent pl-4 pr-12 py-3 rounded-xl focus:outline-none resize-none h-[52px] text-sm text-slate-700 placeholder:text-gray-400 overflow-y-auto"
              rows={1}
            />
            <button 
              type="button"
              onClick={handleSendMessage}
              disabled={isSending || !chatInput.trim()}
              aria-label="Send message"
              className="absolute right-2 w-8 h-8 flex items-center justify-center bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={14} className="-ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CookieBanner = ({ onAccept }) => (
  <div className="fixed bottom-6 left-6 max-w-sm bg-slate-900 text-white p-5 rounded-2xl shadow-2xl z-50 flex flex-col gap-4 border border-slate-700">
    <div className="flex items-start gap-3">
      <Cookie className="text-yellow-400 shrink-0 mt-0.5" size={24} />
      <p className="text-sm leading-relaxed text-slate-300">
        KaruAI uses cookies to ensure you get the best experience. By using our site, you agree to our use of cookies.
      </p>
    </div>
    <div className="flex items-center justify-end gap-3 w-full">
      <button className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
        Preferences
      </button>
      <button 
        onClick={onAccept}
        className="px-5 py-2 text-sm font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors shadow-md"
      >
        Got it!
      </button>
    </div>
  </div>
);

// --- Main App Component ---

export default function App() {
  const [currentView, setCurrentView] = useState('login'); // 'login' | 'register' | 'dashboard'
  const [showCookie, setShowCookie] = useState(true);

  return (
    <div className="antialiased min-h-screen">
      {/* Navigation Router (Simulated) */}
      {currentView === 'login' && <LoginScreen onNavigate={setCurrentView} />}
      {currentView === 'register' && <RegisterScreen onNavigate={setCurrentView} />}
      {currentView === 'dashboard' && <DashboardScreen onNavigate={setCurrentView} />}

      {/* Global Elements */}
      {showCookie && <CookieBanner onAccept={() => setShowCookie(false)} />}
    </div>
  );
}