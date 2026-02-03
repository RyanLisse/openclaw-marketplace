"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import OpenAI from "openai";
import { loadPrompt } from "../lib/promptLoader";

function getOpenAI() {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("OPENAI_API_KEY is not set");
    return new OpenAI({ apiKey: key });
}

/**
 * Classify natural language input into one of four intent types.
 * Uses intent_classification prompt for decision logic.
 * 
 * @returns Validated type string ("need" | "offer" | "query" | "collaboration")
 */
export const classifyIntent = internalAction({
    args: {
        text: v.string(),
    },
    handler: async (ctx, args) => {
        const openai = getOpenAI();
        
        // Load prompt template
        const systemPrompt = loadPrompt("intent_classification");
        
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",  // Fast and cheap for classification
            temperature: 0.1,  // Low temperature for consistency
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Classify this intent:\n\n${args.text}` }
            ],
            response_format: { type: "json_object" },
        });

        const response = JSON.parse(completion.choices[0].message.content || "{}");
        
        // Validate type
        const validTypes = ["need", "offer", "query", "collaboration"];
        const type = response.type?.toLowerCase();
        
        if (!type || !validTypes.includes(type)) {
            throw new Error(`Invalid classification type: ${type}. Expected one of: ${validTypes.join(", ")}`);
        }
        
        return {
            type: type as "need" | "offer" | "query" | "collaboration",
            confidence: response.confidence ?? 0.5,
            keywords: response.keywords ?? [],
            reasoning: response.reasoning ?? "",
            suggestedClarifications: response.suggestedClarifications ?? [],
        };
    },
});
