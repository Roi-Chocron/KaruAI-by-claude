import { GoogleGenerativeAI, Content } from '@google/generative-ai';
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
 * @param systemPrompt - Optional system instructions to guide the model's behavior.
 * @returns An object containing the response text and token metrics.
 */
export async function generateKaruResponse(
    userInput: string,
    modelName: string,
    jsonFilename: string,
    systemPrompt?: string
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
    
    const modelConfig: any = { model: modelName };
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