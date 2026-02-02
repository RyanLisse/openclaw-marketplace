"use node";

import { v } from "convex/values";
import { action, internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import OpenAI from "openai";

function getOpenAI() {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("OPENAI_API_KEY is not set");
    return new OpenAI({ apiKey: key });
}

export const generateEmbedding = action({
    args: {
        text: v.string(),
        intentId: v.id("intents"),
    },
    handler: async (ctx, args) => {
        const openai = getOpenAI();
        const response = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: args.text,
            dimensions: 1536,
        });

        const embedding = response.data[0].embedding;

        // Save back to database via internal mutation
        await ctx.runMutation(internal.intents.patchEmbedding, {
            intentId: args.intentId,
            embedding,
        });

        // Trigger Matching Engine (internalAction)
        await ctx.runAction(internal.matching.findMatches, {
            intentId: args.intentId,
        });

        return embedding;
    },
});

export const analyzeDispute = internalAction({
    args: {
        disputeId: v.id("disputes"),
        evidence: v.string(),
    },
    handler: async (ctx, args) => {
        const openai = getOpenAI();
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: "You are an impartial dispute mediator for an AI marketplace. Analyze the evidence and propose a fair resolution: 'uphold' (pay provider) or 'refund' (return to client). Provide confidence score (0-100)." },
                { role: "user", content: `Evidence: ${args.evidence}` }
            ],
        });

        const analysis = completion.choices[0].message.content;
        // Mock parsing for prototype
        const confidence = 85;
        const decision = "refund"; // extracted from text

        if (confidence > 80) {
            // Auto-resolve
            await ctx.runMutation(internal.disputes.resolveDispute, {
                disputeId: args.disputeId,
                resolution: decision,
                winnerAgentId: undefined, // depends on context
            });
        } else {
            // Escalate
            // update status to 'voting'
        }
    },
});
