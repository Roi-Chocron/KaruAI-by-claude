import { GoogleGenerativeAI, Content, ModelParams, ResponseSchema, SchemaType } from '@google/generative-ai';
import * as fs from 'fs/promises';
import * as path from 'path';
import type {
    CarouselData,
    CarouselElement,
    CarouselElementType,
    CarouselSlide,
    ConversationMetrics,
    ConversationState,
    KaruResponse,
} from '@/types';

export type {
    CarouselData,
    CarouselElement,
    CarouselElementType,
    CarouselSlide,
    ConversationMetrics,
    ConversationState,
    KaruResponse,
} from '@/types';

// Google Fonts the model may use. The dashboard editor loads (and embeds on export) the same list,
// so keep public/advanced_dashboard_editor.html's FONTS in sync with this one.
export const CAROUSEL_FONTS = [
    'Heebo', 'Assistant', 'Rubik', 'Secular One', 'Frank Ruhl Libre', 'Varela Round', 'Karantina', 'Suez One',
    'Amatic SC', 'Bellefair', 'David Libre', 'Alef', 'Noto Sans Hebrew', 'Noto Serif Hebrew', 'Fredoka',
    'IBM Plex Sans Hebrew', 'Inter', 'Poppins', 'Playfair Display', 'Montserrat', 'Bebas Neue', 'Space Grotesk',
    'Abril Fatface', 'Caveat',
];

export const KARU_SYSTEM_PROMPT = [
    "You are KaruAI, an expert Instagram carousel designer. Based on the user's request, create a highly engaging carousel.",
    'Return ONLY a valid JSON object matching the schema. No markdown wrapping, no conversational filler.',
    '',
    'DESIGN FREELY. There are no templates. Each slide is a stack of absolutely positioned layers on a 1080x1350 px canvas',
    '(origin at the top-left, x to the right, y downwards); the array order is the stacking order, first element at the bottom.',
    'Be bold and creative and vary the composition from slide to slide while keeping the carousel visually consistent:',
    'oversized typography, color blocks, gradients, circles and blobs, rotated shapes, frames, badges, underlines, numbers,',
    'overlapping layers, asymmetric layouts, full-bleed or cut-out images. Start each slide with a full-canvas background layer.',
    '',
    'Element types: rect (rectangle, radius rounds the corners), ellipse (circle or oval filling its w x h box), text, image.',
    'fillColor is the fill of shapes and the color of text. fillOpacity (0-100) is the opacity of the whole layer.',
    'gradientTo + gradientAngle (CSS degrees) turn a shape fill into a linear gradient from fillColor to gradientTo.',
    'Colors are 6-digit hex codes. Text uses fontFamily from the allowed list, fontWeight 100-900, lineHeight as a multiple',
    'of the font size, letterSpacing in px.',
    '',
    'TEXT SIZE: text boxes grow downwards automatically, so their h is ignored; you must plan the height yourself.',
    'One line holds about w / (fontSize * 0.55) characters; height = number of lines * fontSize * lineHeight.',
    'Make sure text never runs into other text or off the canvas, keep at least 60 px from the canvas edges for text,',
    'and leave clear space between text blocks. Hebrew and Arabic text is right-aligned unless the design centers it.',
    'Write the slide text in the language the user writes in.',
    '',
    'IMAGES: every slide has two complete designs. withoutImage contains no image elements. withImage contains exactly one',
    'element of type image plus everything else; design it deliberately around the image instead of pasting an image into',
    'the other version. The user reviews each imagePrompt: approved slides use withImage, the rest use withoutImage, so both',
    'must look finished. The image element\'s w and h set the aspect ratio the image is generated at; write imagePrompt in',
    'English for exactly that shape and role (a full-bleed background needs a calm, darker area where text sits; a circle',
    'crop needs a centered subject). Never ask for text, letters, logos or watermarks in an image.',
    '',
    'EDITING: when the message includes the current carousel, that JSON is the source of truth: the user may have moved,',
    'restyled, deleted or added elements by hand. Apply only what the user asks for and return every other slide and',
    'element exactly as given, with the same ids and values. Never bring back an element that is missing from the current',
    'carousel. Give new elements new ids that were never used before. Elements marked "userImage": true hold images the',
    'user approved or uploaded; keep them with the same id (you may move or resize them) unless told otherwise.',
    'Always return the complete carousel. Slide ids are stable numbers; element ids are unique within their slide.',
].join('\n');

const hexColor = (description: string) => ({
    type: SchemaType.STRING as const,
    description: `${description} as a 6-digit hex code, e.g. #1E293B`,
});
const num = (description: string) => ({ type: SchemaType.NUMBER as const, description });
const enumOf = (values: string[], description?: string) => ({
    type: SchemaType.STRING as const,
    format: 'enum' as const,
    enum: values,
    ...(description ? { description } : {}),
});

const ELEMENT_SCHEMA = {
    type: SchemaType.OBJECT,
    properties: {
        id: { type: SchemaType.STRING, description: 'Unique within the slide; keep existing ids when editing' },
        type: enumOf(['rect', 'ellipse', 'text', 'image']),
        name: { type: SchemaType.STRING, description: 'Short layer name shown in the editor, e.g. "Title" or "Yellow blob"' },
        x: num('Left edge in px'),
        y: num('Top edge in px'),
        w: num('Width in px'),
        h: num('Height in px (ignored for text, which grows to fit)'),
        rotation: num('Rotation in degrees around the center'),
        radius: num('Corner radius in px for rect and image'),
        fillColor: hexColor('Shape fill or text color'),
        fillOpacity: num('Layer opacity 0-100'),
        gradientTo: hexColor('Optional second color: makes the fill a linear gradient from fillColor'),
        gradientAngle: num('Gradient direction in CSS degrees'),
        strokeColor: hexColor('Border color'),
        strokeWidth: num('Border width in px, 0 for none'),
        strokeStyle: enumOf(['solid', 'dashed', 'dotted']),
        shadowType: enumOf(['none', 'drop-shadow', 'inner-shadow']),
        shadowX: num('Shadow x offset in px'),
        shadowY: num('Shadow y offset in px'),
        shadowBlur: num('Shadow blur in px'),
        shadowSpread: num('Shadow spread in px (shapes only)'),
        shadowColor: hexColor('Shadow color'),
        content: { type: SchemaType.STRING, description: 'The text of a text element' },
        fontFamily: enumOf(CAROUSEL_FONTS),
        fontSize: num('Font size in px'),
        fontWeight: { type: SchemaType.INTEGER, description: '100-900' },
        textAlign: enumOf(['left', 'center', 'right']),
        lineHeight: num('Line height as a multiple of the font size, e.g. 1.15'),
        letterSpacing: num('Letter spacing in px'),
        italic: { type: SchemaType.BOOLEAN },
    },
    required: ['id', 'type', 'name', 'x', 'y', 'w', 'h', 'rotation', 'fillColor', 'fillOpacity'],
} satisfies ResponseSchema;

export const CAROUSEL_RESPONSE_SCHEMA: ResponseSchema = {
    type: SchemaType.OBJECT,
    properties: {
        title: {
            type: SchemaType.STRING,
            description: 'Short name of the carousel in the language the user writes in, shown in the gallery. Keep it when editing.',
        },
        slides: {
            type: SchemaType.ARRAY,
            description: 'The carousel slides in display order',
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    id: { type: SchemaType.INTEGER, description: 'Stable slide id; keep existing ids when editing' },
                    title: { type: SchemaType.STRING, description: 'Short summary of the slide, for the editor UI' },
                    imagePrompt: {
                        type: SchemaType.STRING,
                        description: 'English prompt for the image element of withImage, composed for its aspect ratio',
                    },
                    withImage: { type: SchemaType.ARRAY, items: ELEMENT_SCHEMA, description: 'Design with exactly one image element' },
                    withoutImage: { type: SchemaType.ARRAY, items: ELEMENT_SCHEMA, description: 'Design without any image element' },
                },
                required: ['id', 'title', 'imagePrompt', 'withImage', 'withoutImage'],
            },
        },
    },
    required: ['title', 'slides'],
};

/**
 * Generates a response from Google Gemini API while managing conversation history,
 * system prompts, precise timestamps, and token usage metrics.
 *
 * @param userInput - The text message from the user.
 * @param modelName - The specific Gemini model to use (e.g., 'gemini-1.5-flash').
 * @param jsonFilename - The path to the JSON file where the conversation state is saved.
 * @param systemPrompt - System instructions to guide the model's behavior (defaults to the KaruAI carousel prompt).
 * @param turnContext - Extra text sent with this message only (e.g. the current carousel). It is not stored in the
 *                      history, so the history keeps just what the user wrote.
 * @param geminiApiKey - API key to use instead of the GEMINI_API_KEY environment variable.
 * @returns An object containing the response text (a CarouselData JSON string) and token metrics.
 */
export async function generateKaruResponse(
    userInput: string,
    modelName: string,
    jsonFilename: string,
    systemPrompt: string = KARU_SYSTEM_PROMPT,
    turnContext?: string,
    geminiApiKey?: string
): Promise<KaruResponse> {
    // 1. Ensure the API key is present (the caller's, else the environment's)
    const apiKey = geminiApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY environment variable is not set.');
    }

    // 2. Initialize the State (Memory)
    let state: ConversationState = {
        history: [],
        lastMetrics: null
    };

    try {
        // Attempt to load existing conversation history from the JSON file
        const fileContent = await fs.readFile(jsonFilename, 'utf-8');
        state = JSON.parse(fileContent);
    } catch (error: any) {
        // If the file doesn't exist, we start with the empty initialized state
        if (error.code !== 'ENOENT') {
            console.warn(`[Karu Utility] Warning: Failed to parse ${jsonFilename}. Starting fresh. Error: ${error.message}`);
        }
    }

    // 3. Initialize the SDK Model
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Force structured JSON output matching the carousel schema
    const modelConfig: ModelParams = {
        model: modelName,
        generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: CAROUSEL_RESPONSE_SCHEMA,
        },
    };
    // Configure system prompt if provided
    if (systemPrompt && systemPrompt.trim() !== '') {
        modelConfig.systemInstruction = systemPrompt;
    }

    const model = genAI.getGenerativeModel(modelConfig);

    // 4. Start Chat Session with context memory
    const chat = model.startChat({
        history: state.history,
    });

    // 5. Capture Start Time & Send Request
    const startTime = new Date().toISOString();
    let result;
    
    try {
        result = await chat.sendMessage(turnContext ? `${userInput}\n\n${turnContext}` : userInput);
    } catch (error: any) {
        console.error(`[Karu Utility] API Request failed: ${error.message}`);
        throw error;
    }

    // 6. Capture End Time
    const endTime = new Date().toISOString();

    // 7. Extract the Response and Metrics
    const responseText = result.response.text();
    const usage = result.response.usageMetadata;
    
    const promptTokenCount = usage?.promptTokenCount || 0;
    const responseTokenCount = usage?.candidatesTokenCount || 0;
    // Current request tokens (the total tokens billed/processed for this specific turn)
    const currentRequestTokens = usage?.totalTokenCount || (promptTokenCount + responseTokenCount);

    // Calculate total cumulative tokens over the entire lifespan of this JSON conversation
    const previousCumulative = state.lastMetrics?.cumulativeConversationTokens || 0;
    const totalConversationTokens = previousCumulative + currentRequestTokens;

    // 8. Update State with updated history and new metrics
    state.history = await chat.getHistory();
    if (turnContext) {
        const lastUserTurn = [...state.history].reverse().find(turn => turn.role === 'user');
        if (lastUserTurn) lastUserTurn.parts = [{ text: userInput }];
    }
    state.lastMetrics = {
        startTime,
        endTime,
        promptTokenCount,
        responseTokenCount,
        currentRequestTokens,
        cumulativeConversationTokens: totalConversationTokens
    };

    // 9. Save State Back to JSON
    try {
        // Ensure directory exists before writing
        const dir = path.dirname(jsonFilename);
        await fs.mkdir(dir, { recursive: true });
        
        // Write the state object safely to disk
        await fs.writeFile(jsonFilename, JSON.stringify(state, null, 2), 'utf-8');
    } catch (error: any) {
        console.error(`[Karu Utility] Failed to save conversation state to ${jsonFilename}: ${error.message}`);
        throw error;
    }

    // 10. Return the structured response
    return {
        responseText,
        currentRequestTokens,
        totalConversationTokens
    };
}
