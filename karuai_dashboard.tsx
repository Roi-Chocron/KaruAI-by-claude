'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, AtSign, Download, Edit2, ChevronLeft, ChevronRight, 
  Plus, Bot, Send, Mail, Lock, User, Cookie, ImagePlus, Trash2, Undo2, Redo2
} from 'lucide-react';
import type {
  KaruResponse, CarouselData, CarouselSlide, CarouselSlideType, CarouselTheme, SlideElementPosition, CustomSlideElement
} from './karu_response_utility';
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

type View = 'login' | 'register' | 'dashboard';
type NavProps = { onNavigate: (view: View) => void };

const LoginScreen = ({ onNavigate }: NavProps) => (
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

const RegisterScreen = ({ onNavigate }: NavProps) => (
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
  imagePrompts?: ImagePromptApproval[];
};

type ImagePromptApproval = {
  slideIndex: number;
  prompt: string;
  status: 'pending' | 'generating' | 'generated' | 'error';
  error?: string;
};

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

// --- Carousel helpers ---

const DEFAULT_THEME: CarouselTheme = {
  bgColor: '#FFFFFF',
  textColor: '#0F172A',
  accentColor: '#EC4899',
  fontFamily: 'Inter, sans-serif',
};
const POST_STORAGE_KEY = 'karuai:last-post';
const SLIDE_TYPES: CarouselSlideType[] = ['cover', 'content', 'quote', 'cta'];

// Accepts #RGB or #RRGGBB and returns #RRGGBB (so an alpha suffix can be appended), or null if invalid
const normalizeHex = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const match = value.trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!match) return null;
  const hex = match[1].length === 3 ? match[1].split('').map(c => c + c).join('') : match[1];
  return `#${hex.toUpperCase()}`;
};

// Parses the model's responseText and checks it really has the carousel shape
const parseCarousel = (responseText: string): CarouselData => {
  // The response schema should rule out markdown fences, but strip them defensively
  const cleaned = responseText.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');

  let raw: any;
  try {
    raw = JSON.parse(cleaned);
  } catch {
    throw new Error('The AI returned invalid JSON. Please try again.');
  }
  if (!Array.isArray(raw?.slides) || raw.slides.length === 0) {
    throw new Error('The AI response did not contain any slides.');
  }

  return {
    theme: {
      bgColor: normalizeHex(raw.theme?.bgColor) ?? DEFAULT_THEME.bgColor,
      textColor: normalizeHex(raw.theme?.textColor) ?? DEFAULT_THEME.textColor,
      accentColor: normalizeHex(raw.theme?.accentColor) ?? DEFAULT_THEME.accentColor,
      fontFamily: typeof raw.theme?.fontFamily === 'string' ? raw.theme.fontFamily : DEFAULT_THEME.fontFamily,
    },
    slides: raw.slides.map((slide: any, index: number): CarouselSlide => ({
      id: Number.isInteger(slide?.id) ? slide.id : index + 1,
      type: SLIDE_TYPES.includes(slide?.type) ? slide.type : 'content',
      title: String(slide?.title ?? ''),
      content: String(slide?.content ?? ''),
      imagePrompt: String(slide?.imagePrompt ?? ''),
    })),
  };
};

const padNumber = (n: number) => String(n).padStart(2, '0');

// Reads a user-picked image as a base64 data URL so it can live in React state
const readImageAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please choose an image file.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the file.'));
    reader.readAsDataURL(file);
  });

// Inline-editable text for the canvas. The DOM is owned by the browser while editing, so the
// element is keyed by its value: every committed change remounts it with fresh, React-rendered
// text instead of React trying to patch text nodes the user has already rewritten.
const EditableText = ({
  as: Tag = 'span', value, field, onCommit, normalize, multiline = false, className = '', style,
}: {
  as?: 'h1' | 'p' | 'span';
  value: string;
  field: string; // shown as the "Empty <field>" placeholder
  onCommit: (next: string) => void;
  normalize?: (raw: string) => string | null; // return null to reject the edit and restore the old value
  multiline?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) => (
  <Tag
    key={value}
    contentEditable={true}
    suppressContentEditableWarning={true}
    spellCheck={false}
    data-placeholder={`Empty ${field}`}
    title={`Click to edit ${field}`}
    style={style}
    className={`${className} cursor-text rounded-sm outline-none outline-offset-4 hover:outline-dashed hover:outline-1 focus:outline-dashed focus:outline-2 empty:before:content-[attr(data-placeholder)] empty:before:italic empty:before:opacity-40`}
    onBlur={e => {
      const raw = e.currentTarget.innerText.replace(/ /g, ' ').trim();
      const next = normalize ? normalize(raw) : raw;
      if (next === null) {
        e.currentTarget.innerText = value; // rejected: put the previous text back
      } else if (next !== value) {
        onCommit(next);
      }
    }}
    onKeyDown={e => {
      if (e.key === 'Escape') {
        e.currentTarget.innerText = value; // cancel the edit
        e.currentTarget.blur();
      } else if (e.key === 'Enter' && !multiline && !e.nativeEvent.isComposing) {
        e.preventDefault();
        e.currentTarget.blur();
      }
    }}
    onPaste={e => {
      // Paste as plain text so no foreign HTML/styles end up inside the slide
      e.preventDefault();
      document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
    }}
  >
    {value}
  </Tag>
);

// innerText reflects the badge's CSS uppercase, so compare case-insensitively
const normalizeSlideType = (raw: string): CarouselSlideType | null => {
  const type = raw.toLowerCase() as CarouselSlideType;
  return SLIDE_TYPES.includes(type) ? type : null;
};

const positionFor = (slide: CarouselSlide, element: keyof NonNullable<CarouselSlide['layout']>): SlideElementPosition =>
  slide.layout?.[element] ?? { x: 0, y: 0 };

const elementStyle = (position: SlideElementPosition): React.CSSProperties => ({
  transform: `translate(${position.x}%, ${position.y}%)`,
  width: position.width ? `${position.width}%` : undefined,
  height: position.height ? `${position.height}%` : undefined,
  borderRadius: position.borderRadius !== undefined ? `${position.borderRadius}px` : undefined,
  border: position.borderWidth ? `${position.borderWidth}px solid ${position.borderColor ?? '#000000'}` : undefined,
  boxShadow: position.shadow,
});

const sanitizeCustomHtml = (html: string): string =>
  html
    .replace(/<(?!\/?(?:strong|em|b|i|br)\b)[^>]*>/gi, '')
    .replace(/\son\w+=(?:"[^"]*"|'[^']*')/gi, '')
    .replace(/javascript:/gi, '');

// overflow-clip (not hidden): the decorative blobs stick out of the frame, and a hidden-overflow
// frame would scroll itself when an inline-edited element near the edge takes focus
const CANVAS_FRAME = 'w-full max-w-[360px] xl:max-w-[420px] aspect-[4/5] shadow-2xl rounded-sm relative p-8 flex flex-col overflow-clip border border-gray-100';

const SlideCanvas = ({ slide, theme, index, total, logoUrl, onUpdate }: {
  slide: CarouselSlide;
  theme: CarouselTheme;
  index: number;
  total: number;
  logoUrl: string | null;
  onUpdate: (updatedSlide: CarouselSlide) => void;
}) => {
  const { bgColor, textColor, accentColor } = theme;
  const update = (patch: Partial<CarouselSlide>) => onUpdate({ ...slide, ...patch });
  const move = (element: keyof NonNullable<CarouselSlide['layout']>, event: React.PointerEvent<HTMLDivElement>) => {
    const frame = event.currentTarget.closest<HTMLElement>('[data-slide-canvas]');
    if (!frame) return;
    const start = { x: event.clientX, y: event.clientY };
    const initial = positionFor(slide, element);
    event.currentTarget.setPointerCapture(event.pointerId);
    const handleMove = (moveEvent: PointerEvent) => {
      const next = {
        x: Math.max(-45, Math.min(45, initial.x + ((moveEvent.clientX - start.x) / frame.clientWidth) * 100)),
        y: Math.max(-45, Math.min(45, initial.y + ((moveEvent.clientY - start.y) / frame.clientHeight) * 100)),
      };
      update({ layout: { ...slide.layout, [element]: next } });
    };
    const stop = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', stop);
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', stop, { once: true });
  };
  const dragged = (element: keyof NonNullable<CarouselSlide['layout']>) => ({
    onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => move(element, event),
    className: 'cursor-move touch-none',
  });

  const customHtml = sanitizeCustomHtml(slide.customHtml?.trim() ?? '');

  return (
    <div data-slide-canvas className={`${CANVAS_FRAME} justify-between`} style={{ backgroundColor: bgColor, color: textColor, fontFamily: theme.fontFamily }}>
      {slide.customCss && <style>{`[data-slide-canvas] .slide-custom-html { ${slide.customCss} }`}</style>}
      {/* Decorative accent blobs (hex + alpha suffix) */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-bl-full -mr-10 -mt-10 blur-xl" style={{ backgroundColor: `${accentColor}1A` }}></div>
      <div className="absolute bottom-0 left-0 w-40 h-40 rounded-tr-full -ml-10 -mb-10 blur-xl" style={{ backgroundColor: `${accentColor}14` }}></div>

      <div className="z-10 relative mt-4 min-h-0 flex-1 flex flex-col">
        <span
          {...dragged('badge')}
          style={{ ...elementStyle(positionFor(slide, 'badge')), backgroundColor: `${accentColor}26`, color: accentColor }}
          className="self-start inline-flex items-center gap-1 px-3 py-1 font-bold text-xs rounded-full uppercase tracking-wider mb-4 shrink-0 cursor-move touch-none"
        >
          <EditableText
            value={slide.type}
            field="type"
            normalize={normalizeSlideType}
            onCommit={type => update({ type: type as CarouselSlideType })}
            className="inline-block min-w-[2ch]"
          />
          <span>· {padNumber(index + 1)}</span>
        </span>

        {slide.type === 'quote' ? (
          <>
            <span className="block text-6xl font-serif leading-none -mb-2 shrink-0" style={{ color: accentColor }}>&ldquo;</span>
            <div {...dragged('content')} style={elementStyle(positionFor(slide, 'content'))}>
            <EditableText
              as="p"
              value={slide.content}
              field="quote"
              multiline
              onCommit={content => update({ content })}
              className="block text-2xl font-bold italic leading-snug mb-4 whitespace-pre-line"
            />
            <div className="flex items-center gap-2 text-sm font-semibold opacity-70">
              {slide.imageUrl && (
                <img src={slide.imageUrl} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
              )}
              <span>&mdash;</span>
              <EditableText value={slide.title} field="author" onCommit={title => update({ title })} className="inline-block min-w-[4ch]" />
            </div>
            </div>
          </>
        ) : (
          <>
            <div {...dragged('title')} style={elementStyle(positionFor(slide, 'title'))}>
            <EditableText
              as="h1"
              value={slide.title}
              field="title"
              onCommit={title => update({ title })}
              className={`block ${slide.type === 'cover' ? 'text-4xl' : 'text-3xl'} font-extrabold leading-tight shrink-0 ${slide.imageUrl ? 'mb-3' : 'mb-4'}`}
            />
            </div>
            {slide.imageUrl && (
              // Takes whatever height is left between title and text, so the 4:5 frame never overflows
              <div {...dragged('image')} style={elementStyle(positionFor(slide, 'image'))} className="relative flex-1 min-h-[72px] mb-3 rounded-xl overflow-hidden shadow-sm">
                <img src={slide.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
              </div>
            )}
            <div {...dragged('content')} style={elementStyle(positionFor(slide, 'content'))}>
            <EditableText
              as="p"
              value={slide.content}
              field="content"
              multiline
              onCommit={content => update({ content })}
              className={`block leading-relaxed font-medium opacity-80 whitespace-pre-line shrink-0 ${slide.imageUrl ? 'text-base line-clamp-4 focus:line-clamp-none' : 'text-lg'}`}
            />
            </div>
          </>
        )}
      </div>
      {customHtml && (
        <div className="slide-custom-html absolute inset-8 z-20 pointer-events-none" dangerouslySetInnerHTML={{ __html: customHtml }} />
      )}

      <div className="z-10 relative flex items-center justify-between mt-4 shrink-0">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-10 h-10 rounded-full object-cover bg-white" />
          ) : (
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accentColor}26` }}>
              <div className="w-6 h-6 rounded-full" style={{ backgroundColor: accentColor }}></div>
            </div>
          )}
          <span className="font-bold text-sm">@design.daily</span>
        </div>
        <span className="text-xs font-semibold opacity-60">{index + 1} / {total}</span>
      </div>
    </div>
  );
};

const EmptyCanvas = () => (
  <div className={`${CANVAS_FRAME} bg-white items-center justify-center text-center border-dashed border-2 border-gray-300`}>
    <Bot size={40} className="text-indigo-300 mb-4" />
    <p className="text-slate-700 font-semibold mb-1">No carousel yet</p>
    <p className="text-sm text-gray-500">Describe your carousel in the chat and KaruAI will build it here.</p>
  </div>
);

const TypingIndicator = () => (
  <div className="flex items-center gap-1 py-1" aria-label="KaruAI is typing">
    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.3s]"></span>
    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.15s]"></span>
    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></span>
  </div>
);

const DashboardScreen = ({ onNavigate }: NavProps) => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [carousel, setCarousel] = useState<CarouselData | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0); // 0-based index into carousel.slides
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [selectedElement, setSelectedElement] = useState<'badge' | 'title' | 'content' | 'image'>('title');
  const [selectedCustomElementId, setSelectedCustomElementId] = useState<string | null>(null);
  const [history, setHistory] = useState<{ past: CarouselData[]; future: CarouselData[] }>({ past: [], future: [] });
  const clipboardRef = useRef<CustomSlideElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const slideImageInputRef = useRef<HTMLInputElement>(null);
  const slides = carousel?.slides ?? [];
  const theme = carousel?.theme ?? DEFAULT_THEME;
  const activeSlide = slides[currentSlide];

  const openAdvancedEditor = () => {
    if (!activeSlide) return;
    localStorage.setItem('karuai:advanced-editor-input', JSON.stringify({
      currentSlide: currentSlide,
      carousel,
      theme,
    }));
    window.open('/advanced_figma_clone_carousel_editor.html', '_blank', 'noopener,noreferrer');
  };

  useEffect(() => {
    const applyEditorResult = () => {
      const raw = localStorage.getItem('karuai:advanced-editor-result');
      if (!raw) return;
      try {
        const result = JSON.parse(raw) as {
          slides: Array<{
            slideId: number;
            elements: Array<{
            id: string;
            type: 'text' | 'rect' | 'ellipse' | 'image';
            content?: string;
            x: number;
            y: number;
            w: number | 'auto';
            h: number | 'auto';
            rotation?: number;
            radius?: number;
            fillColor?: string;
            src?: string;
            fontSize?: number;
            }>;
          }>;
        };
        setCarousel(previous => previous ? {
          ...previous,
          slides: previous.slides.map(slide => {
            const edited = result.slides.find(item => item.slideId === slide.id);
            if (!edited) return slide;
            const elements: CustomSlideElement[] = edited.elements
          .filter(element => element.id !== 'slide-background' && element.type !== 'image')
          .map(element => ({
            id: element.id,
            type: element.type === 'rect' ? 'rectangle' : element.type === 'ellipse' ? 'circle' : 'text',
            content: element.content,
            position: {
              x: element.x,
              y: element.y,
              width: typeof element.w === 'number' ? element.w : undefined,
              height: typeof element.h === 'number' ? element.h : undefined,
              rotation: element.rotation,
              borderRadius: element.radius,
            },
            backgroundColor: element.type === 'text' ? undefined : element.fillColor,
            color: element.type === 'text' ? element.fillColor : undefined,
            fontSize: element.fontSize,
          }));
            const image = edited.elements.find(element => element.id === 'slide-image' && element.type === 'image');
            return { ...slide, elements, imageUrl: image?.src || slide.imageUrl };
          }),
        } : previous);
        localStorage.removeItem('karuai:advanced-editor-result');
      } catch (error) {
        console.warn('[Karu Dashboard] Failed to apply advanced editor changes.', error);
      }
    };
    window.addEventListener('focus', applyEditorResult);
    return () => window.removeEventListener('focus', applyEditorResult);
  }, [slides]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(POST_STORAGE_KEY);
      if (saved) {
        const state = JSON.parse(saved) as {
          carousel?: CarouselData | null;
          chatMessages?: ChatMessage[];
          currentSlide?: number;
          logoUrl?: string | null;
        };
        setCarousel(state.carousel ?? null);
        setChatMessages(state.chatMessages ?? []);
        setCurrentSlide(Math.max(0, state.currentSlide ?? 0));
        setLogoUrl(state.logoUrl ?? null);
      }
    } catch (error) {
      console.warn('[Karu Dashboard] Failed to restore the previous post.', error);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(POST_STORAGE_KEY, JSON.stringify({
        carousel,
        chatMessages,
        currentSlide,
        logoUrl,
      }));
    } catch (error) {
      console.warn('[Karu Dashboard] Failed to save the current post locally.', error);
    }
  }, [carousel, chatMessages, currentSlide, logoUrl, isHydrated]);

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

      const nextCarousel = parseCarousel((data as KaruResponse).responseText);
      // The AI never returns images, so carry the user's uploads over by slide position
      setCarousel(prev => ({
        ...nextCarousel,
        theme: { ...nextCarousel.theme, fontFamily: prev?.theme.fontFamily ?? nextCarousel.theme.fontFamily },
        slides: nextCarousel.slides.map((slide, i) => ({
          ...slide,
          imageUrl: prev?.slides[i]?.imageUrl,
          layout: prev?.slides[i]?.layout,
          customHtml: prev?.slides[i]?.customHtml,
          customCss: prev?.slides[i]?.customCss,
          elements: prev?.slides[i]?.elements,
        })),
      }));
      // Stay on the same slide across edits, as long as it still exists
      setCurrentSlide(prev => Math.min(prev, nextCarousel.slides.length - 1));

      reply = {
        id: createId(),
        sender: 'ai',
        text: 'Carousel updated. Review and approve an image prompt to add an image to a slide.',
        imagePrompts: nextCarousel.slides
          .map((slide, slideIndex) => ({ slideIndex, prompt: slide.imagePrompt.trim() }))
          .filter(({ prompt }) => prompt.length > 0)
          .map(({ slideIndex, prompt }) => ({ slideIndex, prompt, status: 'pending' })),
      };
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown error';
      reply = { id: createId(), sender: 'ai', text: `Sorry, something went wrong: ${reason}`, status: 'error' };
    } finally {
      setIsSending(false);
    }

    // Swap the loading bubble for the real reply (or the error)
    setChatMessages(prev => [...prev.filter(msg => msg.id !== loadingId), reply]);
  };

  const generateImageForPrompt = async (messageId: string, promptIndex: number, prompt: string, slideIndex: number) => {
    if (isGeneratingImage) return;
    setIsGeneratingImage(true);
    setChatMessages(prev => prev.map(message => {
      if (message.id !== messageId || !message.imagePrompts) return message;
      return {
        ...message,
        imagePrompts: message.imagePrompts.map((item, index) =>
          index === promptIndex ? { ...item, status: 'generating', error: undefined } : item
        ),
      };

    }));

    try {
      const response = await fetch('/api/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || typeof data?.imageUrl !== 'string') {
        throw new Error(data?.error || `Image request failed with status ${response.status}`);
      }

      updateSlide(slideIndex, { imageUrl: data.imageUrl });
      setCurrentSlide(slideIndex);
      setChatMessages(prev => prev.map(message => {
        if (message.id !== messageId || !message.imagePrompts) return message;
        return {
          ...message,
          imagePrompts: message.imagePrompts.map((item, index) =>
            index === promptIndex ? { ...item, status: 'generated' } : item
          ),
        };
      }));
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Image generation failed.';
      setChatMessages(prev => prev.map(message => {
        if (message.id !== messageId || !message.imagePrompts) return message;
        return {
          ...message,
          imagePrompts: message.imagePrompts.map((item, index) =>
            index === promptIndex ? { ...item, status: 'error', error: reason } : item
          ),
        };
      }));
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const approveAllImages = async (messageId: string) => {
    const message = chatMessages.find(item => item.id === messageId);
    const pending = message?.imagePrompts?.filter(item => item.status !== 'generated') ?? [];
    for (const item of pending) {
      const promptIndex = message?.imagePrompts?.indexOf(item) ?? -1;
      if (promptIndex >= 0) {
        await generateImageForPrompt(messageId, promptIndex, item.prompt, item.slideIndex);
      }
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends, Shift+Enter inserts a newline; ignore Enter while an IME is composing
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const updateSlide = (index: number, patch: Partial<CarouselSlide>) => {
    setCarousel(prev => {
      if (!prev) return prev;
      const next = { ...prev, slides: prev.slides.map((slide, i) => (i === index ? { ...slide, ...patch } : slide)) };
      setHistory(current => ({ past: [...current.past.slice(-49), prev], future: [] }));
      return next;
    });
  };

  const updateTheme = (patch: Partial<CarouselTheme>) => {
    setCarousel(prev => prev && { ...prev, theme: { ...prev.theme, ...patch } });
  };

  const updateSelectedElement = (patch: Partial<SlideElementPosition>) => {
    if (!activeSlide) return;
    updateSlide(currentSlide, {
      layout: {
        ...activeSlide.layout,
        [selectedElement]: { ...positionFor(activeSlide, selectedElement), ...patch },
      },
    });
  };

  const addElement = (type: CustomSlideElement['type']) => {
    if (!activeSlide) return;
    const element: CustomSlideElement = {
      id: createId(),
      type,
      content: type === 'text' ? 'New text' : '',
      position: { x: 0, y: 0, width: type === 'circle' ? 18 : 32, height: type === 'circle' ? 18 : 12, borderRadius: type === 'circle' ? 999 : 8 },
      backgroundColor: type === 'rectangle' || type === 'circle' ? theme.accentColor : undefined,
      color: type === 'text' ? theme.textColor : undefined,
      fontSize: type === 'text' ? 18 : undefined,
    };
    updateSlide(currentSlide, { elements: [...(activeSlide.elements ?? []), element] });
    setSelectedCustomElementId(element.id);
  };

  const undo = () => {
    setHistory(current => {
      const previous = current.past.at(-1);
      if (!previous) return current;
      setCarousel(previous);
      return { past: current.past.slice(0, -1), future: carousel ? [carousel, ...current.future] : current.future };
    });
  };

  const redo = () => {
    setHistory(current => {
      const next = current.future[0];
      if (!next) return current;
      setCarousel(next);
      return { past: carousel ? [...current.past, carousel] : current.past, future: current.future.slice(1) };
    });
  };

  const duplicateSelectedElement = () => {
    const element = activeSlide?.elements?.find(item => item.id === selectedCustomElementId);
    if (!element) return;
    const duplicate = { ...element, id: createId(), position: { ...element.position, x: element.position.x + 5, y: element.position.y + 5 } };
    updateSlide(currentSlide, { elements: [...(activeSlide.elements ?? []), duplicate] });
    setSelectedCustomElementId(duplicate.id);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      const modifier = event.ctrlKey || event.metaKey;
      if (modifier && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        event.shiftKey ? redo() : undo();
      } else if (modifier && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        redo();
      } else if (modifier && event.key.toLowerCase() === 'c') {
        const element = activeSlide?.elements?.find(item => item.id === selectedCustomElementId);
        if (element) clipboardRef.current = structuredClone(element);
      } else if (modifier && event.key.toLowerCase() === 'v' && clipboardRef.current && activeSlide) {
        event.preventDefault();
        const pasted = { ...structuredClone(clipboardRef.current), id: createId(), position: { ...clipboardRef.current.position, x: clipboardRef.current.position.x + 5, y: clipboardRef.current.position.y + 5 } };
        updateSlide(currentSlide, { elements: [...(activeSlide.elements ?? []), pasted] });
        setSelectedCustomElementId(pasted.id);
      } else if (modifier && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        duplicateSelectedElement();
      } else if (selectedCustomElementId && activeSlide && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault();
        const element = activeSlide.elements?.find(item => item.id === selectedCustomElementId);
        if (!element) return;
        const delta = event.shiftKey ? 5 : 1;
        const x = element.position.x + (event.key === 'ArrowLeft' ? -delta : event.key === 'ArrowRight' ? delta : 0);
        const y = element.position.y + (event.key === 'ArrowUp' ? -delta : event.key === 'ArrowDown' ? delta : 0);
        updateSlide(currentSlide, { elements: activeSlide.elements?.map(item => item.id === selectedCustomElementId ? { ...item, position: { ...item.position, x, y } } : item) });
      } else if ((event.key === 'Delete' || event.key === 'Backspace') && selectedCustomElementId && activeSlide) {
        updateSlide(currentSlide, { elements: activeSlide.elements?.filter(item => item.id !== selectedCustomElementId) });
        setSelectedCustomElementId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSlide, selectedCustomElementId, currentSlide, carousel]);

  const createNewPost = () => {
    if (!window.confirm('Start a new post? The current post will be cleared from this browser.')) return;
    setCarousel(null);
    setChatMessages([]);
    setChatInput('');
    setCurrentSlide(0);
    setLogoUrl(null);
    localStorage.removeItem(POST_STORAGE_KEY);
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow picking the same file again later
    if (!file) return;
    try {
      setLogoUrl(await readImageAsDataUrl(file));
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Could not load the logo.');
    }
  };

  const handleSlideImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const targetIndex = currentSlide; // the slide that was active when the dialog opened
    try {
      const imageUrl = await readImageAsDataUrl(file);
      updateSlide(targetIndex, { imageUrl });
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Could not load the image.');
    }
  };

  const colorSwatches = [
    { label: 'Text', color: theme.textColor },
    { label: 'BG', color: theme.bgColor },
    { label: 'Accent', color: theme.accentColor },
  ];

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-row bg-white text-slate-800 font-sans">
      
      {/* 1. Left Column: Brand & Export Settings (25%) */}
      <div className="w-[25%] h-full flex flex-col border-r border-gray-200 p-6 bg-white shrink-0 overflow-y-auto">
        
        {/* Brand Settings Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between gap-3 mb-6">
            <h2 className="text-xl font-bold text-slate-900">Brand & Design Settings</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openAdvancedEditor}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                <Edit2 size={14} />
                Advanced editor
              </button>
              <button
                type="button"
                onClick={createNewPost}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-indigo-200 px-2.5 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50"
              >
                <Plus size={14} />
                New post
              </button>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Logo</label>
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              className={`w-full border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-indigo-400 transition-colors ${
                logoUrl ? 'p-4' : 'p-8'
              }`}
            >
              {logoUrl ? (
                <>
                  <img src={logoUrl} alt="Your logo" className="h-16 max-w-full object-contain mb-2" />
                  <span className="text-xs text-gray-400 font-medium">Click to replace</span>
                </>
              ) : (
                <>
                  <Upload className="text-gray-400 mb-2" size={24} />
                  <span className="text-sm text-gray-500 font-medium">Upload Logo</span>
                </>
              )}
            </button>
            {logoUrl && (
              <button
                type="button"
                onClick={() => setLogoUrl(null)}
                className="mt-2 text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                Remove logo
              </button>
            )}
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

        {activeSlide && (
          <div className="mb-8 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
            <label className="block text-sm font-semibold text-slate-800 mb-3">Advanced slide editor</label>
            <p className="text-xs text-slate-500 mb-3">Drag elements on the canvas. Blue guides mark the center; selected elements show resize and rotate handles.</p>
            <div className="flex items-center gap-2 mb-3">
              <button type="button" onClick={undo} disabled={history.past.length === 0} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-40">
                <Undo2 size={13} /> Undo
              </button>
              <button type="button" onClick={redo} disabled={history.future.length === 0} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-40">
                <Redo2 size={13} /> Redo
              </button>
              <span className="text-[10px] text-slate-400">C/V/D/Z · arrows move · Shift+arrows = 5px</span>
            </div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Selected element</label>
            <select
              value={selectedElement}
              onChange={event => setSelectedElement(event.target.value as typeof selectedElement)}
              className="w-full mb-3 rounded-lg border border-gray-200 bg-white p-2 text-xs"
            >
              <option value="badge">Badge</option>
              <option value="title">Title</option>
              <option value="content">Content</option>
              <option value="image">Image</option>
            </select>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {([
                ['Width %', 'width', 40],
                ['Height %', 'height', 20],
                ['Radius px', 'borderRadius', 12],
                ['Border px', 'borderWidth', 0],
              ] as const).map(([label, key, fallback]) => (
                <label key={key} className="text-[10px] text-slate-600">
                  {label}
                  <input
                    type="number"
                    min={0}
                    value={positionFor(activeSlide, selectedElement)[key] ?? fallback}
                    onChange={event => updateSelectedElement({ [key]: Number(event.target.value) })}
                    className="mt-1 w-full rounded border border-gray-200 p-1.5 text-xs"
                  />
                </label>
              ))}
            </div>
            <label className="block text-[10px] text-slate-600 mb-3">
              Border color
              <input
                type="color"
                value={positionFor(activeSlide, selectedElement).borderColor ?? '#000000'}
                onChange={event => updateSelectedElement({ borderColor: event.target.value })}
                className="mt-1 h-7 w-full rounded border border-gray-200"
              />
            </label>
            <div className="flex flex-wrap gap-2 mb-4">
              <button type="button" onClick={() => addElement('text')} className="rounded-lg bg-white px-2 py-1.5 text-xs font-semibold text-indigo-600 border border-indigo-200">+ Text</button>
              <button type="button" onClick={() => addElement('rectangle')} className="rounded-lg bg-white px-2 py-1.5 text-xs font-semibold text-indigo-600 border border-indigo-200">+ Rectangle</button>
              <button type="button" onClick={() => addElement('circle')} className="rounded-lg bg-white px-2 py-1.5 text-xs font-semibold text-indigo-600 border border-indigo-200">+ Circle</button>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {([
                ['Background', 'bgColor'],
                ['Text', 'textColor'],
                ['Accent', 'accentColor'],
              ] as const).map(([label, key]) => (
                <label key={key} className="text-[10px] text-slate-600">
                  {label}
                  <input
                    type="color"
                    value={theme[key]}
                    onChange={event => updateTheme({ [key]: event.target.value })}
                    className="mt-1 h-8 w-full cursor-pointer rounded border border-gray-200 bg-white"
                  />
                </label>
              ))}
            </div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Custom HTML</label>
            <textarea
              value={activeSlide.customHtml ?? ''}
              onChange={event => updateSlide(currentSlide, { customHtml: event.target.value })}
              placeholder="<strong>Optional overlay</strong>"
              className="w-full h-16 resize-y rounded-lg border border-gray-200 bg-white p-2 text-[11px] font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              spellCheck={false}
            />
            <label className="block text-xs font-semibold text-slate-700 mt-3 mb-1">Custom CSS</label>
            <textarea
              value={activeSlide.customCss ?? ''}
              onChange={event => updateSlide(currentSlide, { customCss: event.target.value })}
              placeholder="color: #4f46e5; font-size: 24px;"
              className="w-full h-20 resize-y rounded-lg border border-gray-200 bg-white p-2 text-[11px] font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              spellCheck={false}
            />
          </div>
        )}

        {/* Style Section */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Colors</label>
          <div className="flex gap-4 mb-6">
            {colorSwatches.map(({ label, color }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <div
                  title={color}
                  className={`w-10 h-10 rounded-full border-2 border-gray-200 cursor-pointer shadow-sm transition-colors ${
                    label === 'Accent' ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
                  }`}
                  style={{ backgroundColor: color }}
                ></div>
                <span className="text-xs text-gray-500 font-medium">{label}</span>
                <span className="text-[10px] text-gray-400 font-mono">{color}</span>
              </div>
            ))}
          </div>

          <label className="block text-sm font-semibold text-gray-700 mb-2">Typography</label>
          <select
            value={theme.fontFamily ?? DEFAULT_THEME.fontFamily}
            onChange={event => updateTheme({ fontFamily: event.target.value })}
            className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="Inter, sans-serif">Inter</option>
            <option value="Roboto, sans-serif">Roboto</option>
            <option value="Poppins, sans-serif">Poppins</option>
            <option value="Georgia, serif">Playfair Display</option>
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
          <div className="flex items-center gap-2 group cursor-pointer min-w-0">
            <h3 className="font-bold text-lg text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
              {slides[0]?.title || 'Untitled carousel'}
            </h3>
            <Edit2 size={16} className="text-gray-400 group-hover:text-indigo-600" />
          </div>
          
          <div className="flex items-center gap-4 bg-gray-100 rounded-full px-3 py-1.5 border border-gray-200 shadow-sm">
            <button 
              onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
              disabled={currentSlide <= 0}
              className="p-1 rounded-full hover:bg-white transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <ChevronLeft size={20} className="text-gray-600" />
            </button>
            <span className="font-semibold text-sm w-16 text-center text-slate-700">
              {slides.length ? currentSlide + 1 : 0} of {slides.length}
            </span>
            <button 
              onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))}
              disabled={currentSlide >= slides.length - 1}
              className="p-1 rounded-full hover:bg-white transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <ChevronRight size={20} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Center: The Canvas */}
        <div className="flex-1 overflow-auto flex flex-col items-center justify-center gap-4 p-8 bg-gray-100/50">
          {/* Main 4:5 Canvas */}
          {activeSlide ? (
            <>
              <div className="relative w-full max-w-[360px] xl:max-w-[420px] aspect-[4/5]">
                <SlideCanvas
                  slide={activeSlide}
                  theme={theme}
                  index={currentSlide}
                  total={slides.length}
                  logoUrl={logoUrl}
                  onUpdate={updatedSlide => updateSlide(currentSlide, updatedSlide)}
                />
              </div>

              {/* Slide image controls */}
              <input ref={slideImageInputRef} type="file" accept="image/*" className="hidden" onChange={handleSlideImageChange} />
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => slideImageInputRef.current?.click()}
                  className="flex items-center gap-2 bg-white border border-gray-200 text-slate-700 text-sm font-semibold px-4 py-2 rounded-full shadow-sm hover:border-indigo-400 hover:text-indigo-600 transition-colors"
                >
                  <ImagePlus size={16} />
                  {activeSlide.imageUrl ? 'Replace Slide Image' : 'Upload Slide Image'}
                </button>
                {activeSlide.imageUrl && (
                  <button
                    type="button"
                    onClick={() => updateSlide(currentSlide, { imageUrl: undefined })}
                    aria-label="Remove slide image"
                    title="Remove slide image"
                    className="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 text-gray-500 rounded-full shadow-sm hover:border-red-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </>
          ) : (
            <EmptyCanvas />
          )}
        </div>

        {/* Bottom Section: Thumbnails */}
        <div className="h-32 border-t border-gray-200 bg-white flex items-center px-6 overflow-x-auto gap-4 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
          {slides.map((slide, index) => (
            <div 
              key={`${slide.id}-${index}`} 
              onClick={() => setCurrentSlide(index)}
              title={slide.title}
              className={`h-20 w-16 shrink-0 aspect-[4/5] rounded-md border-2 cursor-pointer transition-all ${
                currentSlide === index ? 'border-indigo-600 shadow-md scale-105' : 'border-gray-200 hover:border-indigo-300 opacity-60 hover:opacity-100'
              } flex flex-col justify-between p-1.5 relative overflow-hidden`}
              style={{ backgroundColor: theme.bgColor, color: theme.textColor }}
            >
              <div className="h-1 w-1/2 rounded-full shrink-0" style={{ backgroundColor: theme.accentColor }}></div>
              {slide.imageUrl && <img src={slide.imageUrl} alt="" className="w-full h-5 rounded-sm object-cover" />}
              <p className={`text-[6px] font-bold leading-tight ${slide.imageUrl ? 'line-clamp-2' : 'line-clamp-3'}`}>{slide.title}</p>
              <span className="text-[8px] font-semibold opacity-60 self-end">{index + 1}</span>
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
                {msg.status === 'loading' ? <TypingIndicator /> : (
                  <>
                    <p>{msg.text}</p>
                    {msg.imagePrompts && msg.imagePrompts.length > 0 && (
                      <div className="mt-3 space-y-3">
                        {msg.imagePrompts.some(item => item.status !== 'generated') && (
                          <button
                            type="button"
                            disabled={isGeneratingImage}
                            onClick={() => approveAllImages(msg.id)}
                            className="w-full rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isGeneratingImage ? 'Generating approved images...' : 'Approve all & generate'}
                          </button>
                        )}
                        {msg.imagePrompts.map((imagePrompt, promptIndex) => (
                          <div key={`${msg.id}-${promptIndex}`} className="rounded-xl border border-indigo-100 bg-indigo-50 p-3">
                            <p className="text-xs font-semibold text-indigo-900 mb-2">
                              Slide {imagePrompt.slideIndex + 1} image prompt
                            </p>
                            <p className="text-xs text-slate-700 mb-3">{imagePrompt.prompt}</p>
                            {imagePrompt.status === 'generated' ? (
                              <p className="text-xs font-semibold text-green-700">Image added to slide.</p>
                            ) : imagePrompt.status === 'error' ? (
                              <p className="text-xs text-red-600">{imagePrompt.error}</p>
                            ) : (
                              <button
                                type="button"
                                disabled={isGeneratingImage || imagePrompt.status === 'generating'}
                                onClick={() => generateImageForPrompt(msg.id, promptIndex, imagePrompt.prompt, imagePrompt.slideIndex)}
                                className="w-full rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {imagePrompt.status === 'generating' ? 'Generating image...' : 'Approve & generate image'}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
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

const CookieBanner = ({ onAccept }: { onAccept: () => void }) => (
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
  const [currentView, setCurrentView] = useState<View>('login');
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