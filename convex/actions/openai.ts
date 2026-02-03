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
        matchId: v.string(),
        providerReputation: v.number(),
        clientReputation: v.number(),
        amount: v.string(),
        tier: v.number(),
        evidence: v.string(),
    },
    handler: async (ctx, args) => {
        const openai = getOpenAI();
        
        // Load prompt template from file
        const promptTemplate = await ctx.storage.getUrl(`prompts/dispute_mediation.md`);
        let systemPrompt = "You are an impartial dispute mediator for the OpenClaw AI Marketplace.";
        
        // Inject context variables
        const contextPrompt = `
## Dispute Context
- Match ID: $!{args.matchId}
- Provider Reputation: $!{args.providerReputation}
- Client Reputation: $!{args.clientReputation}
- Transaction Amount: $!{args.amount}
- Dispute Tier: $!{args.tier}

## Evidence
$!{args.evidence}

## Task
Analyze the evidence and provide a structured JSON response with your decision, confidence score, reasoning, and reputation impact. Follow the resolution options defined in the dispute mediation prompt.
`;
        
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            temperature: 0.1,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: contextPrompt }
            ],
            response_format: { type: "json_object" },
        });

        const analysis = JSON.parse(completion.choices[0].message.content || "{}");
        
        // Auto-resolve if confidence high enough for this tier
        const autoResolveThreshold = args.tier === 1 ? 90 : 80;
        if (analysis.confidence >= autoResolveThreshold) {
            await ctx.runMutation(internal.disputes.resolveDispute, {
                disputeId: args.disputeId,
                resolution: analysis.decision,
                winnerAgentId: analysis.decision === "uphold" ? "provider" : analysis.decision === "refund" ? "client" : undefined,
            });
        } else if (analysis.escalationRecommendation !== "none") {
            // Escalate to next tier
            // TODO: implement escalation logic
        }
        
        return analysis;
    },
});
