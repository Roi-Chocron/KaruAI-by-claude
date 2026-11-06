import { GoogleGenerativeAI, Content, ModelParams, ResponseSchema, SchemaType } from '@google/generative-ai';
import * as fs from 'fs/promises';
import * as path from 'path';

// Define the structure of the JSON file storing the context memory
export interface ConversationMetrics {
    startTime: string;
    endTime: string;
    promptTokenCount: number;
    responseTokenCount: number;
    // Tokens for the current API call (history included in prompt + response)
    currentRequestTokens: number;
    // Cumulative tokens across all API calls in this conversation
    cumulativeConversationTokens: number;
}

export interface ConversationState {
    history: Content[];
    lastMetrics: ConversationMetrics | null;
}

// Structured carousel output returned (as a JSON string) in KaruResponse.responseText
export type CarouselSlideType = 'cover' | 'content' | 'quote' | 'cta';

// Where the slide's image goes in its "with image" version. Each layout has a fixed frame on the
// 1080x1350 canvas, so the image is generated at exactly that aspect ratio (see the dashboard editor).
export type CarouselImageLayout = 'top' | 'bottom' | 'background' | 'side' | 'circle';

export interface CarouselTheme {
    bgColor: string;
    textColor: string;
    accentColor: string;
}

export interface CarouselSlide {
    id: number;
    type: CarouselSlideType;
    title: string;
    content: string;
    imagePrompt: string;
    imageLayout: CarouselImageLayout;
    // Set only by the user's local uploads in the UI (a base64 data URL). Deliberately not part of
    // CAROUSEL_RESPONSE_SCHEMA: the model never generates images.
    imageUrl?: string;
}

export interface CarouselData {
    theme: CarouselTheme;
    slides: CarouselSlide[];
}

export const KARU_SYSTEM_PROMPT =
    "You are KaruAI, an expert Instagram carousel generator. Based on the user's request, generate a highly engaging carousel. " +
    'You must return ONLY a valid JSON object matching the schema. No markdown wrapping, no conversational filler. ' +
    'When the user asks to change an existing carousel, return the complete updated carousel, not just the changed parts. ' +
    'Every slide is built in two versions: one without an image and one with an image. The user reviews each imagePrompt and ' +
    'only the slides whose image they approve use the image version, so the title and content must work on their own too. ' +
    'For every slide choose the imageLayout that best fits its content, and write the imagePrompt for exactly that layout\'s ' +
    'shape and role: describe the composition for its aspect ratio, keep the main subject inside the frame, and never ask for ' +
    'text, letters, logos or watermarks in the image. For the background layout the text is printed over the image, so ask for ' +
    'a calm, darker area with little detail where the text will sit.';

const hexColor = (description: string) => ({
    type: SchemaType.STRING as const,
    description: `${description} as a 6-digit hex code, e.g. #1E293B`,
});

export const CAROUSEL_RESPONSE_SCHEMA: ResponseSchema = {
    type: SchemaType.OBJECT,
    properties: {
        theme: {
            type: SchemaType.OBJECT,
            properties: {
                bgColor: hexColor('Slide background color'),
                textColor: hexColor('Main text color, readable on bgColor'),
                accentColor: hexColor('Accent color for highlights and badges'),
            },
            required: ['bgColor', 'textColor', 'accentColor'],
        },
        slides: {
            type: SchemaType.ARRAY,
            description: 'The carousel slides in display order',
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    id: { type: SchemaType.INTEGER, description: '1-based position of the slide' },
                    type: {
                        type: SchemaType.STRING,
                        format: 'enum',
                        enum: ['cover', 'content', 'quote', 'cta'],
                        description: 'cover = opening hook, content = main points, quote = a quotation, cta = closing call to action',
                    },
                    title: { type: SchemaType.STRING },
                    content: { type: SchemaType.STRING },
                    imageLayout: {
                        type: SchemaType.STRING,
                        format: 'enum',
                        enum: ['top', 'bottom', 'background', 'side', 'circle'],
                        description:
                            'Placement of the image in the slide\'s image version: ' +
                            'top = wide landscape banner above the text (aspect 45:28); ' +
                            'bottom = wide landscape banner below the text (aspect 45:28); ' +
                            'background = full-bleed portrait image behind the text, darkened (aspect 4:5); ' +
                            'side = tall portrait strip on the left with the text beside it (aspect 16:45); ' +
                            'circle = square image cropped to a circle above centered text (aspect 1:1)',
                    },
                    imagePrompt: {
                        type: SchemaType.STRING,
                        description: 'English prompt for the image of this slide, composed for the aspect ratio of its imageLayout',
                    },
                },
                required: ['id', 'type', 'title', 'content', 'imageLayout', 'imagePrompt'],
            },
        },
    },
    required: ['theme', 'slides'],
};

export interface KaruResponse {
    responseText: string;
    currentRequestTokens: number;
    totalConversationTokens: number;
}

/**
 * Generates a response from Google Gemini API while managing conversation history,
 * system prompts, precise timestamps, and token usage metrics.
 *
 * @param userInput - The text message from the user.
 * @param modelName - The specific Gemini model to use (e.g., 'gemini-1.5-flash').
 * @param jsonFilename - The path to the JSON file where the conversation state is saved.
 * @param systemPrompt - System instructions to guide the model's behavior (defaults to the KaruAI carousel prompt).
 * @returns An object containing the response text (a CarouselData JSON string) and token metrics.
 */
export async function generateKaruResponse(
    userInput: string,
    modelName: string,
    jsonFilename: string,
    systemPrompt: string = KARU_SYSTEM_PROMPT
): Promise<KaruResponse> {
    // 1. Ensure the API key is present
    const apiKey = process.env.GEMINI_API_KEY;
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
        result = await chat.sendMessage(userInput);
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