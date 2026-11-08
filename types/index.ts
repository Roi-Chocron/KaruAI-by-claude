export type Role = 'user' | 'admin';

export interface User {
    id: string;
    email: string;
    name: string;
    role: Role;
    createdAt: string;
    lastLoginAt: string | null;
    lastSeenAt: string | null;
}

export type SettingKey = 'gemini_api_key' | 'pollinations_api_key' | 'gemini_model';

export interface CarouselRow {
    id: string;
    ownerId: string;
    title: string;
    slideCount: number;
    createdAt: string;
    updatedAt: string;
}

export type CarouselMeta = CarouselRow;

export interface HistoryEntry {
    seq: number;
    snapshot: string;
    slide: number;
}

export interface UndoHistory {
    entries: HistoryEntry[];
    index: number;
}

// Conversation and Carousel data types
export interface ConversationMetrics {
    startTime: string;
    endTime: string;
    promptTokenCount: number;
    responseTokenCount: number;
    currentRequestTokens: number;
    cumulativeConversationTokens: number;
}

export interface ConversationState {
    history: any[];
    lastMetrics: ConversationMetrics | null;
}

export type CarouselElementType = 'rect' | 'ellipse' | 'text' | 'image';

export interface CarouselElement {
    id: string;
    type: CarouselElementType;
    name: string;
    x: number;
    y: number;
    w: number;
    h: number;
    rotation: number;
    radius?: number;
    fillColor: string;
    fillOpacity: number;
    gradientTo?: string;
    gradientAngle?: number;
    strokeColor?: string;
    strokeWidth?: number;
    strokeStyle?: 'solid' | 'dashed' | 'dotted';
    shadowType?: 'none' | 'drop-shadow' | 'inner-shadow';
    shadowX?: number;
    shadowY?: number;
    shadowBlur?: number;
    shadowSpread?: number;
    shadowColor?: string;
    content?: string;
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: number;
    textAlign?: 'left' | 'center' | 'right';
    lineHeight?: number;
    letterSpacing?: number;
    italic?: boolean;
}

export interface CarouselSlide {
    id: number;
    title: string;
    imagePrompt: string;
    withImage: CarouselElement[];
    withoutImage: CarouselElement[];
}

export interface CarouselData {
    title: string;
    slides: CarouselSlide[];
}

export interface KaruResponse {
    responseText: string;
    currentRequestTokens: number;
    totalConversationTokens: number;
}

// Pollinations Image Types
export interface PollinationsImageOptions {
    width?: number;
    height?: number;
    seed?: number;
    safe?: boolean;
    metricsFilename?: string;
    timeoutMs?: number;
    apiKey?: string;
}

export interface PollinationsImageMetrics {
    prompt: string;
    requestUrl: string;
    startTime: string;
    endTime: string;
    durationMs: number;
    statusCode: number;
    contentType: string | null;
    responseBytes: number;
    success: boolean;
    errorMessage?: string;
}

export interface PollinationsImageResult {
    image: Buffer;
    contentType: string;
    metrics: PollinationsImageMetrics;
}
