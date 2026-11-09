import { GoogleGenerativeAI, ModelParams, ResponseSchema, SchemaType } from '@google/generative-ai';
import type { ConversationState, KaruResponse } from '../../types';
import { readJson, writeJson } from './storage';

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

// Only the last turns go back to the model. Every request carries the current carousel anyway, so older turns add
// tokens (cost) and JSON work (CPU time) without telling the model anything it needs.
const MAX_HISTORY_TURNS = 8;

/**
 * Sends the user's message to Gemini as the next turn of the carousel's conversation, which is kept in R2,
 * and returns the response (a CarouselData JSON string) with its token counts.
 *
 * @param turnContext - Extra text sent with this message only (e.g. the current carousel). It is not stored in the
 *                      history, so the history keeps just what the user wrote.
 */
export async function generateKaruResponse(options: {
    userInput: string;
    modelName: string;
    apiKey: string | undefined;
    bucket: R2Bucket;
    historyKey: string;
    turnContext?: string;
    systemPrompt?: string;
}): Promise<KaruResponse> {
    const { userInput, modelName, apiKey, bucket, historyKey, turnContext, systemPrompt = KARU_SYSTEM_PROMPT } = options;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set.');

    const state: ConversationState = (await readJson<ConversationState>(bucket, historyKey)) ?? { history: [], lastMetrics: null };

    const modelConfig: ModelParams = {
        model: modelName,
        // Force structured JSON output matching the carousel schema
        generationConfig: { responseMimeType: 'application/json', responseSchema: CAROUSEL_RESPONSE_SCHEMA },
    };
    if (systemPrompt.trim() !== '') modelConfig.systemInstruction = systemPrompt;
    const chat = new GoogleGenerativeAI(apiKey).getGenerativeModel(modelConfig).startChat({
        history: state.history.slice(-MAX_HISTORY_TURNS),
    });

    const startTime = new Date().toISOString();
    const result = await chat.sendMessage(turnContext ? `${userInput}\n\n${turnContext}` : userInput);
    const endTime = new Date().toISOString();

    const responseText = result.response.text();
    const usage = result.response.usageMetadata;
    const promptTokenCount = usage?.promptTokenCount || 0;
    const responseTokenCount = usage?.candidatesTokenCount || 0;
    // The tokens billed for this turn, and over the whole conversation
    const currentRequestTokens = usage?.totalTokenCount || promptTokenCount + responseTokenCount;
    const totalConversationTokens = (state.lastMetrics?.cumulativeConversationTokens || 0) + currentRequestTokens;

    // Store the history without the turn context, so it keeps just what the user wrote
    const history = await chat.getHistory();
    if (turnContext) {
        const lastUserTurn = [...history].reverse().find(turn => turn.role === 'user');
        if (lastUserTurn) lastUserTurn.parts = [{ text: userInput }];
    }
    await writeJson(bucket, historyKey, {
        history: history.slice(-MAX_HISTORY_TURNS),
        lastMetrics: {
            startTime,
            endTime,
            promptTokenCount,
            responseTokenCount,
            currentRequestTokens,
            cumulativeConversationTokens: totalConversationTokens,
        },
    } satisfies ConversationState);

    return { responseText, currentRequestTokens, totalConversationTokens };
}
