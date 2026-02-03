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
 * Score a match between need and offer using prompt-defined logic.
 * Loads weights from configs table and applies scoring formula from prompt.
 * 
 * @returns Match score (0-100) with breakdown
 */
export const scoreMatch = internalAction({
    args: {
        needIntent: v.object({
            skills: v.array(v.string()),
            minReputation: v.optional(v.number()),
            amount: v.optional(v.number()),
            currency: v.optional(v.string()),
            pricingModel: v.optional(v.string()),
            embedding: v.optional(v.array(v.number())),
        }),
        offerIntent: v.object({
            skills: v.array(v.string()),
            reputation: v.number(),
            amount: v.optional(v.number()),
            currency: v.optional(v.string()),
            pricingModel: v.optional(v.string()),
            embedding: v.optional(v.array(v.number())),
        }),
        vectorSimilarity: v.number(),
        weights: v.optional(v.object({
            skillsWeight: v.number(),
            reputationWeight: v.number(),
            priceWeight: v.number(),
            vectorWeight: v.number(),
        })),
    },
    handler: async (ctx, args) => {
        const openai = getOpenAI();
        
        // Load prompt template
        const systemPrompt = loadPrompt("match_scoring");
        
        // Use provided weights or defaults
        const weights = args.weights ?? {
            skillsWeight: 40,
            reputationWeight: 20,
            priceWeight: 20,
            vectorWeight: 20,
        };
        
        // Build context for scoring
        const scoringContext = `
## Match Data

**Need Intent:**
- Skills required: ${JSON.stringify(args.needIntent.skills)}
- Minimum reputation: ${args.needIntent.minReputation ?? "none"}
- Budget: ${args.needIntent.amount ?? "negotiable"} ${args.needIntent.currency ?? ""}
- Pricing model: ${args.needIntent.pricingModel ?? "negotiable"}

**Offer Intent:**
- Skills offered: ${JSON.stringify(args.offerIntent.skills)}
- Provider reputation: ${args.offerIntent.reputation}
- Rate: ${args.offerIntent.amount ?? "negotiable"} ${args.offerIntent.currency ?? ""}
- Pricing model: ${args.offerIntent.pricingModel ?? "negotiable"}

**Vector Similarity:**
Cosine similarity: ${args.vectorSimilarity.toFixed(3)}

**Scoring Weights (from config):**
- Skills: ${weights.skillsWeight}%
- Reputation: ${weights.reputationWeight}%
- Price: ${weights.priceWeight}%
- Vector: ${weights.vectorWeight}%

## Task
Calculate the match score (0-100) using the weighted formula defined in the prompt. Return structured JSON with total score and breakdown by factor.
`;
        
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            temperature: 0.1,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: scoringContext }
            ],
            response_format: { type: "json_object" },
        });

        const result = JSON.parse(completion.choices[0].message.content || "{}");
        
        // Validate and clamp score
        const score = Math.max(0, Math.min(100, result.score ?? 0));
        
        return {
            score: Math.round(score),
            breakdown: result.breakdown ?? {},
            recommendation: result.recommendation ?? (score >= 75 ? "strong" : score >= 50 ? "moderate" : "weak"),
        };
    },
});
