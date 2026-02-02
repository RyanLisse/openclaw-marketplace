import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Skill Taxonomy Tool Cluster
 * Manages standardized skills and tags.
 */

// Search Skills: Autocomplete
export const search = query({
    args: {
        query: v.string(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        // Prefix search would be ideal, but for now we do simple loading or exact match
        // Real implementation should use a search index or robust filtering
        const skills = await ctx.db.query("skills")
            .withIndex("by_usage")
            .order("desc") // Most popular first
            .take(100); // Fetch top 100 and filter in memory for now (MVP)

        const q = args.query.toLowerCase();

        return skills
            .filter(s => s.name.toLowerCase().includes(q))
            .slice(0, args.limit || 10);
    },
});

// Add Skill: User defined or auto-extracted
export const addSkill = mutation({
    args: {
        name: v.string(),
        category: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Check existence (case insensitive normalization could be better)
        const existing = await ctx.db.query("skills")
            .withIndex("by_name", q => q.eq("name", args.name))
            .first();

        if (existing) {
            // Increment usage
            await ctx.db.patch(existing._id, {
                usageCount: existing.usageCount + 1,
            });
            return existing._id;
        }

        // Create new
        const id = await ctx.db.insert("skills", {
            name: args.name,
            category: args.category,
            usageCount: 1,
        });
        return id;
    },
});
